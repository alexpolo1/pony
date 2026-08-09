"""Voice normalization, matching, and API integration tests."""

import os
import sys
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import create_app
from app.game.voice_matcher import match_intent
from app.game.voice_normalizer import normalize_danish
from app.services import persistence
from app.services.speech_to_text import LocalFasterWhisperProvider, get_speech_to_text_provider


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


def test_local_stt_provider_can_be_selected(monkeypatch):
    monkeypatch.setenv("STT_PROVIDER", "local")
    monkeypatch.setenv("STT_MODEL", "test-model")
    provider = get_speech_to_text_provider()
    assert isinstance(provider, LocalFasterWhisperProvider)
    assert provider.model_name == "test-model"


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


def test_spoken_option_number_selects_one_of_the_four_buttons():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    choice_scene = client.post("/api/kast").get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={
            "scene_id": "1",
            "question_id": choice_scene["voice"]["question"]["id"],
            "text": "Jeg vælger mulighed to",
        },
    )
    data = response.get_json()["data"]
    assert data["intent"] == "choose_klog"
    assert data["next_action"]["choice_id"] == "interaction:klog"
    assert data["gameState"]["history"][-1]["selection"] == "Smør tandhjulene"


def test_text_endpoint_rejects_a_stale_scene():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "4", "text": "ja"},
    )
    assert response.status_code == 409
    assert response.get_json()["error"] == "stale_scene"


def test_no_match_gets_a_fun_fallback_and_continues_the_story():
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "0", "text": "en kæmpe lilla drage"},
    )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert not data["matched"]
    assert "sjovt svar" in data["child_response"]
    assert len(data["gameState"]["history"]) == 1
    assert len(client.get("/api/scene").get_json()["history"]) == 1


@patch("app.routes.api.classify_with_hermes")
def test_hermes_answers_about_scene_and_then_continues_game(hermes):
    hermes.return_value = {
        "scope": "game", "action": "answer", "choice_id": None, "intent": None,
        "confidence": 0.93, "reply": "Angel er Fluttershys lille hvide kanin.",
        "method": "hermes",
    }
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 1}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "0", "text": "Hvem er Angel?"},
    )
    data = response.get_json()["data"]
    assert data["matched"]
    assert data["match_method"] == "hermes"
    assert data["next_action"]["choice_id"] == "roll_scene"
    assert len(data["gameState"]["history"]) == 1
    assert len(client.get("/api/scene").get_json()["history"]) == 1


@patch("app.routes.api.classify_with_hermes")
def test_hermes_story_comment_returns_a_spoken_response_and_continues(hermes):
    hermes.return_value = {
        "scope": "game", "action": "answer", "choice_id": None, "intent": None,
        "confidence": 0.91, "reply": "Ja, de røde æbler ser lækre og sprøde ud!",
        "method": "hermes",
    }
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 2}).get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={"scene_id": "0", "text": "De æbler ser lækre ud"},
    )
    data = response.get_json()["data"]
    assert data["child_response"] == "Ja, de røde æbler ser lækre og sprøde ud!"
    assert len(data["gameState"]["history"]) == 1
    assert len(client.get("/api/scene").get_json()["history"]) == 1


@patch("app.routes.api.classify_with_hermes")
def test_a_comment_also_continues_a_four_option_scene(hermes):
    hermes.return_value = {
        "scope": "game", "action": "answer", "choice_id": None, "intent": None,
        "confidence": 0.92, "reply": "Møllehjulet snurrer næsten som en fjollet karussel!",
        "method": "hermes",
    }
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    choice_scene = client.post("/api/kast").get_json()
    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={
            "scene_id": "1",
            "question_id": choice_scene["voice"]["question"]["id"],
            "text": "Det ligner en karussel",
        },
    )
    data = response.get_json()["data"]
    assert data["child_response"] == "Møllehjulet snurrer næsten som en fjollet karussel!"
    assert data["gameState"]["interactionProgressed"]
    assert len(data["gameState"]["history"]) == 2


@patch("app.routes.api.classify_with_hermes")
def test_hermes_must_not_say_the_game_waits_when_voice_always_continues(hermes):
    hermes.return_value = {
        "scope": "game", "action": "answer", "choice_id": None, "intent": None,
        "confidence": 0.95,
        "reply": "Vi kan vente, til du er klar til at gætte igen.",
        "method": "hermes",
    }
    client = make_client()
    started = client.post("/api/start", json={"type": 0, "tema": 0}).get_json()
    client.post("/api/kast")
    choice = client.get("/api/scene").get_json()
    client.post("/api/interact", json={"selection": choice["interaction"]["options"][0]["id"]})
    color = client.get("/api/scene").get_json()

    response = client.post(
        f"/api/v1/games/{started['gameId']}/voice/text",
        json={
            "scene_id": "2",
            "question_id": color["voice"]["question"]["id"],
            "text": "Det ved jeg ikke",
        },
    )
    data = response.get_json()["data"]
    assert "vente" not in data["child_response"]
    assert "videre" in data["child_response"]
    assert data["gameState"]["interactionProgressed"]
