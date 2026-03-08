import getpass
import os


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
    # Cross-origin session cookies (Vercel frontend -> Render backend)
    _cross_origin = os.environ.get('CORS_ORIGINS', '')
    SESSION_COOKIE_SAMESITE = 'None' if _cross_origin else 'Lax'
    SESSION_COOKIE_SECURE = bool(_cross_origin)
    SESSION_COOKIE_HTTPONLY = True
