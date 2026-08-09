"""
Dice engine for MLP Pony: Tails of Equestria.

d6 pool system:
  - 6 = 2 successes
  - 4-5 = 1 success
  - 1-3 = 0 successes

Difficulty thresholds:
  - let (easy) = 1 success needed
  - normal = 2 successes needed
  - svaert (hard) = 3 successes needed
"""

import random

DIFFICULTY_REQUIREMENTS = {
    "let": 1,
    "normal": 2,
    "svaert": 3,
}

DIFFICULTY_TEXT = {
    "let": "Nem \U0001f31f",
    "normal": "Lidt sv\u00e6rt \U0001f31f\U0001f31f",
    "svaert": "Sv\u00e6rt \U0001f31f\U0001f31f\U0001f31f",
}


def roll_d6(count, rng=None):
    """Roll N six-sided dice. Uses provided RNG or random module."""
    if rng is None:
        rng = random
    return [rng.randint(1, 6) for _ in range(count)]


def count_successes(dice):
    """Count successes from a list of d6 results.

    6 = 2 successes, 4-5 = 1 success, 1-3 = 0.
    """
    total = 0
    for d in dice:
        if d == 6:
            total += 2
        elif d >= 4:
            total += 1
    return total


def roll_and_evaluate(dice_count, difficulty, rng=None):
    """Roll dice and evaluate against difficulty.

    Returns dict with:
      - dice: list of rolled values
      - successes: total success count
      - required: successes needed for this difficulty
      - passed: whether the roll met the threshold
    """
    if dice_count < 0:
        dice_count = 0
    required = DIFFICULTY_REQUIREMENTS.get(difficulty, 2)
    dice = roll_d6(dice_count, rng)
    successes = count_successes(dice)
    return {
        "dice": dice,
        "successes": successes,
        "required": required,
        "passed": successes >= required,
    }


def resolve_test(pony, stat, difficulty, rng=None):
    """Resolve a skill test for a pony.

    Args:
        pony: dict with stat values and optional 'talent' key
        stat: which stat to use ('krop', 'sind', 'charme')
        difficulty: 'let', 'normal', or 'svaert'
        rng: optional random.Random instance for deterministic testing

    Returns:
        dict with dice, successes, required, passed
    """
    dice_count = pony.get(stat, 2)
    if pony.get("talent") == stat:
        dice_count += 1
    return roll_and_evaluate(dice_count, difficulty, rng)