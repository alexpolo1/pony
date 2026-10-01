"""
JSON API routes for React frontend.

Uses game_id cookies for session persistence.
"""

import random
import re

from flask import Blueprint, current_app, request, jsonify, make_response, Response
from app.services.game_service import start_game, roll_scene, resolve_scene_interaction, format_scene_data
from app.services.persistence import create_game, get_game, update_game, delete_game, record_game_summary
from app.services.speech_to_text import get_speech_to_text_provider, SpeechToTextError
from app.services.text_to_speech import synthesize_danish, TextToSpeechError
from app.services.intent_classifier import classify_with_hermes
from app.game.voice_matcher import match_intent
from app.data.themes import THEMAER
from app.data.pixel_assets import get_scene_icon
from app.game.pony import PONITYPER

api_bp = Blueprint("api", __name__)

GAME_COOKIE = "pony_game_id"
MAX_AUDIO_BYTES = 10 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/ogg", "audio/wav", "audio/x-wav"}
MAX_NAVN_LENGTH = 20
MAX_TTS_TEXT_LENGTH = 2000
NON_CONTINUING_REPLY = re.compile(
    r"\b(?:vent|vente|venter|prøv igen|gæt igen|når du er klar|svar igen|svare igen)\b",
    re.IGNORECASE,
)


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


def _maybe_record_stats(game_id, game):
    """If the game just finished, record a summary for stats."""
    if game.get("færdig"):
        record_game_summary(game)


@api_bp.route("/api/start", methods=["POST"])
def api_start():
    """Start a new game.

    Expects JSON: {"type": <pony_idx>, "tema": <theme_idx>, "navn": <optional custom name>}
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

    custom_navn = None
    navn = data.get("navn")
    if navn is not None:
        if not isinstance(navn, str):
            return jsonify({"error": "Ugyldigt navn"}), 400
        navn = navn.strip()
        if len(navn) > MAX_NAVN_LENGTH:
            return jsonify({"error": "Navnet er for langt"}), 400
        custom_navn = navn or None

    game = start_game(ponytype_idx, tema_idx, custom_navn)
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
    scenes = game.get("tema", {}).get("scener", [])
    scene = scenes[game.get("scene", -1)] if 0 <= game.get("scene", -1) < len(scenes) else {}
    if (scene.get("interaction") or {}).get("type", "dice") != "dice":
        return jsonify({"error": "interaction_required"}), 409

    game = roll_scene(game)
    update_game(game_id, game)
    _maybe_record_stats(game_id, game)

    resp = make_response(jsonify(format_scene_data(game)))
    _set_game_cookie(resp, game_id)
    return resp


@api_bp.route("/api/interact", methods=["POST"])
def api_interact():
    """Apply one server-allowlisted story, colour, number, or memory choice."""
    game_id, game = _get_game_from_cookie()
    if not game or game.get("færdig"):
        return jsonify({"error": "no game"}), 404
    data = request.get_json(silent=True) or {}
    selection = data.get("selection")
    if not isinstance(selection, str) or len(selection) > 40:
        return jsonify({"error": "invalid_selection"}), 400
    game, interaction_result = resolve_scene_interaction(game, selection)
    if not interaction_result.get("accepted"):
        return jsonify({"error": interaction_result.get("error", "invalid_selection")}), 409
    update_game(game_id, game)
    _maybe_record_stats(game_id, game)
    state = format_scene_data(game)
    state["interactionFeedback"] = interaction_result.get("feedback")
    state["interactionCorrect"] = interaction_result.get("correct")
    state["interactionProgressed"] = interaction_result.get("progressed")
    return jsonify(state)


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
                "icon": get_scene_icon(t["id"]),
            }
            for t in THEMAER
        ],
    })


@api_bp.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint."""
    return jsonify({"ok": True, "game": "MLP Pony: Tails of Equestria"})


@api_bp.route("/api/stats", methods=["GET"])
def api_stats():
    """Return aggregated game statistics."""
    from app.services.persistence import get_stats_summary
    return jsonify(get_stats_summary())


@api_bp.route("/api/tts", methods=["POST"])
def api_text_to_speech():
    """Read child-facing text in Danish.  Uses Edge TTS (Christel) and, when
    that remote service is down, falls back to the offline Piper engine — so a
    voice is returned even during a Microsoft outage.  The content-type (MP3 vs
    WAV) follows whichever engine produced the audio."""
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not isinstance(text, str) or not text.strip() or len(text) > MAX_TTS_TEXT_LENGTH:
        return jsonify({"error": "invalid_text"}), 400
    try:
        result = synthesize_danish(text.strip())
    except TextToSpeechError:
        current_app.logger.exception("Danish TTS failed")
        return jsonify({"error": "tts_error"}), 503
    return Response(result.audio, mimetype=result.mimetype,
                   headers={"Cache-Control": "private, max-age=86400"})


