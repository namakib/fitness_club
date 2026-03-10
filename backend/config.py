import getpass
import logging
import os


def _log_level_from_env():
    level = os.environ.get('LOG_LEVEL', '').upper()
    if level in ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'):
        return getattr(logging, level)
    env = os.environ.get('FLASK_ENV', 'development').lower()
    if env == 'production':
        return logging.WARNING
    return logging.DEBUG


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'fitness_club')
    DB_USER = os.environ.get('DB_USER', getpass.getuser())
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_APP_USER = os.environ.get('DB_APP_USER', 'fc_app')
    DB_APP_PASSWORD = os.environ.get('DB_APP_PASSWORD', 'fc_app_dev')
    DB_SSLMODE = os.environ.get('DB_SSLMODE', '')
    DEMO_MODE = os.environ.get('DEMO_MODE', '0') == '1'
    DEBUG_API_LOGGING = os.environ.get('DEBUG_API', '0') == '1'
    LOG_LEVEL = _log_level_from_env()
    # JWT token expiry (seconds)
    JWT_ACCESS_EXPIRES = int(os.environ.get('JWT_ACCESS_EXPIRES', '900'))
    JWT_REFRESH_EXPIRES = int(os.environ.get('JWT_REFRESH_EXPIRES', '604800'))
