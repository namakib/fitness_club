from flask import Flask
from .config import Config
from . import db as database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    database.init_app(app)

    from .routes import auth, member, trainer, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(member.bp)
    app.register_blueprint(trainer.bp)
    app.register_blueprint(admin.bp)

    return app
