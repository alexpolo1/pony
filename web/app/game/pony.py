"""
Pony types for MLP Pony: Tails of Equestria.

Each pony type has:
  - name (Danish)
  - emoji
  - bonus stat (krop, sind, charme, or alle)
  - description text
  - image filename
"""

PONITYPER = [
    {
        "id": "jordpony",
        "navn": "Jordpony",
        "emoji": "\U0001f434",
        "bonus": "krop",
        "tekst": "St\u00e6rk og dygtig!",
        "img": "jordpony.png",
    },
    {
        "id": "pegasus",
        "navn": "Pegasus",
        "emoji": "\U0001f985",
        "bonus": "krop",
        "tekst": "Flyver i himlen!",
        "img": "pegasus.png",
    },
    {
        "id": "enhjorning",
        "navn": "Enhj\u00f8rning",
        "emoji": "\U0001f984",
        "bonus": "sind",
        "tekst": "Har magisk horn!",
        "img": "enhjorning.png",
    },
    {
        "id": "alicorn",
        "navn": "Alicorn",
        "emoji": "\U0001f451",
        "bonus": "alle",
        "tekst": "Magi OG vinger!",
        "img": "alicorn.png",
    },
]

PONYNAMNE = [
    "Stjern", "Regnbue", "Glitter", "Silke", "M\u00e5ne", "Sol",
    "Blomst", "Kry", "Ly", "Dug", "Is", "Flint",
    "Torden", "Skum", "Ros", "Vind", "Skov", "B\u00e6k",
]

STAT_EMOJI = {"krop": "\U0001f4aa", "sind": "\U0001f9e0", "charme": "\u2764\ufe0f"}
STAT_NAVNE = {"krop": "Krop", "sind": "Sind", "charme": "Charme"}


def get_pony_type(index):
    """Get pony type by index (0-based)."""
    if 0 <= index < len(PONITYPER):
        return PONITYPER[index]
    return None


def apply_pony_bonus(stats, pony_type):
    """Apply a pony type's bonus to a stats dict.

    Stats dict has keys: krop, sind, charme.
    Returns a new dict with bonuses applied.
    """
    bonus = pony_type.get("bonus")
    result = dict(stats)
    if bonus == "krop":
        result["krop"] = min(result["krop"] + 1, 5)
    elif bonus == "sind":
        result["sind"] = min(result["sind"] + 1, 5)
    elif bonus == "alle":
        result["krop"] = min(result["krop"] + 1, 5)
        result["sind"] = min(result["sind"] + 1, 5)
        result["charme"] = min(result["charme"] + 1, 5)
    return result