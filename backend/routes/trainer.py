from flask import Blueprint, g, jsonify, request

from ..db import get_cursor, get_db, serialize_row, serialize_rows
from .auth import role_required

bp = Blueprint('trainer', __name__, url_prefix='/api/trainer')


@bp.route('/dashboard')
@role_required('trainer')
def dashboard():
    cur = get_cursor()
    tid = g.user['trainer_id']

    cur.execute(
        '''SELECT COUNT(*) AS total FROM personal_session
           WHERE trainer_id = %s AND status = 'scheduled'
             AND session_date >= CURRENT_DATE''', (tid,))
    total_sessions = cur.fetchone()['total']

    cur.execute(
        '''SELECT COUNT(*) AS total FROM group_class
           WHERE trainer_id = %s AND class_date >= CURRENT_DATE''', (tid,))
    total_classes = cur.fetchone()['total']

    cur.execute(
        '''SELECT COUNT(DISTINCT member_id) AS total FROM personal_session
           WHERE trainer_id = %s''', (tid,))
    total_members = cur.fetchone()['total']

    cur.execute(
        '''SELECT COUNT(*) AS total FROM trainer_availability
           WHERE trainer_id = %s AND available_date >= CURRENT_DATE''', (tid,))
    total_slots = cur.fetchone()['total']

    cur.execute(
        '''SELECT ps.session_date, ps.start_time, ps.end_time,
                  m.name AS member_name, r.room_name
           FROM personal_session ps
           JOIN member m ON m.member_id = ps.member_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.trainer_id = %s AND ps.status = 'scheduled'
             AND ps.session_date >= CURRENT_DATE
           ORDER BY ps.session_date, ps.start_time
           LIMIT 5''', (tid,))
    upcoming = cur.fetchall()

    cur.execute(
        '''SELECT TO_CHAR(session_date, 'Mon') AS month,
                  EXTRACT(YEAR FROM session_date) AS yr,
                  EXTRACT(MONTH FROM session_date) AS mn,
                  COUNT(*) AS count
           FROM personal_session
           WHERE trainer_id = %s
             AND session_date >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY month, yr, mn
           ORDER BY yr, mn''', (tid,))
    session_trend = cur.fetchall()

    cur.execute(
        '''SELECT TO_CHAR(class_date, 'Mon') AS month,
                  EXTRACT(YEAR FROM class_date) AS yr,
                  EXTRACT(MONTH FROM class_date) AS mn,
                  COUNT(*) AS count
           FROM group_class
           WHERE trainer_id = %s
             AND class_date >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY month, yr, mn
           ORDER BY yr, mn''', (tid,))
    class_trend = cur.fetchall()

    cur.close()
    return jsonify(
        total_sessions=total_sessions,
        total_classes=total_classes,
        total_members=total_members,
        total_availability_slots=total_slots,
        upcoming_sessions=serialize_rows(upcoming),
        session_trend=serialize_rows(session_trend),
        class_trend=serialize_rows(class_trend),
    )


@bp.route('/schedule')
@role_required('trainer')
def schedule():
    cur = get_cursor()
    tid = g.user['trainer_id']

    cur.execute(
        '''SELECT ps.*, m.name AS member_name, r.room_name
           FROM personal_session ps
           JOIN member m ON m.member_id = ps.member_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.trainer_id = %s AND ps.status = 'scheduled'
             AND ps.session_date >= CURRENT_DATE
           ORDER BY ps.session_date, ps.start_time''', (tid,))
    sessions = cur.fetchall()

    cur.execute(
        '''SELECT gc.*, r.room_name,
                  COUNT(ce.enrollment_id) AS enrolled_count
           FROM group_class gc
           JOIN room r ON r.room_id = gc.room_id
           LEFT JOIN class_enrollment ce ON ce.class_id = gc.class_id
           WHERE gc.trainer_id = %s AND gc.class_date >= CURRENT_DATE
           GROUP BY gc.class_id, r.room_name
           ORDER BY gc.class_date, gc.start_time''', (tid,))
    classes = cur.fetchall()

    cur.execute(
        '''SELECT DISTINCT m.member_id, m.name, m.email,
                  lh.weight, lh.body_fat_pct, lh.blood_pressure,
                  lh.heart_rate, lh.recorded_at
           FROM personal_session ps
           JOIN member m ON m.member_id = ps.member_id
           LEFT JOIN LATERAL (
               SELECT weight, body_fat_pct, blood_pressure, heart_rate, recorded_at
               FROM health_metric
               WHERE member_id = m.member_id
               ORDER BY recorded_at DESC
               LIMIT 1
           ) lh ON true
           WHERE ps.trainer_id = %s
           ORDER BY m.name''', (tid,))
    member_health = cur.fetchall()

    cur.close()
    return jsonify(
        sessions=serialize_rows(sessions),
        classes=serialize_rows(classes),
        member_health=serialize_rows(member_health),
    )


