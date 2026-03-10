import functools
import logging
import os

from flask import Blueprint, current_app, g, jsonify, make_response, request

logger = logging.getLogger(__name__)
from werkzeug.security import check_password_hash, generate_password_hash

from ..db import apply_role, get_cursor, get_db, serialize_row
from ..errors import (
    AUTH_001,
    AUTH_002,
    AUTH_003,
    AUTH_004,
    AUTH_005,
    AUTH_006,
    VAL_001,
    VAL_002,
    VAL_003,
    VAL_004,
    VAL_005,
    VAL_011,
    VAL_012,
    make_error,
)
from ..jwt_utils import create_access_token, create_refresh_token, decode_token

bp = Blueprint('auth', __name__, url_prefix='/api')


def login_required(view):
    @functools.wraps(view)
    def wrapped(**kwargs):
        if g.user is None:
            body, status = make_error(AUTH_001)
            return jsonify(body), status
        return view(**kwargs)
    return wrapped


def role_required(role):
    def decorator(view):
        @functools.wraps(view)
        def wrapped(**kwargs):
            if g.user is None:
                body, status = make_error(AUTH_001)
                return jsonify(body), status
            if g.role != role:
                body, status = make_error(AUTH_002)
                return jsonify(body), status
            return view(**kwargs)
        return wrapped
    return decorator


def _is_cross_origin():
    return bool(os.environ.get('CORS_ORIGINS', ''))


def _set_refresh_cookie(resp, token):
    cross_origin = _is_cross_origin()
    resp.set_cookie(
        'fc_refresh_token',
        token,
        httponly=True,
        secure=cross_origin,
        samesite='None' if cross_origin else 'Lax',
        max_age=current_app.config['JWT_REFRESH_EXPIRES'],
        path='/api',
    )


def _clear_refresh_cookie(resp):
    cross_origin = _is_cross_origin()
    resp.delete_cookie(
        'fc_refresh_token',
        path='/api',
        samesite='None' if cross_origin else 'Lax',
        secure=cross_origin,
    )


@bp.before_app_request
def load_logged_in_user():
    g.user = None
    g.role = None

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return

    token = auth_header[7:]
    try:
        payload = decode_token(token, current_app.config['SECRET_KEY'])
    except Exception:
        return

    if payload.get('type') != 'access':
        return

    raw_id = payload.get('sub')
    role = payload.get('role')
    if raw_id is None or role is None:
        return

    try:
        user_id = int(raw_id)
    except (TypeError, ValueError):
        return

    g.role = role

    table = {'member': 'member', 'trainer': 'trainer', 'admin': 'admin'}.get(role)
    if table is None:
        return

    id_col = f'{table}_id'
    cur = get_cursor()
    cur.execute(f'SELECT * FROM {table} WHERE {id_col} = %s', (user_id,))
    g.user = cur.fetchone()
    cur.close()

    if g.user is not None:
        apply_role(role, user_id)


@bp.route('/config', methods=('GET',))
def get_config():
    demo = current_app.config.get('DEMO_MODE', False)
    resp = {'demo_mode': demo}
    if demo:
        resp['demo_accounts'] = [
            {'role': 'member',  'email': 'alice@example.com', 'password': 'password123'},
            {'role': 'trainer', 'email': 'frank@example.com', 'password': 'password123'},
            {'role': 'admin',   'email': 'ivy@example.com',   'password': 'password123'},
        ]
    return jsonify(resp)


