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


@bp.route('/booking-options')
@role_required('member')
def booking_options():
    cur = get_cursor()
    cur.execute('SELECT trainer_id, name, specialization FROM trainer ORDER BY name')
    trainers = cur.fetchall()
    cur.execute('SELECT room_id, room_name FROM room ORDER BY room_name')
    rooms = cur.fetchall()
    cur.close()
    return jsonify(
        trainers=serialize_rows(trainers),
        rooms=serialize_rows(rooms),
    )


@bp.route('/trainer-availability')
@role_required('member')
def trainer_availability():
    trainer_id = request.args.get('trainer_id')
    if not trainer_id:
        return jsonify(error='trainer_id is required.'), 400
    cur = get_cursor()
    cur.execute(
        '''SELECT availability_id, available_date, start_time, end_time
           FROM trainer_availability
           WHERE trainer_id = %s AND available_date >= CURRENT_DATE
           ORDER BY available_date, start_time''',
        (trainer_id,),
    )
    slots = cur.fetchall()
    cur.close()
    return jsonify(slots=serialize_rows(slots))


@bp.route('/sessions', methods=('POST',))
@role_required('member')
def book_session():
    data = request.get_json(silent=True) or {}
    trainer_id = data.get('trainer_id')
    room_id = data.get('room_id')
    session_date = data.get('session_date', '').strip()
    start_time = data.get('start_time', '').strip()
    end_time = data.get('end_time', '').strip()
    if not all([trainer_id, room_id, session_date, start_time, end_time]):
        return jsonify(error='trainer_id, room_id, session_date, start_time, and end_time are required.'), 400
    if start_time >= end_time:
        return jsonify(error='End time must be after start time.'), 400

    cur = get_cursor()
    try:
        cur.execute(
            '''SELECT 1 FROM trainer_availability
               WHERE trainer_id = %s AND available_date = %s
                 AND start_time < %s AND end_time > %s''',
            (trainer_id, session_date, end_time, start_time))
        if not cur.fetchone():
            return jsonify(error='Trainer is not available at this time.'), 409
        cur.execute(
            '''INSERT INTO personal_session
               (member_id, trainer_id, room_id, session_date, start_time, end_time)
               VALUES (%s, %s, %s, %s, %s, %s)''',
            (g.user['member_id'], trainer_id, room_id, session_date, start_time, end_time))
        get_db().commit()
        return jsonify(message='Session booked.'), 201
    except Exception as e:
        get_db().rollback()
        msg = str(e)
        if 'already booked' in msg.lower():
            return jsonify(error='Room is already booked for that time slot.'), 409
        if 'overlapping session' in msg.lower():
            return jsonify(error='You already have an overlapping session.'), 409
        return jsonify(error=msg), 500
    finally:
        cur.close()


@bp.route('/sessions/<int:session_id>', methods=('PUT',))
@role_required('member')
def cancel_session(session_id):
    data = request.get_json(silent=True) or {}
    status = data.get('status', 'cancelled')
    if status != 'cancelled':
        return jsonify(error='Only cancellation is allowed.'), 400

    cur = get_cursor()
    cur.execute(
        '''UPDATE personal_session SET status = 'cancelled'
           WHERE session_id = %s AND member_id = %s''',
        (session_id, g.user['member_id']))
    get_db().commit()
    if cur.rowcount == 0:
        cur.close()
        return jsonify(error='Session not found.'), 404
    cur.close()
    return jsonify(message='Session cancelled.')


@bp.route('/available-classes')
@role_required('member')
def available_classes():
    mid = g.user['member_id']
    cur = get_cursor()
    cur.execute(
        '''SELECT gc.*, t.name AS trainer_name, r.room_name,
                  (SELECT COUNT(*) FROM class_enrollment ce WHERE ce.class_id = gc.class_id) AS enrolled_count
           FROM group_class gc
           JOIN trainer t ON t.trainer_id = gc.trainer_id
           JOIN room r ON r.room_id = gc.room_id
           WHERE gc.class_date >= CURRENT_DATE
             AND NOT EXISTS (SELECT 1 FROM class_enrollment ce WHERE ce.class_id = gc.class_id AND ce.member_id = %s)
             AND (SELECT COUNT(*) FROM class_enrollment ce WHERE ce.class_id = gc.class_id) < gc.max_participants
           ORDER BY gc.class_date, gc.start_time''',
        (mid,))
    classes = cur.fetchall()
    cur.close()
    return jsonify(classes=serialize_rows(classes))


@bp.route('/classes/<int:class_id>/enroll', methods=('POST',))
@role_required('member')
def enroll_in_class(class_id):
    cur = get_cursor()
    try:
        cur.execute(
            'INSERT INTO class_enrollment (class_id, member_id) VALUES (%s, %s)',
            (class_id, g.user['member_id']))
        get_db().commit()
        return jsonify(message='Enrolled in class.'), 201
    except Exception as e:
        get_db().rollback()
        msg = str(e)
        if 'unique' in msg.lower() or 'duplicate' in msg.lower():
            return jsonify(error='Already enrolled in this class.'), 409
        if 'full' in msg.lower():
            return jsonify(error='Class is full.'), 409
        return jsonify(error=msg), 500
    finally:
        cur.close()


@bp.route('/classes/<int:class_id>/enroll', methods=('DELETE',))
@role_required('member')
def drop_class(class_id):
    cur = get_cursor()
    cur.execute(
        'DELETE FROM class_enrollment WHERE class_id = %s AND member_id = %s',
        (class_id, g.user['member_id']))
    get_db().commit()
    if cur.rowcount == 0:
        cur.close()
        return jsonify(error='Enrollment not found.'), 404
    cur.close()
    return jsonify(message='Dropped from class.')
