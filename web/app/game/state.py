"""
Game state management for MLP Pony: Tails of Equestria.

Manages the full game state: pony, adventure, progress, and history.
"""

import random
import uuid

from app.data.themes import THEMAER
from app.game.pony import PONITYPER, PONYNAMNE, apply_pony_bonus


def create_game(pony_idx, tema_idx, custom_navn=None):
    """Create a new game state.

    Args:
        pony_idx: index into PONITYPER
        tema_idx: index into THEMAER
        custom_navn: optional player-chosen pony name, overrides the random one

    Returns:
        dict with full game state
    """
    pony_type = PONITYPER[pony_idx] if 0 <= pony_idx < len(PONITYPER) else PONITYPER[0]
    tema = THEMAER[tema_idx] if 0 <= tema_idx < len(THEMAER) else THEMAER[0]

    name = custom_navn or random.choice(PONYNAMNE) + random.choice([
        "hals", "støv", "ros", "vinge", "blomst", "fyr",
        "blik", "horn", "lys", "snude", "pels", "mane",
    ])

    base_stats = {
        "krop": random.randint(2, 4),
        "sind": random.randint(2, 4),
        "charme": random.randint(2, 4),
    }
    stats = apply_pony_bonus(base_stats, pony_type)

    talent = random.choice(["krop", "sind", "charme"])

    return {
        "game_id": str(uuid.uuid4()),
        "pony": {
            "navn": name,
            "type": pony_type["navn"],
            "emoji": pony_type["emoji"],
            "krop": stats["krop"],
            "sind": stats["sind"],
            "charme": stats["charme"],
            "talent": talent,
        },
        "tema": tema,
        "scene": 0,
        "historie": [],
        "succeser": 0,
        "fiaskoer": 0,
        "færdig": False,
        "udfald_tekst": None,
    }