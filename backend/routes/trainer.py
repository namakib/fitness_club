from flask import Blueprint, g, jsonify, request

from ..db import get_cursor, get_db, serialize_rows
from .auth import role_required

bp = Blueprint('trainer', __name__, url_prefix='/api/trainer')


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
