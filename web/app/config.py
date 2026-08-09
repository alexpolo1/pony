"""
Flask application factory for MLP Pony: Tails of Equestria.
"""

import os
from flask import Flask
from flask_cors import CORS


def create_app(config_name=None):
    """Application factory.

    Args:
        config_name: 'development', 'testing', or 'production'

    Returns:
        Configured Flask app
    """
    app = Flask(__name__)

    # Secret key
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "equestria_magic_key_12345")

    # CORS for React frontend
    CORS(app, supports_credentials=True)

    # Register routes
    from app.routes.api import api_bp
    app.register_blueprint(api_bp)

    from app.routes.pages import pages_bp
    app.register_blueprint(pages_bp)

    return app