"""
Game service: orchestrates dice rolls, scene progression, and result formatting.
"""

from app.game.dice import resolve_test
from app.game.state import create_game


def start_game(pony_idx, tema_idx):
    """Start a new game. Returns game state dict."""
    return create_game(pony_idx, tema_idx)


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
        "succeser": result["successes"],
        "krav": result["required"],
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
        "sceneNum": f"Scene {game['scene'] + 1} af {len(scenes)}",
        "progress": f"\U0001f31f {'\u2b50' * game['succeser']} {'\u2606' * (len(scenes) - game['succeser'] - game['fiaskoer'])} \u274c {'\U0001f494' * game['fiaskoer']}",
        "history": [],
    }

    # Current scene data
    if not game.get("færdig") and game["scene"] < len(scenes):
        scn = scenes[game["scene"]]
        result["sceneText"] = scn.get("tekst", "")
        result["actionText"] = scn.get("aktion", "")
        result["difficulty"] = diff_map.get(scn.get("svaer", ""), "")
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
            "result": "\u2705 Succes!" if h.get("succes") else "\u274c Mislykket",
            "story": h.get("tekst", ""),
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
            result["endText"] = "Du gjorde dit bedste! Prøv igen for at blive endnu bedre! \U0001f4aa"
        else:
            result["defeat"] = True
            result["endText"] = "Ingen panik! Alle ponies prøver igen! \U0001f308"

    return result