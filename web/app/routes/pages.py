"""
Legacy HTML page routes (Jinja2 templates).
Kept for backward compatibility.
"""

from flask import Blueprint, render_template, redirect, url_for, request, session
from app.services.game_service import start_game, roll_scene

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def index():
    return render_template("index.html")


@pages_bp.route("/start", methods=["GET", "POST"])
def start():
    if request.method == "POST":
        from app.game.pony import PONITYPER
        from app.data.themes import THEMAER

        ponytype_idx = int(request.form.get("type", 0))
        tema_idx = int(request.form.get("tema", 0))

        game = start_game(ponytype_idx, tema_idx)
        session["spil"] = game
        return redirect(url_for("pages.scene"))
    return render_template("start.html",
                           ponytyper=PONITYPER,
                           themaer=THEMAER,
                           enumerate=enumerate)


@pages_bp.route("/scene")
def scene():
    game = session.get("spil")
    if not game:
        return redirect(url_for("pages.start"))
    return render_template("spil.html", sp=game)


@pages_bp.route("/kast", methods=["POST"])
def kast():
    game = session.get("spil")
    if not game or game.get("færdig"):
        return redirect(url_for("pages.start"))

    game = roll_scene(game)
    session["spil"] = game
    return redirect(url_for("pages.scene"))


@pages_bp.route("/igen")
def igen():
    session.pop("spil", None)
    return redirect(url_for("pages.start"))