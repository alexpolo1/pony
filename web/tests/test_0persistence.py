"""
Tests for SQLite persistence layer.
"""

import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services import persistence

# Each test file gets its own temp DB
_TEST_DB = os.path.join(tempfile.gettempdir(), f"pony_persist_only_{os.getpid()}.db")
persistence.DB_PATH = _TEST_DB

TEST_GAME_ID = "test-uuid-123"
TEST_STATE = {"pony": {"navn": "Test"}, "scene": 0}


def setup_function():
    """Drop and recreate DB before each test."""
    if os.path.exists(_TEST_DB):
        os.remove(_TEST_DB)


class TestPersistence:
    def test_create_and_get(self):
        assert persistence.create_game(TEST_GAME_ID, TEST_STATE)
        state = persistence.get_game(TEST_GAME_ID)
        assert state == TEST_STATE

    def test_create_duplicate(self):
        persistence.create_game(TEST_GAME_ID, TEST_STATE)
        assert not persistence.create_game(TEST_GAME_ID, TEST_STATE)

    def test_get_nonexistent(self):
        assert persistence.get_game("no-such-id") is None

    def test_update(self):
        persistence.create_game(TEST_GAME_ID, TEST_STATE)
        new_state = dict(TEST_STATE)
        new_state["scene"] = 5
        assert persistence.update_game(TEST_GAME_ID, new_state)
        state = persistence.get_game(TEST_GAME_ID)
        assert state["scene"] == 5

    def test_update_nonexistent(self):
        assert not persistence.update_game("no-such-id", TEST_STATE)

    def test_delete(self):
        persistence.create_game(TEST_GAME_ID, TEST_STATE)
        assert persistence.delete_game(TEST_GAME_ID)
        assert persistence.get_game(TEST_GAME_ID) is None

    def test_delete_nonexistent(self):
        assert not persistence.delete_game("no-such-id")

    def test_list_games(self):
        persistence.create_game("a", TEST_STATE)
        persistence.create_game("b", TEST_STATE)
        games = persistence.list_games()
        assert len(games) == 2