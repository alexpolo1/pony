"""
Dice engine for MLP Pony: Tails of Equestria.

Single d6 system:
  - 1 terning per kast
  - Stat = target number (slå X eller mere for succes)
  - Talent giver +1 til target
  - Sv\u00e6rhed: let = ingen straf, normal = -1, sv\u00e6rt = -2
  - Hvis resultat >= target efter straf = succes

Eksempel: stat 3 + talent = target 4. Normal sv\u00e6rhed = -1.
  M\u00e5l = 3. Sl\u00e5 3+ p\u00e5 terningen = succes (66% chance).
"""

import random

DIFFICULTY_PENALTY = {
    "let": 0,
    "normal": 1,
    "svaert": 2,
}

DIFFICULTY_TEXT = {
    "let": "Nem \U0001f31f",
    "normal": "Lidt sv\u00e6rt \U0001f31f\U0001f31f",
    "svaert": "Sv\u00e6rt \U0001f31f\U0001f31f\U0001f31f",
}

SUCCESS_TEXTS = [
    "\u2b50 Fantastisk!",
    "\U0001f3af Super!",
    "\U0001f389 Fantastisk!",
    "\u2728 Flot!",
    "\U0001f441 Du klarede det!",
]

FAIL_TEXTS = [
    "\U0001f308 Godt fors\u00f8g!",
    "\U0001f3af N\u00e6sten!",
    "\U0001f44e Pr\u00f8v noget andet!",
    "\u2728 Du gjorde dit bedste!",
    "\U0001f3af Ponyer hj\u00e6lper hinanden!",
]


SUCCESS_TEXT = SUCCESS_TEXTS[0]
FAIL_TEXT = FAIL_TEXTS[0]


def _result_text(h):
    """Return a child-friendly result text for the outcome.

    Fixed (not random) on purpose: every result line is then a constant the
    server pre-renders with the Danish voice once, so the game never synthesizes
    at play time and never falls back to a robotic browser voice.
    """
    return SUCCESS_TEXT if h.get("succes") else FAIL_TEXT


def roll_d6(rng=None):
    """Roll a single six-sided die."""
    if rng is None:
        rng = random
    return rng.randint(1, 6)


def resolve_test(pony, stat, difficulty, rng=None):
    """Resolve a skill test for a pony.

    Args:
        pony: dict with stat values and optional 'talent' key
        stat: which stat to use ('krop', 'sind', 'charme')
        difficulty: 'let', 'normal', or 'svaert'
        rng: optional random.Random instance for deterministic testing

    Returns:
        dict with dice, passed
    """
    if rng is None:
        rng = random

    base = pony.get(stat, 2)
    talent_bonus = 1 if pony.get("talent") == stat else 0
    penalty = DIFFICULTY_PENALTY.get(difficulty, 0)

    # Higher stat = lower target = easier.
    # stat 2 -> target 4 (50%), stat 3 -> target 3 (67%), stat 4 -> target 2 (83%),
    # stat 5 -> target 1 (100%). Talent lowers target by 1, difficulty raises it.
    target = 6 - base + penalty - talent_bonus
    if target < 1:
        target = 1
    if target > 6:
        target = 6

    die = roll_d6(rng)
    passed = die >= target

    return {
        "dice": [die],
        "passed": passed,
    }