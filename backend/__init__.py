import os
from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS
from .config import Config
from . import db as database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    extra = os.environ.get('CORS_ORIGINS', '')
    if extra:
        origins.extend(o.strip() for o in extra.split(',') if o.strip())
    CORS(app, supports_credentials=True, origins=origins)

    database.init_app(app)

    from .routes import auth, member, trainer, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(member.bp)
    app.register_blueprint(trainer.bp)
    app.register_blueprint(admin.bp)

    # Optional: serve built React app from Flask (set SERVING_FRONTEND=1 when deploying single server)
    dist_path = Path(__file__).resolve().parent.parent / 'frontend' / 'dist'
    if os.environ.get('SERVING_FRONTEND') == '1' and dist_path.exists():
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            if path.startswith('api/'):
                return {'error': 'Not found'}, 404
            if path and (dist_path / path).is_file():
                return send_from_directory(dist_path, path)
            return send_from_directory(dist_path, 'index.html')

    return app
