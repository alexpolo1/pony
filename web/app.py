#!/usr/bin/env python3
"""
My Little Pony: Tails of Equestria - Interaktivt Web Spil
For 4-årige: stort, farvegt, simpelt, én scene ad gangen.

Entry point: python3 app.py
Runs Flask on port 5001 by default.
"""

import sys
import os

# Ensure the web directory is in the path so 'app' package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.config import create_app

app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.environ.get("PONY_HOST", "127.0.0.1"),
        port=int(os.environ.get("PONY_PORT", "5001")),
        debug=os.environ.get("PONY_DEBUG", "").lower() in {"1", "true", "yes"},
    )
