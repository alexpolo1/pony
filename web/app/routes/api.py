"""
JSON API routes for React frontend.
"""

from flask import Blueprint, request, jsonify, session
from app.services.game_service import start_game, roll_scene, format_scene_data

api_bp = Blueprint("api", __name__)


@api_bp.route("/api/start", methods=["POST"])
def api_start():
    """Start a new game.

    Expects JSON: {"type": <pony_idx>, "tema": <theme_idx>}
    """
    data = request.get_json(force=True)
    ponytype_idx = data.get("type")
    if ponytype_idx is None:
        return jsonify({"error": "Manglende pony type"}), 400
    ponytype_idx = int(ponytype_idx)
    tema_idx = int(data.get("tema", 0))

    game = start_game(ponytype_idx, tema_idx)
    session["spil"] = game
    return jsonify(format_scene_data(game))


@api_bp.route("/api/scene", methods=["GET"])
def api_scene():
    """Get current scene data."""
    game = session.get("spil")
    if not game:
        return jsonify({"error": "no game"}), 404
    return jsonify(format_scene_data(game))


@api_bp.route("/api/kast", methods=["POST"])
def api_kast():
    """Roll dice for current scene."""
    game = session.get("spil")
    if not game or game.get("færdig"):
        return jsonify({"error": "no game"}), 404

    game = roll_scene(game)
    session["spil"] = game
    return jsonify(format_scene_data(game))