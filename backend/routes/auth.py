import functools

from flask import Blueprint, g, jsonify, request, session
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
    make_error,
)

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
            if session.get('role') != role:
                body, status = make_error(AUTH_002)
                return jsonify(body), status
            return view(**kwargs)
        return wrapped
    return decorator


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')
    role = session.get('role')
    g.user = None
    g.role = role

    if user_id is None or role is None:
        return

    cur = get_cursor()
    table = {'member': 'member', 'trainer': 'trainer', 'admin': 'admin'}.get(role)
    if table is None:
        return

    id_col = f'{table}_id'
    cur.execute(f'SELECT * FROM {table} WHERE {id_col} = %s', (user_id,))
    g.user = cur.fetchone()
    cur.close()

    if g.user is not None:
        apply_role(role, user_id)


@bp.route('/register', methods=('POST',))
def register():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    dob = data.get('dob', '')
    gender = data.get('gender', '')
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

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

    session.clear()
    session['user_id'] = user[id_col]
    session['role'] = role

    safe_user = serialize_row(user)
    safe_user.pop('password_hash', None)

    return jsonify(user=safe_user, role=role)


@bp.route('/logout', methods=('POST',))
def logout():
    session.clear()
    return jsonify(message='Logged out.')


@bp.route('/me')
def me():
    if g.user is None:
        return jsonify(user=None, role=None)
    safe_user = serialize_row(g.user)
    safe_user.pop('password_hash', None)
    return jsonify(user=safe_user, role=session.get('role'))
