"""
SQLite-backed game state persistence for MLP Pony.

Provides a persistent store for game sessions, replacing Flask in-memory sessions.
Each game gets a UUID, stored in a SQLite database.
"""

import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "game_state.db")


def get_connection():
    """Get a database connection, creating tables if needed."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _ensure_tables(conn)
    return conn


def _ensure_tables(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS games (
            game_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            state TEXT NOT NULL
        )
    """)
    conn.commit()


def create_game(game_id, state):
    """Insert a new game state. Returns True if created."""
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO games (game_id, state) VALUES (?, ?)",
            (game_id, json.dumps(state))
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_game(game_id):
    """Get game state by ID. Returns dict or None."""
    conn = get_connection()
    row = conn.execute("SELECT state FROM games WHERE game_id = ?", (game_id,)).fetchone()
    conn.close()
    if row:
        return json.loads(row["state"])
    return None


def update_game(game_id, state):
    """Update game state. Returns True if updated."""
    conn = get_connection()
    result = conn.execute(
        "UPDATE games SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE game_id = ?",
        (json.dumps(state), game_id)
    )
    conn.commit()
    updated = result.rowcount > 0
    conn.close()
    return updated


def delete_game(game_id):
    """Delete a game. Returns True if deleted."""
    conn = get_connection()
    result = conn.execute("DELETE FROM games WHERE game_id = ?", (game_id,))
    conn.commit()
    deleted = result.rowcount > 0
    conn.close()
    return deleted


def list_games(limit=10):
    """List recent games. Returns list of dicts with game_id, created_at."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT game_id, created_at, updated_at FROM games ORDER BY updated_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [{"game_id": r["game_id"], "created_at": r["created_at"], "updated_at": r["updated_at"]}
            for r in rows]