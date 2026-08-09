"""
Tests for the single-d6 dice engine.

Formula: target = 6 - stat + penalty - talent_bonus (clamped 1-6)
"""

import random
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.game.dice import roll_d6, resolve_test, DIFFICULTY_PENALTY


class TestRollD6:
    def test_single_die_range(self):
        for _ in range(100):
            assert 1 <= roll_d6(random.Random(42)) <= 6

    def test_deterministic(self):
        assert roll_d6(random.Random(123)) == roll_d6(random.Random(123))


class TestDifficultyPenalty:
    def test_values(self):
        assert DIFFICULTY_PENALTY == {"let": 0, "normal": 1, "svaert": 2}


class TestResolveTest:
    def _rate(self, pony, stat, diff, n=100):
        return sum(
            1 for i in range(n)
            if resolve_test(pony, stat, diff, random.Random(i))["passed"]
        )

    def test_single_die(self):
        r = resolve_test({"krop": 4}, "krop", "let", random.Random(42))
        assert len(r["dice"]) == 1

    def test_default_stat(self):
        r = resolve_test({}, "krop", "let", random.Random(42))
        assert len(r["dice"]) == 1

    # stat 5, let: target = 6-5+0-0 = 1 -> 100%
    def test_stat5_let_always(self):
        assert self._rate({"krop": 5}, "krop", "let") == 100

    # stat 5 + talent, let: target = 6-5+0-1 = 0 -> clamped to 1 -> 100%
    def test_stat5_talent_let(self):
        assert self._rate({"krop": 5, "talent": "krop"}, "krop", "let") == 100

    # stat 4, let: target = 6-4 = 2 -> roll 2+ = 83%
    def test_stat4_let(self):
        assert 70 <= self._rate({"krop": 4}, "krop", "let") <= 95

    # stat 3, let: target = 6-3 = 3 -> roll 3+ = 67%
    def test_stat3_let(self):
        assert 50 <= self._rate({"krop": 3}, "krop", "let") <= 85

    # stat 2, let: target = 6-2 = 4 -> roll 4+ = 50%
    def test_stat2_let(self):
        assert 35 <= self._rate({"krop": 2}, "krop", "let") <= 65

    # stat 3, normal: target = 6-3+1 = 4 -> roll 4+ = 50%
    def test_stat3_normal(self):
        assert 35 <= self._rate({"krop": 3}, "krop", "normal") <= 65

    # stat 2, normal: target = 6-2+1 = 5 -> roll 5+ = 33%
    def test_stat2_normal(self):
        assert 20 <= self._rate({"krop": 2}, "krop", "normal") <= 50

    # stat 3, svaert: target = 6-3+2 = 5 -> roll 5+ = 33%
    def test_stat3_svaert(self):
        assert 20 <= self._rate({"krop": 3}, "krop", "svaert") <= 50

    # stat 2, svaert: target = 6-2+2 = 6 -> roll 6 = 17%
    def test_stat2_svaert(self):
        assert 5 <= self._rate({"krop": 2}, "krop", "svaert") <= 30

    # stat 4 + talent, svaert: target = 6-4+2-1 = 3 -> roll 3+ = 67%
    def test_talent_helps_hard(self):
        assert 50 <= self._rate({"krop": 4, "talent": "krop"}, "krop", "svaert") <= 85

    # stat 3 + talent, normal: target = 6-3+1-1 = 3 -> roll 3+ = 67%
    def test_talent_helps_normal(self):
        assert 50 <= self._rate({"krop": 3, "talent": "krop"}, "krop", "normal") <= 85

    # talent on wrong stat: no bonus
    def test_no_talent_wrong_stat(self):
        pony = {"krop": 3, "talent": "sind"}
        assert self._rate(pony, "krop", "let") == self._rate({"krop": 3}, "krop", "let")