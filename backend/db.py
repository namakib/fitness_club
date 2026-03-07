import datetime
import decimal

import psycopg2
import psycopg2.extras
from flask import current_app, g


def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(
            host=current_app.config['DB_HOST'],
            port=current_app.config['DB_PORT'],
            dbname=current_app.config['DB_NAME'],
            user=current_app.config.get('DB_APP_USER', current_app.config['DB_USER']),
            password=current_app.config.get('DB_APP_PASSWORD', current_app.config['DB_PASSWORD']),
        )
    return g.db


def apply_role(role, user_id):
    """Set PostgreSQL role and session variable for RLS. Call after loading user."""
    if role is None or user_id is None:
        return
    role_map = {'member': 'fc_member', 'trainer': 'fc_trainer', 'admin': 'fc_admin'}
    pg_role = role_map.get(role)
    if pg_role is None:
        return
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return
    db = get_db()
    with db.cursor() as cur:
        # pg_role is from hardcoded map, not user input
        cur.execute(f'SET ROLE {pg_role}')
        cur.execute("SET app.current_user_id = %s", (str(uid),)) 


def get_cursor():
    db = get_db()
    return db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        try:
            with db.cursor() as cur:
                cur.execute('RESET ROLE')
        except Exception:
            pass
        db.close()


def init_app(app):
    app.teardown_appcontext(close_db)


def serialize_row(row):
    """Convert a RealDictRow into a JSON-safe dict."""
    if row is None:
        return None
    out = {}
    for key, val in row.items():
        if isinstance(val, (datetime.date, datetime.datetime)):
            out[key] = val.isoformat()
        elif isinstance(val, datetime.time):
            out[key] = val.strftime('%H:%M')
        elif isinstance(val, datetime.timedelta):
            total = int(val.total_seconds())
            hours, remainder = divmod(total, 3600)
            minutes = remainder // 60
            out[key] = f'{hours:02d}:{minutes:02d}'
        elif isinstance(val, decimal.Decimal):
            out[key] = float(val)
        else:
            out[key] = val
    return out


def serialize_rows(rows):
    return [serialize_row(r) for r in rows]
