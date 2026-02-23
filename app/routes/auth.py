import functools

from flask import (
    Blueprint, flash, g, redirect, render_template,
    request, session, url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from ..db import get_cursor, get_db

bp = Blueprint('auth', __name__)


# ── Role-based access decorators ──────────────────────────────

def login_required(view):
    @functools.wraps(view)
    def wrapped(**kwargs):
        if g.user is None:
            flash('Please log in first.', 'warning')
            return redirect(url_for('auth.login'))
        return view(**kwargs)
    return wrapped


def role_required(role):
    def decorator(view):
        @functools.wraps(view)
        def wrapped(**kwargs):
            if g.user is None:
                flash('Please log in first.', 'warning')
                return redirect(url_for('auth.login'))
            if session.get('role') != role:
                flash('You do not have permission to access this page.', 'danger')
                return redirect(url_for('auth.login'))
            return view(**kwargs)
        return wrapped
    return decorator


# ── Load logged-in user before every request ──────────────────

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


# ── Registration (members only) ──────────────────────────────

@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        name = request.form['name'].strip()
        email = request.form['email'].strip().lower()
        dob = request.form['dob']
        gender = request.form['gender']
        phone = request.form.get('phone', '').strip()
        password = request.form['password']

        error = None
        if not name:
            error = 'Name is required.'
        elif not email:
            error = 'Email is required.'
        elif not dob:
            error = 'Date of birth is required.'
        elif not password:
            error = 'Password is required.'
        elif len(password) < 6:
            error = 'Password must be at least 6 characters.'

        if error is None:
            cur = get_cursor()
            try:
                cur.execute(
                    '''INSERT INTO member (name, email, dob, gender, phone, password_hash)
                       VALUES (%s, %s, %s, %s, %s, %s)''',
                    (name, email, dob, gender, phone or None,
                     generate_password_hash(password, method='pbkdf2:sha256')),
                )
                get_db().commit()
                flash('Registration successful! Please log in.', 'success')
                return redirect(url_for('auth.login'))
            except Exception as e:
                get_db().rollback()
                if 'unique' in str(e).lower():
                    error = 'An account with this email already exists.'
                else:
                    error = f'Registration failed: {e}'
            finally:
                cur.close()

        flash(error, 'danger')

    return render_template('register.html')


# ── Login ─────────────────────────────────────────────────────

@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        role = request.form['role']

        error = None
        user = None

        table_map = {
            'member':  ('member',  'member_id'),
            'trainer': ('trainer', 'trainer_id'),
            'admin':   ('admin',   'admin_id'),
        }

        if role not in table_map:
            error = 'Invalid role selected.'
        else:
            table, id_col = table_map[role]
            cur = get_cursor()
            cur.execute(f'SELECT * FROM {table} WHERE email = %s', (email,))
            user = cur.fetchone()
            cur.close()

            if user is None:
                error = 'Invalid email or role.'
            elif not check_password_hash(user['password_hash'], password):
                error = 'Incorrect password.'

        if error is None:
            session.clear()
            session['user_id'] = user[id_col]
            session['role'] = role

            destinations = {
                'member':  'member.dashboard',
                'trainer': 'trainer.schedule',
                'admin':   'admin.room_booking',
            }
            return redirect(url_for(destinations[role]))

        flash(error, 'danger')

    return render_template('login.html')


# ── Logout ────────────────────────────────────────────────────

@bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))


# ── Root redirect ─────────────────────────────────────────────

@bp.route('/')
def index():
    if g.user:
        destinations = {
            'member':  'member.dashboard',
            'trainer': 'trainer.schedule',
            'admin':   'admin.room_booking',
        }
        return redirect(url_for(destinations.get(session.get('role'), 'auth.login')))
    return redirect(url_for('auth.login'))
