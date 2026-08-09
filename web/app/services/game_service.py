"""
Game service: orchestrates dice rolls, scene progression, and result formatting.
"""

from app.game.dice import resolve_test
from app.game.state import create_game
from app.data.pixel_assets import get_scene_icon


def start_game(pony_idx, tema_idx, custom_navn=None):
    """Start a new game. Returns game state dict."""
    return create_game(pony_idx, tema_idx, custom_navn)


def roll_scene(game):
    """Process a dice roll for the current scene.

    Args:
        game: current game state dict

    Returns:
        Updated game state dict
    """
    if game.get("færdig") or "tema" not in game:
        return game

    tema = game["tema"]
    scenes = tema.get("scener", [])
    if game["scene"] >= len(scenes):
        game["færdig"] = True
        return game

    scn = scenes[game["scene"]]
    stat = scn["stat"]
    svaer = scn["svaer"]

    pony = game["pony"]
    result = resolve_test(pony, stat, svaer)

    udfald = {
        "aktion": scn["aktion"],
        "stat": stat,
        "svaer": svaer,
        "dice": result["dice"],
        "succes": result["passed"],
        "tekst": scn["succes"] if result["passed"] else scn["fiasko"],
    }

    game["historie"].append(udfald)
    game["udfald_tekst"] = udfald["tekst"]

    if result["passed"]:
        game["succeser"] += 1
    else:
        game["fiaskoer"] += 1

    game["scene"] += 1

    if game["scene"] >= len(scenes):
        game["færdig"] = True

    return game


def resolve_scene_interaction(game, selection):
    """Validate a four-option interaction and progress only when permitted."""
    if game.get("færdig") or "tema" not in game:
        return game, {"accepted": False, "error": "game_finished"}
    scenes = game["tema"].get("scener", [])
    if game["scene"] >= len(scenes):
        return game, {"accepted": False, "error": "scene_missing"}
    scene = scenes[game["scene"]]
    interaction = scene.get("interaction") or {"type": "dice"}
    if interaction.get("type") == "dice":
        return game, {"accepted": False, "error": "dice_required"}
    option = next((item for item in interaction.get("options", []) if item.get("id") == selection), None)
    if not option:
        return game, {"accepted": False, "error": "invalid_selection"}

    interaction_type = interaction["type"]
    correct = interaction_type == "choice" or selection == interaction.get("target")
    if not correct:
        return game, {
            "accepted": True, "correct": False, "progressed": False,
            "feedback": f"Næsten! Prøv igen. {interaction['prompt']}",
            "selection": option.get("label", selection),
        }

    if interaction_type == "choice":
        story = f"{option.get('response', '')} {scene['succes']}".strip()
    else:
        story = f"Ja! Du fandt {option.get('label', selection)}. {scene['succes']}"
    outcome = {
        "aktion": scene["aktion"], "stat": scene["stat"], "svaer": scene["svaer"],
        "dice": [], "succeser": 1, "krav": 1, "succes": True, "tekst": story,
        "interaction_type": interaction_type, "selection": option.get("label", selection),
    }
    game["historie"].append(outcome)
    game["udfald_tekst"] = story
    game["succeser"] += 1
    game["scene"] += 1
    if game["scene"] >= len(scenes):
        game["færdig"] = True
    return game, {
        "accepted": True, "correct": True, "progressed": True,
        "feedback": f"Ja! Du valgte {option.get('label', selection)}.",
        "selection": option.get("label", selection),
    }


def format_scene_data(game):
    """Format game state for JSON API response.

    Returns a dict suitable for jsonify().
    """
    pony = game["pony"]
    tema = game.get("tema", {})
    scenes = tema.get("scener", []) if tema else []

    pony_img_map = {
        "Jordpony": "jordpony.png",
        "Pegasus": "pegasus.png",
        "Enhjørning": "enhjorning.png",
        "Alicorn": "alicorn.png",
    }

    diff_map = {
        "let": "Nem \U0001f31f",
        "normal": "Lidt sv\u00e6rt \U0001f31f\U0001f31f",
        "svaert": "Sv\u00e6rt \U0001f31f\U0001f31f\U0001f31f",
    }

    result = {
        "gameId": game.get("game_id"),
        "finished": game.get("færdig", False),
        "ponyName": pony.get("navn", ""),
        "ponyType": pony.get("type", ""),
        "ponyEmoji": pony.get("emoji", ""),
        "ponyImg": f"/static/images/{pony_img_map.get(pony.get('type', ''), 'jordpony.png')}",
        "ponyStats": {
            "krop": pony.get("krop", 2),
            "sind": pony.get("sind", 2),
            "charme": pony.get("charme", 2),
        },
        "talent": pony.get("talent", ""),
        "tema": tema.get("titel", ""),
        "themeIcon": get_scene_icon(tema.get("id", "")),
        "sceneNum": (
            "Eventyret er slut"
            if game.get("færdig")
            else f"Scene {game['scene'] + 1} af {len(scenes)}"
        ),
        "progress": f"\U0001f31f {'\u2b50' * game['succeser']} {'\u2606' * (len(scenes) - game['succeser'] - game['fiaskoer'])} \u274c {'\U0001f494' * game['fiaskoer']}",
        "history": [],
    }

    # Current scene data
    if not game.get("færdig") and game["scene"] < len(scenes):
        scn = scenes[game["scene"]]
        result["sceneText"] = scn.get("tekst", "")
        result["actionText"] = scn.get("aktion", "")
        result["difficulty"] = diff_map.get(scn.get("svaer", ""), "")
        result["voice"] = scn.get("voice")
        interaction = scn.get("interaction", {"type": "dice"})
        result["interaction"] = {
            "type": interaction.get("type", "dice"),
            "prompt": interaction.get("prompt", ""),
            "options": [
                {key: option[key] for key in ("id", "label", "emoji", "color") if key in option}
                for option in interaction.get("options", [])
            ],
        }
    else:
        result["sceneText"] = ""
        result["actionText"] = ""
        result["difficulty"] = ""

    # History
    for h in game.get("historie", []):
        result["history"].append({
            "action": h.get("aktion", ""),
            "dice": h.get("dice", []),
            "success": h.get("succes", False),
            "result": "\u2705 Succes!" if h.get("succes") else "\U0001f308 Godt forsøg!",
            "story": h.get("tekst", ""),
            "interactionType": h.get("interaction_type", "dice"),
            "selection": h.get("selection"),
        })

    # End-of-game summary
    if game.get("færdig"):
        total = len(scenes)
        wins = game["succeser"]
        result["score"] = f"{wins} succeser ud af {total}"
        if wins >= total:
            result["victory"] = True
            result["endText"] = "Fantastisk! Du reddede Equestria! \U0001f31f"
        elif wins >= total // 2:
            result["mixed"] = True
            result["endText"] = "Flot eventyr! Ponyerne hjalp hinanden hele vejen til slutningen. \U0001f308"
        else:
            result["defeat"] = True
            result["endText"] = "I nåede sikkert gennem eventyret sammen. Det er ægte venskabsmagi! \U0001f308"

    return result
