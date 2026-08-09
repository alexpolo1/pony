"""
JSON API routes for React frontend.

Uses game_id cookies for session persistence.
"""

from flask import Blueprint, request, jsonify, make_response
from app.services.game_service import start_game, roll_scene, format_scene_data
from app.services.persistence import create_game, get_game, update_game, delete_game

api_bp = Blueprint("api", __name__)

GAME_COOKIE = "pony_game_id"


def _get_game_from_cookie():
    """Get game from cookie, return (response_modifier, game) tuple."""
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
    ponytype_idx = data.get("type")
    if ponytype_idx is None:
        return jsonify({"error": "Manglende pony type"}), 400
    ponytype_idx = int(ponytype_idx)
    tema_idx = int(data.get("tema", 0))

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


@api_bp.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint."""
    return jsonify({"ok": True, "game": "MLP Pony: Tails of Equestria"})