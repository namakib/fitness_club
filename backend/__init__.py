from flask import Flask
from flask_cors import CORS
from .config import Config
from . import db as database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True, origins=[
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ])

    database.init_app(app)

    from .routes import auth, member, trainer, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(member.bp)
    app.register_blueprint(trainer.bp)
    app.register_blueprint(admin.bp)

    return app