def _active_voice_question(game):
    scenes = game.get("tema", {}).get("scener", [])
    scene_index = game.get("scene", -1)
    if game.get("færdig") or not 0 <= scene_index < len(scenes):
        return None
    voice = scenes[scene_index].get("voice") or {}
    return voice.get("question") if voice.get("enabled") else None


def _progress_after_voice(game, preferred_choice_id=None):
    """Advance one scene after speech without allowing the model to mutate game state."""
    scenes = game.get("tema", {}).get("scener", [])
    scene_index = game.get("scene", -1)
    if game.get("færdig") or not 0 <= scene_index < len(scenes):
        return game, None, None

    interaction = scenes[scene_index].get("interaction") or {"type": "dice"}
    if interaction.get("type", "dice") == "dice":
        game = roll_scene(game)
        return game, format_scene_data(game), {"type": "scene_choice", "choice_id": "roll_scene"}

    options = interaction.get("options", [])
    allowed_ids = {item.get("id") for item in options}
    preferred_selection = None
    if isinstance(preferred_choice_id, str) and preferred_choice_id.startswith("interaction:"):
        candidate = preferred_choice_id.split(":", 1)[1]
        if candidate in allowed_ids:
            preferred_selection = candidate

    # A spoken answer must always continue. For factual colour/number/memory
    # scenes, gently use the correct target if speech did not identify it.
    if interaction.get("type") == "choice":
        selection = preferred_selection or (options[0].get("id") if options else None)
    else:
        target = interaction.get("target")
        selection = preferred_selection if preferred_selection == target else target
        if selection not in allowed_ids:
            selection = options[0].get("id") if options else None
    if not selection:
        return game, None, None

    game, interaction_result = resolve_scene_interaction(game, selection)
    state = format_scene_data(game)
    state["interactionFeedback"] = interaction_result.get("feedback")
    state["interactionCorrect"] = interaction_result.get("correct")
    state["interactionProgressed"] = interaction_result.get("progressed")
    action = {"type": "scene_choice", "choice_id": f"interaction:{selection}"}
    return game, state, action


def _continuation_safe_reply(reply, interaction_type):
    """Never tell the child to wait when voice input always advances the game."""
    if not NON_CONTINUING_REPLY.search(reply):
        return reply
    replacements = {
        "color": "Farverne laver vist regnbueballade! Ponyerne finder den rigtige farve sammen, og eventyret suser videre.",
        "number": "Tallene leger gemmeleg! Ponyerne finder det rigtige tal sammen, og eventyret suser videre.",
        "memory": "Hukommelsen gemmer sig vist under en ponyhale! Ponyerne finder tallet sammen, og eventyret suser videre.",
    }
    return replacements.get(
        interaction_type,
        "Sikke en sjov ponytanke! Ponyerne fniser, og eventyret suser videre.",
    )


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
    hermes = None
    if not result.matched:
        hermes = classify_with_hermes(game, question, text)
        if hermes and hermes["confidence"] >= 0.75:
            if hermes["action"] == "choice":
                match_data.update({
                    "matched": True, "intent": hermes["intent"],
                    "confidence": hermes["confidence"], "method": "hermes",
                    "response_type": "creative_accepted",
                })
            else:
                match_data.update({
                    "matched": True, "intent": None,
                    "confidence": hermes["confidence"], "method": "hermes",
                    "response_type": "game_answer",
                })

    selected = next((item for item in intents if item.get("id") == match_data.get("intent")), None)
    retries = game.setdefault("voice_retries", {})
    retry_key = question["id"]
    child_response = question.get("fallback", {}).get(
        "retry_prompt", "Jeg hørte dig ikke helt. Vil du prøve igen?"
    )
    preferred_choice_id = None
    if match_data["matched"] and selected:
        retries[retry_key] = 0
        responses = selected.get("positive_response") or ["Ja! Lad os gøre det!"]
        child_response = hermes["reply"] if hermes and hermes.get("reply") else random.choice(responses)
        preferred_choice_id = selected.get("choice_id")
    elif hermes and hermes.get("confidence", 0) >= 0.75:
        retries[retry_key] = 0
        child_response = hermes.get("reply") or child_response
        preferred_choice_id = hermes.get("choice_id")
    else:
        retries[retry_key] = 0
        pony_name = game.get("pony", {}).get("navn", "Ponyen")
        child_response = f"Sikke et sjovt svar! {pony_name} fniser, og pony-eventyret suser videre."

    scenes = game.get("tema", {}).get("scener", [])
    scene_index = game.get("scene", -1)
    interaction = (
        scenes[scene_index].get("interaction") or {"type": "dice"}
        if 0 <= scene_index < len(scenes) else {"type": "dice"}
    )
    target_choice = f"interaction:{interaction.get('target')}"
    if (interaction.get("type") not in {"dice", "choice"}
            and preferred_choice_id and preferred_choice_id != target_choice):
        child_response = "Det var et sjovt bud! Ponyerne fniser og finder løsningen sammen med dig."
    child_response = _continuation_safe_reply(child_response, interaction.get("type", "dice"))

    game, game_state, next_action = _progress_after_voice(game, preferred_choice_id)
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
