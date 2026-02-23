from flask import Blueprint, g, jsonify, request

from ..db import get_cursor, get_db, serialize_row, serialize_rows
from .auth import role_required

bp = Blueprint('member', __name__, url_prefix='/api/member')


@bp.route('/dashboard')
@role_required('member')
def dashboard():
    cur = get_cursor()
    mid = g.user['member_id']

    cur.execute(
        'SELECT * FROM member_dashboard_view WHERE member_id = %s', (mid,))
    summary = cur.fetchone()

    cur.execute(
        '''SELECT * FROM fitness_goal
           WHERE member_id = %s AND status = 'active'
           ORDER BY start_date DESC''', (mid,))
    active_goals = cur.fetchall()

    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at DESC LIMIT 5''', (mid,))
    recent_metrics = cur.fetchall()

    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at ASC''', (mid,))
    all_metrics = cur.fetchall()

    cur.execute(
        '''SELECT ps.*, t.name AS trainer_name, r.room_name
           FROM personal_session ps
           JOIN trainer t ON t.trainer_id = ps.trainer_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.member_id = %s AND ps.status = 'scheduled'
             AND ps.session_date >= CURRENT_DATE
           ORDER BY ps.session_date, ps.start_time''', (mid,))
    upcoming_sessions = cur.fetchall()

    cur.execute(
        '''SELECT gc.*, t.name AS trainer_name, r.room_name
           FROM class_enrollment ce
           JOIN group_class gc ON gc.class_id = ce.class_id
           JOIN trainer t ON t.trainer_id = gc.trainer_id
           JOIN room r ON r.room_id = gc.room_id
           WHERE ce.member_id = %s AND gc.class_date >= CURRENT_DATE
           ORDER BY gc.class_date, gc.start_time''', (mid,))
    upcoming_classes = cur.fetchall()

    cur.close()
    return jsonify(
        summary=serialize_row(summary),
        active_goals=serialize_rows(active_goals),
        recent_metrics=serialize_rows(recent_metrics),
        all_metrics=serialize_rows(all_metrics),
        upcoming_sessions=serialize_rows(upcoming_sessions),
        upcoming_classes=serialize_rows(upcoming_classes),
    )


@bp.route('/profile')
@role_required('member')
def profile():
    cur = get_cursor()
    mid = g.user['member_id']

    cur.execute('SELECT * FROM member WHERE member_id = %s', (mid,))
    member = cur.fetchone()

    cur.execute(
        '''SELECT * FROM fitness_goal
           WHERE member_id = %s ORDER BY start_date DESC''', (mid,))
    goals = cur.fetchall()

    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at DESC LIMIT 5''', (mid,))
    recent_metrics = cur.fetchall()

    cur.close()

    safe = serialize_row(member)
    safe.pop('password_hash', None)
    return jsonify(
        member=safe,
        goals=serialize_rows(goals),
        recent_metrics=serialize_rows(recent_metrics),
    )


@bp.route('/profile', methods=('PUT',))
@role_required('member')
def update_profile():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    gender = data.get('gender', '')

    cur = get_cursor()
    try:
        cur.execute(
            '''UPDATE member SET name = %s, phone = %s, gender = %s
               WHERE member_id = %s''',
            (name, phone or None, gender, g.user['member_id']),
        )
        get_db().commit()
        return jsonify(message='Profile updated.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/goals', methods=('POST',))
@role_required('member')
def add_goal():
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO fitness_goal
               (member_id, goal_type, target_value, start_date, end_date)
               VALUES (%s, %s, %s, %s, %s)''',
            (g.user['member_id'],
             data.get('goal_type', '').strip(),
             data.get('target_value', '').strip(),
             data.get('start_date'),
             data.get('end_date') or None),
        )
        get_db().commit()
        return jsonify(message='Goal added.'), 201
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/goals/<int:goal_id>', methods=('PUT',))
@role_required('member')
def update_goal(goal_id):
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''UPDATE fitness_goal SET status = %s
               WHERE goal_id = %s AND member_id = %s''',
            (data.get('status'), goal_id, g.user['member_id']),
        )
        get_db().commit()
        return jsonify(message='Goal updated.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/metrics', methods=('POST',))
@role_required('member')
def add_metric():
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO health_metric
               (member_id, weight, body_fat_pct, blood_pressure, heart_rate)
               VALUES (%s, %s, %s, %s, %s)''',
            (g.user['member_id'],
             data.get('weight') or None,
             data.get('body_fat_pct') or None,
             data.get('blood_pressure', '').strip() or None,
             data.get('heart_rate') or None),
        )
        get_db().commit()
        return jsonify(message='Health metric recorded.'), 201
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/health-history')
@role_required('member')
def health_history():
    cur = get_cursor()
    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at DESC''',
        (g.user['member_id'],),
    )
    metrics = cur.fetchall()
    cur.close()
    return jsonify(metrics=serialize_rows(metrics))
