"""
Integration tests: full game flow through the API with cookie-based sessions.
"""

import sys
import os
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import create_app
from app.services import persistence

# Use temp DB for tests
persistence.DB_PATH = tempfile.mktemp()


def make_client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


class TestGameFlow:
    def test_full_game(self):
        c = make_client()
        r = c.post("/api/start", json={"type": 0, "tema": 0})
        assert r.status_code == 200
        data = r.get_json()
        assert data["ponyType"] == "Jordpony"
        assert data["tema"] == "Regnbues fødselsdag"
        assert not data["finished"]
        assert data["sceneNum"] == "Scene 1 af 5"

        # Roll through all 5 scenes
        for _ in range(5):
            r = c.post("/api/kast")
            assert r.status_code == 200

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
        for tema_idx in range(5):
            r = c.post("/api/start", json={"type": 2, "tema": tema_idx})
            assert r.status_code == 200

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
