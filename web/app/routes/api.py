"""
JSON API routes for React frontend.

Uses game_id cookies for session persistence.
"""

from flask import Blueprint, request, jsonify, make_response
from app.services.game_service import start_game, roll_scene, format_scene_data
from app.services.persistence import create_game, get_game, update_game, delete_game
from app.data.themes import THEMAER
from app.game.pony import PONITYPER

api_bp = Blueprint("api", __name__)

GAME_COOKIE = "pony_game_id"


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