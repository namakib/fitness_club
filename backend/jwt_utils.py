"""JWT token creation and verification utilities."""

import time

import jwt


def create_access_token(user_id, role, secret_key, expires_in):
    payload = {
        'sub': str(user_id),
        'role': role,
        'type': 'access',
        'iat': int(time.time()),
        'exp': int(time.time()) + expires_in,
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def create_refresh_token(user_id, role, secret_key, expires_in):
    payload = {
        'sub': str(user_id),
        'role': role,
        'type': 'refresh',
        'iat': int(time.time()),
        'exp': int(time.time()) + expires_in,
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def decode_token(token, secret_key):
    """Decode and verify a JWT. Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError."""
    return jwt.decode(token, secret_key, algorithms=['HS256'])
