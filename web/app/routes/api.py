"""
JSON API routes for React frontend.

Uses game_id cookies for session persistence.
"""

import random

from flask import Blueprint, current_app, request, jsonify, make_response
from app.services.game_service import start_game, roll_scene, format_scene_data
from app.services.persistence import create_game, get_game, update_game, delete_game
from app.services.speech_to_text import get_speech_to_text_provider, SpeechToTextError
from app.services.intent_classifier import classify_with_qwen
from app.game.voice_matcher import match_intent
from app.data.themes import THEMAER
from app.game.pony import PONITYPER

api_bp = Blueprint("api", __name__)

GAME_COOKIE = "pony_game_id"
MAX_AUDIO_BYTES = 10 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/ogg", "audio/wav", "audio/x-wav"}


def _get_game_from_cookie():
    """Get game from cookie, return (game_id, game) tuple."""
    game_id = request.cookies.get(GAME_COOKIE)
    if not game_id:
        return None, None
    game = get_game(game_id)
    return game_id, game


def _set_game_cookie(response, game_id):
    """Add game_id cookie to response."""
    response.set_cookie(GAME_COOKIE, game_id, max_age=86400, httponly=True)
    return response


@api_bp.route("/api/start", methods=["POST"])
def api_start():
    """Start a new game.

    Expects JSON: {"type": <pony_idx>, "tema": <theme_idx>}
    Returns game state with game_id cookie.
    """
    data = request.get_json(force=True)
    if not data or "type" not in data:
        return jsonify({"error": "Manglende pony type"}), 400
    try:
        ponytype_idx = int(data["type"])
        tema_idx = int(data.get("tema", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Ugyldig input"}), 400
    if not (0 <= ponytype_idx < len(PONITYPER)):
        return jsonify({"error": "Ukendt pony type"}), 400
    if not (0 <= tema_idx < len(THEMAER)):
        return jsonify({"error": "Ukendt tema"}), 400

    game = start_game(ponytype_idx, tema_idx)
    game_id = game["game_id"]

    # Delete old game if exists
    old_game = get_game(game_id)
    if old_game:
        delete_game(game_id)

    create_game(game_id, game)

    resp = make_response(jsonify(format_scene_data(game)))
    _set_game_cookie(resp, game_id)
    return resp


@api_bp.route("/api/scene", methods=["GET"])
def api_scene():
    """Get current scene data."""
    game_id, game = _get_game_from_cookie()
    if not game:
        return jsonify({"error": "no game"}), 404
    return jsonify(format_scene_data(game))


@api_bp.route("/api/kast", methods=["POST"])
def api_kast():
    """Roll dice for current scene."""
    game_id, game = _get_game_from_cookie()
    if not game or game.get("færdig"):
        return jsonify({"error": "no game"}), 404

    game = roll_scene(game)
    update_game(game_id, game)

    resp = make_response(jsonify(format_scene_data(game)))
    _set_game_cookie(resp, game_id)
    return resp


@api_bp.route("/api/reset", methods=["POST"])
def api_reset():
    """Reset current game."""
    game_id, game = _get_game_from_cookie()
    if game_id:
        delete_game(game_id)
    resp = make_response(jsonify({"ok": True}))
    resp.delete_cookie(GAME_COOKIE)
    return resp


@api_bp.route("/api/content", methods=["GET"])
def api_content():
    """Get all game metadata: pony types and themes.

    Used by frontend to render selection pages dynamically.
    """
    return jsonify({
        "ponies": [
            {
                "id": p["id"],
                "navn": p["navn"],
                "emoji": p["emoji"],
                "bonus": p["bonus"],
                "tekst": p["tekst"],
                "img": p["img"],
            }
            for p in PONITYPER
        ],
        "themes": [
            {
                "id": t["id"],
                "titel": t["titel"],
                "emoji": t.get("emoji", ""),
                "intro": t.get("intro", ""),
                "sceneCount": len(t.get("scener", [])),
            }
            for t in THEMAER
        ],
    })


@api_bp.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint."""
    return jsonify({"ok": True, "game": "MLP Pony: Tails of Equestria"})


def _active_voice_question(game):
    scenes = game.get("tema", {}).get("scener", [])
    scene_index = game.get("scene", -1)
    if game.get("færdig") or not 0 <= scene_index < len(scenes):
        return None
    voice = scenes[scene_index].get("voice") or {}
    return voice.get("question") if voice.get("enabled") else None


def _handle_voice_text(game_id, game, text, scene_id=None, question_id=None, transcript_meta=None):
    question = _active_voice_question(game)
    if not question:
        return jsonify({"ok": False, "error": "voice_not_available"}), 409
    current_scene_id = str(game.get("scene"))
    if scene_id is not None and str(scene_id) != current_scene_id:
        return jsonify({"ok": False, "error": "stale_scene"}), 409
    if question_id and question_id != question.get("id"):
        return jsonify({"ok": False, "error": "stale_question"}), 409
    if not isinstance(text, str) or not text.strip() or len(text) > 500:
        return jsonify({"ok": False, "error": "invalid_transcript"}), 400

    intents = question.get("intents", [])
    result = match_intent(text, intents)
    match_data = result.to_dict()
    current_app.logger.debug("Voice match game=%s question=%s result=%r", game_id, question["id"], match_data)
    if not result.matched:
        llm = classify_with_qwen(question.get("text", ""), text, intents)
        if llm and llm["confidence"] >= 0.8:
            match_data.update({
                "matched": True, "intent": llm["intent"], "confidence": llm["confidence"],
                "method": "llm", "response_type": "creative_accepted",
            })

    selected = next((item for item in intents if item.get("id") == match_data.get("intent")), None)
    retries = game.setdefault("voice_retries", {})
    retry_key = question["id"]
    child_response = question.get("fallback", {}).get(
        "retry_prompt", "Jeg hørte dig ikke helt. Vil du prøve igen?"
    )
    next_action = None
    game_state = None
    if match_data["matched"] and selected:
        retries[retry_key] = 0
        responses = selected.get("positive_response") or ["Ja! Lad os gøre det!"]
        child_response = random.choice(responses)
        choice_id = selected.get("choice_id")
        next_action = {"type": "scene_choice", "choice_id": choice_id}
        if choice_id == "roll_scene":
            game = roll_scene(game)
            game_state = format_scene_data(game)
        update_game(game_id, game)
    else:
        retries[retry_key] = retries.get(retry_key, 0) + 1
        fallback = question.get("fallback", {})
        if retries[retry_key] > fallback.get("max_retries", 2):
            match_data["show_visual_choices"] = True
        update_game(game_id, game)

    public_match = {key: value for key, value in match_data.items() if key != "scores"}
    data = {
        "transcript": text, **public_match, "child_response": child_response,
        "next_action": next_action, "gameState": game_state,
    }
    data["match_method"] = data.pop("method")
    if transcript_meta:
        data["transcription"] = transcript_meta
    return jsonify({"ok": True, "data": data})


@api_bp.route("/api/v1/games/<game_id>/voice/text", methods=["POST"])
def api_voice_text(game_id):
    """Match already-transcribed text; useful for development and non-audio clients."""
    game = get_game(game_id)
    if not game:
        return jsonify({"ok": False, "error": "game_not_found"}), 404
    data = request.get_json(silent=True) or {}
    return _handle_voice_text(
        game_id, game, data.get("text"), data.get("scene_id"), data.get("question_id")
    )


@api_bp.route("/api/v1/games/<game_id>/voice", methods=["POST"])
def api_voice(game_id):
    """Transcribe an audio answer, then match it against the active scene intents."""
    game = get_game(game_id)
    if not game:
        return jsonify({"ok": False, "error": "game_not_found"}), 404
    audio = request.files.get("audio")
    if not audio:
        return jsonify({"ok": False, "error": "missing_audio"}), 400
    if audio.mimetype not in ALLOWED_AUDIO_TYPES:
        return jsonify({"ok": False, "error": "unsupported_audio"}), 415
    audio_bytes = audio.read(MAX_AUDIO_BYTES + 1)
    if not audio_bytes or len(audio_bytes) > MAX_AUDIO_BYTES:
        return jsonify({"ok": False, "error": "invalid_audio_size"}), 413
    try:
        transcript = get_speech_to_text_provider().transcribe(
            audio_bytes, language="da", filename=audio.filename or "audio.webm",
            content_type=audio.mimetype,
        )
    except SpeechToTextError:
        return jsonify({
            "ok": False, "error": "stt_error",
            "child_response": "Jeg hørte dig ikke helt. Vil du prøve igen?",
        }), 503
    return _handle_voice_text(
        game_id, game, transcript.text, request.form.get("scene_id"),
        request.form.get("question_id"), transcript.to_dict(),
    )
