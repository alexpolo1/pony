"""
Integration tests: full game flow through the API.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import create_app


def make_client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


class TestGameFlow:
    def test_full_game(self):
        c = make_client()
        # Start
        r = c.post("/api/start", json={"type": 0, "tema": 0})
        assert r.status_code == 200
        data = r.get_json()
        assert data["ponyType"] == "Jordpony"
        assert data["tema"] == "Regnbues fødselsdag"
        assert not data["finished"]
        assert data["sceneNum"] == "Scene 1 af 5"

        # Roll through all 5 scenes
        for _ in range(5):
            r = c.post("/api/kast")
            assert r.status_code == 200

        # After 5 rolls, game should be finished
        r = c.get("/api/scene")
        data = r.get_json()
        assert data["finished"]
        assert len(data["history"]) == 5

    def test_invalid_pony_type(self):
        c = make_client()
        r = c.post("/api/start", json={"tema": 0})
        assert r.status_code == 400

    def test_roll_without_game(self):
        c = make_client()
        r = c.post("/api/kast")
        assert r.status_code == 404

    def test_scene_without_game(self):
        c = make_client()
        r = c.get("/api/scene")
        assert r.status_code == 404

    def test_all_themes(self):
        c = make_client()
        for tema_idx in range(5):
            r = c.post("/api/start", json={"type": 2, "tema": tema_idx})
            assert r.status_code == 200
            data = r.get_json()
            assert not data["finished"]

    def test_all_pony_types(self):
        c = make_client()
        for pony_idx in range(4):
            r = c.post("/api/start", json={"type": pony_idx, "tema": 0})
            assert r.status_code == 200