@bp.route('/profile')
@role_required('trainer')
def profile():
    cur = get_cursor()
    cur.execute('SELECT * FROM trainer WHERE trainer_id = %s',
                (g.user['trainer_id'],))
    trainer = cur.fetchone()
    cur.close()

    safe = serialize_row(trainer)
    safe.pop('password_hash', None)
    return jsonify(trainer=safe)


@bp.route('/profile', methods=('PUT',))
@role_required('trainer')
def update_profile():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    specialization = data.get('specialization', '').strip()

    cur = get_cursor()
    try:
        cur.execute(
            '''UPDATE trainer SET name = %s, phone = %s, specialization = %s
               WHERE trainer_id = %s''',
            (name, phone or None, specialization or None,
             g.user['trainer_id']),
        )
        get_db().commit()
        return jsonify(message='Profile updated.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/calendar')
@role_required('trainer')
def get_calendar():
    """Return availability slots, sessions, and classes for a month (for calendar view)."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    if not year or not month:
        from datetime import date
        today = date.today()
        year, month = today.year, today.month

    cur = get_cursor()
    tid = g.user['trainer_id']

    cur.execute(
        '''SELECT availability_id, available_date AS event_date, start_time, end_time,
                  'availability' AS event_type, 'Available' AS title
           FROM trainer_availability
           WHERE trainer_id = %s
             AND EXTRACT(YEAR FROM available_date) = %s
             AND EXTRACT(MONTH FROM available_date) = %s
           ORDER BY available_date, start_time''',
        (tid, year, month))
    availability = cur.fetchall()

    cur.execute(
        '''SELECT ps.session_id, ps.session_date AS event_date, ps.start_time, ps.end_time,
                  'session' AS event_type, m.name AS title, r.room_name AS location
           FROM personal_session ps
           JOIN member m ON m.member_id = ps.member_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.trainer_id = %s AND ps.status = 'scheduled'
             AND EXTRACT(YEAR FROM ps.session_date) = %s
             AND EXTRACT(MONTH FROM ps.session_date) = %s
           ORDER BY ps.session_date, ps.start_time''',
        (tid, year, month))
    sessions = cur.fetchall()

    cur.execute(
        '''SELECT gc.class_id, gc.class_date AS event_date, gc.start_time, gc.end_time,
                  'class' AS event_type, gc.class_name AS title, r.room_name AS location,
                  gc.max_participants,
                  (SELECT COUNT(*) FROM class_enrollment ce WHERE ce.class_id = gc.class_id) AS enrolled_count
           FROM group_class gc
           JOIN room r ON r.room_id = gc.room_id
           WHERE gc.trainer_id = %s
             AND EXTRACT(YEAR FROM gc.class_date) = %s
             AND EXTRACT(MONTH FROM gc.class_date) = %s
           ORDER BY gc.class_date, gc.start_time''',
        (tid, year, month))
    classes = cur.fetchall()

    cur.close()
    return jsonify(
        availability=serialize_rows(availability),
        sessions=serialize_rows(sessions),
        classes=serialize_rows(classes),
        year=year,
        month=month,
    )


@bp.route('/availability')
@role_required('trainer')
def get_availability():
    cur = get_cursor()
    cur.execute(
        '''SELECT * FROM trainer_availability
           WHERE trainer_id = %s AND available_date >= CURRENT_DATE
           ORDER BY available_date, start_time''',
        (g.user['trainer_id'],))
    slots = cur.fetchall()
    cur.close()
    return jsonify(slots=serialize_rows(slots))


@bp.route('/availability', methods=('POST',))
@role_required('trainer')
def add_availability():
    data = request.get_json(silent=True) or {}
    tid = g.user['trainer_id']
    avail_date = data.get('available_date', '')
    start_time = data.get('start_time', '')
    end_time = data.get('end_time', '')

    if not avail_date or not start_time or not end_time:
        return jsonify(error='All fields are required.'), 400
    if start_time >= end_time:
        return jsonify(error='End time must be after start time.'), 400

    cur = get_cursor()
    cur.execute(
        '''SELECT 1 FROM trainer_availability
           WHERE trainer_id = %s AND available_date = %s
             AND start_time < %s AND end_time > %s''',
        (tid, avail_date, end_time, start_time))
    if cur.fetchone():
        cur.close()
        return jsonify(error='This time slot overlaps with an existing slot.'), 409

    try:
        cur.execute(
            '''INSERT INTO trainer_availability
               (trainer_id, available_date, start_time, end_time)
               VALUES (%s, %s, %s, %s)''',
            (tid, avail_date, start_time, end_time))
        get_db().commit()
        return jsonify(message='Availability slot added.'), 201
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/availability/<int:avail_id>', methods=('DELETE',))
@role_required('trainer')
def delete_availability(avail_id):
    cur = get_cursor()
    try:
        cur.execute(
            '''DELETE FROM trainer_availability
               WHERE availability_id = %s AND trainer_id = %s''',
            (avail_id, g.user['trainer_id']))
        get_db().commit()
        return jsonify(message='Availability slot removed.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()
