import getpass
import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'fitness_club')
    DB_USER = os.environ.get('DB_USER', getpass.getuser())
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    # RBAC: app connects as fc_app role (set after running sql/RBAC.sql)
    DB_APP_USER = os.environ.get('DB_APP_USER', 'fc_app')
    DB_APP_PASSWORD = os.environ.get('DB_APP_PASSWORD', 'fc_app_dev')
