import os

from flask import Flask
from .config import Config
from . import db as database

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_FRONTEND_DIR = os.path.join(_BASE_DIR, '..', 'frontend')


def create_app():
    app = Flask(
        __name__,
        template_folder=os.path.join(_FRONTEND_DIR, 'templates'),
        static_folder=os.path.join(_FRONTEND_DIR, 'static'),
    )
    app.config.from_object(Config)

    database.init_app(app)

    from .routes import auth, member, trainer, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(member.bp)
    app.register_blueprint(trainer.bp)
    app.register_blueprint(admin.bp)

    return app
