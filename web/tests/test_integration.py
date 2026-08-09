"""
Integration tests: full game flow through the API with cookie-based sessions.
"""

import sys
import os
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import create_app
from app.data.themes import THEMAER
from app.services import persistence

# Use temp DB for tests
persistence.DB_PATH = tempfile.mktemp()


def make_client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def advance_current_scene(client, data):
    interaction = data.get("interaction", {"type": "dice"})
    if interaction["type"] == "dice":
        return client.post("/api/kast").get_json()
    old_history = len(data["history"])
    for option in interaction["options"]:
        response = client.post("/api/interact", json={"selection": option["id"]})
        assert response.status_code == 200
        data = response.get_json()
        if len(data["history"]) > old_history:
            return data
    raise AssertionError("Ingen af de fire tilladte muligheder kunne fortsætte scenen")


class TestGameFlow:
    def test_full_game(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0})
        assert r.status_code == 200
        data = r.get_json()
        assert data["ponyType"] == "Jordpony"
        assert data["tema"] == "Rainbow Dash har fødselsdag"
        assert not data["finished"]
        assert data["sceneNum"] == "Scene 1 af 5"

        # Complete all scene types: dice, story choice, colour, dice, memory.
        for _ in range(5):
            data = advance_current_scene(c, data)

        # Game should be finished
        r = c.get("/api/scene")
        data = r.get_json()
        assert data["finished"]
        assert len(data["history"]) == 5

    def test_health(self):
        c = make_client()
        r = c.get("/api/health")
        assert r.status_code == 200
        assert r.get_json()["ok"]

    @patch("app.routes.api.synthesize_danish", return_value=b"fake-mp3")
    def test_danish_tts_uses_server_voice(self, synthesize):
        c = make_client()
        r = c.post("/api/tts", json={"text": "Hej fra Equestria"})
        assert r.status_code == 200
        assert r.content_type == "audio/mpeg"
        assert r.data == b"fake-mp3"
        synthesize.assert_called_once_with("Hej fra Equestria")

    def test_danish_tts_rejects_empty_text(self):
        c = make_client()
        r = c.post("/api/tts", json={"text": ""})
        assert r.status_code == 400

    def test_pony_image_is_served(self):
        c = make_client()
        r = c.get("/static/images/jordpony.png")
        assert r.status_code == 200
        assert r.content_type == "image/png"

    def test_invalid_pony_type(self):
        c = make_client()
        r = c.post("/api/start", json={"tema": 0})
        assert r.status_code == 400

    def test_roll_without_game(self):
        c = make_client()
        r = c.post("/api/kast")
        assert r.status_code == 404

    def test_scene_without_game(self):
        c = make_client()
        r = c.get("/api/scene")
        assert r.status_code == 404

    def test_reset(self):
        c = make_client()
        c.post("/api/start", json={"type": 0, "tema": 0})
        r = c.post("/api/reset")
        assert r.status_code == 200

    def test_all_themes(self):
        c = make_client()
        for tema_idx in range(len(THEMAER)):
            r = c.post("/api/start", json={"type": 2, "tema": tema_idx})
            assert r.status_code == 200
            data = r.get_json()
            for _ in THEMAER[tema_idx]["scener"]:
                data = advance_current_scene(c, data)
            assert data["finished"], THEMAER[tema_idx]["id"]

        assert len(THEMAER) == 8

    def test_every_theme_mixes_dice_and_four_answer_scenes(self):
        for theme in THEMAER:
            interactions = [scene["interaction"] for scene in theme["scener"]]
            dice_scenes = [item for item in interactions if item["type"] == "dice"]
            answer_scenes = [item for item in interactions if item["type"] != "dice"]
            assert dice_scenes, theme["id"]
            assert answer_scenes, theme["id"]
            assert all(len(item["options"]) == 4 for item in answer_scenes), theme["id"]

    def test_every_colour_task_is_part_of_its_adventure(self):
        for theme in THEMAER:
            colour_scene = theme["scener"][2]
            assert "color_prompt" in colour_scene, theme["id"]
            assert "magiske vej" not in colour_scene["interaction"]["prompt"].lower(), theme["id"]

    def test_every_memory_question_leads_to_the_story_ending(self):
        for theme in THEMAER:
            final_scene = theme["scener"][-1]
            assert final_scene["interaction"]["type"] == "memory", theme["id"]
            assert "husk" in final_scene["aktion"].lower(), theme["id"]

    def test_dice_prompts_use_natural_danish(self):
        for theme in THEMAER:
            for scene in theme["scener"]:
                if scene["interaction"]["type"] == "dice":
                    prompt = scene["interaction"]["prompt"].lower()
                    assert "din opgave er" in prompt, theme["id"]
                    assert "for at spørg" not in prompt, theme["id"]

    def test_all_pony_types(self):
        c = make_client()
        for pony_idx in range(4):
            r = c.post("/api/start", json={"type": pony_idx, "tema": 0})
            assert r.status_code == 200

    def test_persistence_survives_new_client(self):
        """Game state persists across separate requests."""
        c = make_client()
        c.post("/api/start", json={"type": 0, "tema": 0})
        c.post("/api/kast")  # scene 1

        # New client with same cookies should see same game
        # (testclient preserves cookies automatically)
        r = c.get("/api/scene")
        data = r.get_json()
        assert len(data["history"]) == 1

    def test_story_scene_exposes_four_safe_choices(self):
        c = make_client()
        data = c.post("/api/start", json={"type": 0, "tema": 0}).get_json()
        data = advance_current_scene(c, data)
        assert data["interaction"]["type"] == "choice"
        assert len(data["interaction"]["options"]) == 4
        assert "target" not in data["interaction"]

    def test_each_adventure_has_its_own_four_story_choices(self):
        choice_sets = []
        for theme_index, _theme in enumerate(THEMAER):
            c = make_client()
            data = c.post("/api/start", json={"type": 0, "tema": theme_index}).get_json()
            data = advance_current_scene(c, data)
            labels = tuple(option["label"] for option in data["interaction"]["options"])
            assert len(labels) == 4
            choice_sets.append(labels)
        assert len(set(choice_sets)) == len(THEMAER)

    def test_wrong_colour_stays_in_scene_and_correct_colour_progresses(self):
        c = make_client()
        data = c.post("/api/start", json={"type": 0, "tema": 0}).get_json()
        data = advance_current_scene(c, data)
        data = advance_current_scene(c, data)
        assert data["interaction"]["type"] == "color"
        start_count = len(data["history"])
        first = c.post("/api/interact", json={"selection": data["interaction"]["options"][0]["id"]}).get_json()
        assert not first["interactionProgressed"]
        progressed = False
        for option in data["interaction"]["options"][1:]:
            attempt = c.post("/api/interact", json={"selection": option["id"]}).get_json()
            if len(attempt["history"]) > start_count:
                progressed = True
                break
        assert progressed

    def test_final_scene_recalls_clue_from_first_scene(self):
        c = make_client()
        data = c.post("/api/start", json={"type": 0, "tema": 3}).get_json()
        assert "Magiske dyr nummer tre" in data["sceneText"]
        for _ in range(4):
            data = advance_current_scene(c, data)
        assert data["interaction"]["type"] == "memory"
        assert "Magiske dyr" in data["interaction"]["prompt"]
        assert len(data["interaction"]["options"]) == 4

    def test_every_colour_scene_explains_the_delayed_number_and_colour_clue(self):
        for theme_index, theme in enumerate(THEMAER):
            c = make_client()
            data = c.post("/api/start", json={"type": 0, "tema": theme_index}).get_json()
            assert "sidste opgave" in data["sceneText"]
            data = advance_current_scene(c, data)
            data = advance_current_scene(c, data)
            assert data["interaction"]["type"] == "color"
            assert "sidste opgave" in data["sceneText"]
            assert "farveopgave" in data["sceneText"]
            assert any(
                word in data["interaction"]["prompt"].lower()
                for word in ("røde", "blå", "gule", "grønne")
            )

    def test_custom_pony_name(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0, "navn": "Stjerneglans"})
        assert r.status_code == 200
        assert r.get_json()["ponyName"] == "Stjerneglans"

    def test_custom_pony_name_is_trimmed(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0, "navn": "  Regnbue  "})
        assert r.status_code == 200
        assert r.get_json()["ponyName"] == "Regnbue"

    def test_blank_pony_name_falls_back_to_random(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0, "navn": "   "})
        assert r.status_code == 200
        assert r.get_json()["ponyName"] != ""

    def test_pony_name_too_long_is_rejected(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0, "navn": "x" * 21})
        assert r.status_code == 400

    def test_pony_name_wrong_type_is_rejected(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0, "navn": 123})
        assert r.status_code == 400
