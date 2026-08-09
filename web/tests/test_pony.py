"""
Tests for pony type system.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.game.pony import PONITYPER, get_pony_type, apply_pony_bonus


class TestGetPonyType:
    def test_valid_indices(self):
        for i in range(4):
            pt = get_pony_type(i)
            assert pt is not None
            assert "navn" in pt

    def test_out_of_range(self):
        assert get_pony_type(-1) is None
        assert get_pony_type(4) is None
        assert get_pony_type(100) is None

    def test_four_types(self):
        assert len(PONITYPER) == 4


class TestApplyPonyBonus:
    def test_krop_bonus(self):
        stats = {"krop": 3, "sind": 3, "charme": 3}
        pony = {"bonus": "krop"}
        result = apply_pony_bonus(stats, pony)
        assert result["krop"] == 4
        assert result["sind"] == 3
        assert result["charme"] == 3

    def test_sind_bonus(self):
        stats = {"krop": 3, "sind": 3, "charme": 3}
        pony = {"bonus": "sind"}
        result = apply_pony_bonus(stats, pony)
        assert result["krop"] == 3
        assert result["sind"] == 4
        assert result["charme"] == 3

    def test_alle_bonus(self):
        stats = {"krop": 3, "sind": 3, "charme": 3}
        pony = {"bonus": "alle"}
        result = apply_pony_bonus(stats, pony)
        assert result["krop"] == 4
        assert result["sind"] == 4
        assert result["charme"] == 4

    def test_cap_at_5(self):
        stats = {"krop": 5, "sind": 5, "charme": 5}
        pony = {"bonus": "alle"}
        result = apply_pony_bonus(stats, pony)
        assert result["krop"] == 5
        assert result["sind"] == 5
        assert result["charme"] == 5

    def test_no_bonus(self):
        stats = {"krop": 3, "sind": 3, "charme": 3}
        pony = {"bonus": "nothing"}
        result = apply_pony_bonus(stats, pony)
        assert result["krop"] == 3
        assert result["sind"] == 3
        assert result["charme"] == 3