@bp.route('/register', methods=('POST',))
def register():
    if current_app.config.get('DEMO_MODE'):
        return jsonify(error='Registration is disabled in demo mode. '
                       'Use the sample accounts to log in.'), 403
    data = request.get_json(silent=True) or {}
    # Extract values safely (handle unexpected types from frontend)
    def _str(val):
        if val is None: return ''
        if isinstance(val, str): return val.strip()
        if isinstance(val, dict) and 'target' in val: return _str(val.get('target', {}).get('value'))
        try: return str(val).strip()
        except Exception: return ''
    name = _str(data.get('name'))
    email = _str(data.get('email')).lower()
    dob = _str(data.get('dob'))
    gender = _str(data.get('gender')).lower()
    phone = _str(data.get('phone'))
    pw = data.get('password')
    password = pw if isinstance(pw, str) else (str(pw) if pw else '')

    if not name:
        body, status = make_error(VAL_001)
        return jsonify(body), status
    if not email:
        body, status = make_error(VAL_002)
        return jsonify(body), status
    if '@' not in email or '.' not in email or email.count('@') != 1:
        body, status = make_error(VAL_011)
        return jsonify(body), status
    if not dob:
        body, status = make_error(VAL_003)
        return jsonify(body), status
    if not password:
        body, status = make_error(VAL_004)
        return jsonify(body), status
    if len(password) < 6:
        body, status = make_error(VAL_005)
        return jsonify(body), status
    if gender and gender not in ('male', 'female', 'other'):
        body, status = make_error(VAL_012)
        return jsonify(body), status

    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO member (name, email, dob, gender, phone, password_hash)
               VALUES (%s, %s, %s, %s, %s, %s)''',
            (name, email, dob, gender, phone or None,
             generate_password_hash(password, method='pbkdf2:sha256')),
        )
        get_db().commit()
        return jsonify(message='Registration successful.'), 201
    except Exception as e:
        get_db().rollback()
        logger.exception('Registration failed: %s', e)
        if 'unique' in str(e).lower():
            body, status = make_error(AUTH_005)
            return jsonify(body), status
        body, status = make_error(AUTH_006)
        return jsonify(body), status
    finally:
        cur.close()


@bp.route('/login', methods=('POST',))
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '')

    table_map = {
        'member':  ('member',  'member_id'),
        'trainer': ('trainer', 'trainer_id'),
        'admin':   ('admin',   'admin_id'),
    }

    if role not in table_map:
        body, status = make_error(AUTH_003)
        return jsonify(body), status

    table, id_col = table_map[role]
    cur = get_cursor()
    cur.execute(f'SELECT * FROM {table} WHERE email = %s', (email,))
    user = cur.fetchone()
    cur.close()

    if user is None:
        body, status = make_error(AUTH_004)
        return jsonify(body), status
    if not check_password_hash(user['password_hash'], password):
        body, status = make_error(AUTH_004)
        return jsonify(body), status

    secret = current_app.config['SECRET_KEY']
    access_token = create_access_token(
        user[id_col], role, secret,
        current_app.config['JWT_ACCESS_EXPIRES'],
    )
    refresh_token = create_refresh_token(
        user[id_col], role, secret,
        current_app.config['JWT_REFRESH_EXPIRES'],
    )

    safe_user = serialize_row(user)
    safe_user.pop('password_hash', None)

    resp = make_response(jsonify(user=safe_user, role=role, access_token=access_token))
    _set_refresh_cookie(resp, refresh_token)
    return resp


@bp.route('/logout', methods=('POST',))
def logout():
    resp = make_response(jsonify(message='Logged out.'))
    _clear_refresh_cookie(resp)
    return resp


@bp.route('/refresh', methods=('POST',))
def refresh():
    token = request.cookies.get('fc_refresh_token')
    if not token:
        body, status = make_error(AUTH_001)
        return jsonify(body), status

    try:
        payload = decode_token(token, current_app.config['SECRET_KEY'])
    except Exception:
        body, status = make_error(AUTH_001)
        resp = make_response(jsonify(body), status)
        _clear_refresh_cookie(resp)
        return resp

    if payload.get('type') != 'refresh':
        body, status = make_error(AUTH_001)
        return jsonify(body), status

    secret = current_app.config['SECRET_KEY']
    uid = int(payload['sub'])
    access_token = create_access_token(
        uid, payload['role'], secret,
        current_app.config['JWT_ACCESS_EXPIRES'],
    )
    new_refresh = create_refresh_token(
        uid, payload['role'], secret,
        current_app.config['JWT_REFRESH_EXPIRES'],
    )

    resp = make_response(jsonify(access_token=access_token))
    _set_refresh_cookie(resp, new_refresh)
    return resp


@bp.route('/me')
def me():
    if g.user is None:
        return jsonify(user=None, role=None)
    safe_user = serialize_row(g.user)
    safe_user.pop('password_hash', None)
    return jsonify(user=safe_user, role=g.role)
