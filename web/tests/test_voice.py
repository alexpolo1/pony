"""Voice normalization, matching, and API integration tests."""

import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import create_app
from app.game.voice_matcher import match_intent
from app.game.voice_normalizer import normalize_danish
from app.services import persistence


INTENTS = [
    {"id": "forest", "keywords": ["skov", "skoven", "træer"], "synonyms": ["mellem træerne"]},
    {"id": "garden", "keywords": ["have", "haven", "blomster"]},
]


def make_client():
    persistence.DB_PATH = tempfile.mktemp()
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def test_normalizer_preserves_danish_letters():
    assert normalize_danish("  SKOVEN!! ÆØÅ  ") == "skoven æøå"


def test_matches_whole_word_in_child_sentence():
    result = match_intent("Jeg tror den er ved træer!", INTENTS)
    assert result.matched
    assert result.intent == "forest"
    assert result.method == "keyword"


def test_does_not_use_naive_substring_matching():
    result = match_intent("Vi skal behøve noget", [{"id": "sea", "keywords": ["sø"]}])
    assert not result.matched


def test_low_fuzzy_match_requests_clarification():
    result = match_intent("skåven", INTENTS)
    assert not result.matched
    assert result.response_type == "clarify"


def test_conflicting_intents_are_not_guessed():
    result = match_intent("skoven og haven", INTENTS)
    assert not result.matched
    assert result.response_type == "clarify"


def test_text_endpoint_can_progress_the_current_scene():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={
            "scene_id": "0",
            "question_id": started["voice"]["question"]["id"],
            "text": "Ja, jeg er klar!",
        },
    )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["matched"]
    assert data["intent"] == "ready"
    assert data["next_action"]["choice_id"] == "roll_scene"
    assert len(data["gameState"]["history"]) == 1


def test_text_endpoint_rejects_a_stale_scene():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "4", "text": "ja"},
    )
    assert response.status_code == 409
    assert response.get_json()["error"] == "stale_scene"


def test_no_match_never_blocks_the_dice_fallback():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "0", "text": "en kæmpe lilla drage"},
    )
    assert response.status_code == 200
    assert not response.get_json()["data"]["matched"]
    assert client.post("/api/kast").status_code == 200
