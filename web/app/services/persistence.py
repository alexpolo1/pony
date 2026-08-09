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
    conn.execute("""
        CREATE TABLE IF NOT EXISTS game_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            pony_type TEXT NOT NULL,
            tema_id TEXT NOT NULL,
            tema_title TEXT NOT NULL,
            successes INTEGER NOT NULL DEFAULT 0,
            failures INTEGER NOT NULL DEFAULT 0,
            total_scenes INTEGER NOT NULL DEFAULT 0,
            dice_rolls TEXT DEFAULT '[]',
            victory INTEGER NOT NULL DEFAULT 0,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


def record_game_summary(game):
    """Record a completed game's stats for analytics.

    Args:
        game: game state dict (must have 'færdig' == True)
    """
    pony = game.get("pony", {})
    tema = game.get("tema", {})
    tema_id = tema.get("id", "unknown")
    tema_title = tema.get("titel", "Unknown")
    scenes = tema.get("scener", [])

    # Collect dice rolls from history
    dice_rolls = []
    for h in game.get("historie", []):
        for d in h.get("dice", []):
            dice_rolls.append(d)

    conn = get_connection()
    conn.execute(
        """INSERT INTO game_stats
           (game_id, pony_type, tema_id, tema_title, successes, failures,
            total_scenes, dice_rolls, victory)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            game.get("game_id", ""),
            pony.get("type", "unknown"),
            tema_id,
            tema_title,
            game.get("succeser", 0),
            game.get("fiaskoer", 0),
            len(scenes),
            json.dumps(dice_rolls),
            1 if game.get("succeser", 0) >= len(scenes) else 0,
        )
    )
    conn.commit()
    conn.close()


def get_stats_summary():
    """Return aggregated game statistics.

    Returns dict with:
      - total_games, total_victories, win_rate
      - by_pony_type: list of {type, games, avg_successes, win_rate}
      - by_tema: list of {tema_id, tema_title, games, avg_successes, win_rate}
      - recent_games: last 10 completed games
    """
    conn = get_connection()

    row = conn.execute(
        "SELECT COUNT(*) as total, SUM(victory) as victories FROM game_stats"
    ).fetchone()
    total_games = row["total"] or 0
    total_victories = row["victories"] or 0

    by_pony = []
    for r in conn.execute(
        "SELECT pony_type, COUNT(*) as games, AVG(successes) as avg_s, "
        "SUM(victory) as wins FROM game_stats GROUP BY pony_type ORDER BY games DESC"
    ).fetchall():
        by_pony.append({
            "type": r["pony_type"],
            "games": r["games"],
            "avg_successes": round(r["avg_s"] or 0, 2),
            "win_rate": round((r["wins"] / r["games"] * 100) if r["games"] > 0 else 0, 1),
        })

    by_tema = []
    for r in conn.execute(
        "SELECT tema_id, tema_title, COUNT(*) as games, AVG(successes) as avg_s, "
        "SUM(victory) as wins FROM game_stats GROUP BY tema_id ORDER BY games DESC"
    ).fetchall():
        by_tema.append({
            "tema_id": r["tema_id"],
            "tema_title": r["tema_title"],
            "games": r["games"],
            "avg_successes": round(r["avg_s"] or 0, 2),
            "win_rate": round((r["wins"] / r["games"] * 100) if r["games"] > 0 else 0, 1),
        })

    recent = []
    for r in conn.execute(
        "SELECT game_id, pony_type, tema_title, successes, failures, "
        "total_scenes, victory, played_at FROM game_stats ORDER BY played_at DESC LIMIT 10"
    ).fetchall():
        recent.append({
            "game_id": r["game_id"],
            "pony_type": r["pony_type"],
            "tema": r["tema_title"],
            "successes": r["successes"],
            "failures": r["failures"],
            "total_scenes": r["total_scenes"],
            "victory": r["victory"],
            "played_at": r["played_at"],
        })

    conn.close()
    return {
        "total_games": total_games,
        "total_victories": total_victories,
        "win_rate": round((total_victories / total_games * 100) if total_games > 0 else 0, 1),
        "by_pony_type": by_pony,
        "by_tema": by_tema,
        "recent_games": recent,
    }