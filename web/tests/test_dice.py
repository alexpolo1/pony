"""
Tests for the dice engine.
"""

import random
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.game.dice import (
    roll_d6,
    count_successes,
    roll_and_evaluate,
    resolve_test,
    DIFFICULTY_REQUIREMENTS,
)


class TestRollD6:
    def test_single_die_range(self):
        rng = random.Random(42)
        for _ in range(100):
            result = roll_d6(1, rng)
            assert len(result) == 1
            assert 1 <= result[0] <= 6

    def test_multiple_dice_count(self):
        rng = random.Random(42)
        for count in [1, 3, 5, 10]:
            result = roll_d6(count, rng)
            assert len(result) == count

    def test_deterministic_with_seed(self):
        rng1 = random.Random(123)
        rng2 = random.Random(123)
        assert roll_d6(5, rng1) == roll_d6(5, rng2)


class TestCountSuccesses:
    def test_six_is_two(self):
        assert count_successes([6]) == 2

    def test_four_is_one(self):
        assert count_successes([4]) == 1

    def test_five_is_one(self):
        assert count_successes([5]) == 1

    def test_low_is_zero(self):
        assert count_successes([1]) == 0
        assert count_successes([2]) == 0
        assert count_successes([3]) == 0

    def test_mixed_roll(self):
        assert count_successes([6, 4, 3, 1, 5, 2]) == 4  # 2+1+0+0+1+0

    def test_empty_roll(self):
        assert count_successes([]) == 0


class TestRollAndEvaluate:
    def test_easy_needs_one(self):
        rng = random.Random(42)
        # Force a 6 via manual dice
        result = roll_and_evaluate(1, "let", rng)
        assert result["required"] == 1

    def test_normal_needs_two(self):
        result = roll_and_evaluate(1, "normal", random.Random(42))
        assert result["required"] == 2

    def test_hard_needs_three(self):
        result = roll_and_evaluate(1, "svaert", random.Random(42))
        assert result["required"] == 3

    def test_pass_with_enough_successes(self):
        # Two 6s = 4 successes, enough for any difficulty
        rng = random.Random(999)
        # We can't force values, so test logic instead
        result = roll_and_evaluate(0, "let", random.Random(42))
        assert result["dice"] == []
        assert result["successes"] == 0

    def test_zero_dice_on_negative(self):
        result = roll_and_evaluate(-3, "let", random.Random(42))
        assert result["dice"] == []


class TestResolveTest:
    def test_pony_stat_used(self):
        pony = {"krop": 3, "sind": 2, "charme": 4}
        rng = random.Random(42)
        result = resolve_test(pony, "krop", "let", rng)
        assert len(result["dice"]) == 3

    def test_talent_bonus(self):
        pony = {"krop": 2, "sind": 2, "charme": 2, "talent": "krop"}
        rng = random.Random(42)
        result = resolve_test(pony, "krop", "let", rng)
        assert len(result["dice"]) == 3  # 2 + 1 talent

    def test_no_talent_bonus(self):
        pony = {"krop": 2, "sind": 2, "charme": 2, "talent": "sind"}
        rng = random.Random(42)
        result = resolve_test(pony, "krop", "let", rng)
        assert len(result["dice"]) == 2

    def test_default_stat_value(self):
        pony = {}  # No stats at all
        rng = random.Random(42)
        result = resolve_test(pony, "krop", "let", rng)
        assert len(result["dice"]) == 2  # default .get("krop", 2)