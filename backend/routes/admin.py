from flask import Blueprint, g, jsonify, request

from ..db import get_cursor, get_db, serialize_rows
from .auth import role_required

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/room-booking')
@role_required('admin')
def room_booking():
    cur = get_cursor()

    cur.execute('SELECT * FROM room ORDER BY room_name')
    rooms = cur.fetchall()

    cur.execute('SELECT member_id, name, email FROM member ORDER BY name')
    members = cur.fetchall()

    cur.execute(
        'SELECT trainer_id, name, email, specialization FROM trainer ORDER BY name')
    trainers = cur.fetchall()

    cur.execute(
        '''SELECT r.room_name, 'Personal Session' AS booking_type,
                  ps.session_date AS event_date,
                  ps.start_time, ps.end_time, ps.status,
                  m.name AS participant, t.name AS trainer_name
           FROM personal_session ps
           JOIN room r ON r.room_id = ps.room_id
           JOIN member m ON m.member_id = ps.member_id
           JOIN trainer t ON t.trainer_id = ps.trainer_id
           WHERE ps.session_date >= CURRENT_DATE
         UNION ALL
           SELECT r.room_name, 'Group Class' AS booking_type,
                  gc.class_date AS event_date,
                  gc.start_time, gc.end_time, 'scheduled' AS status,
                  gc.class_name AS participant, t.name AS trainer_name
           FROM group_class gc
           JOIN room r ON r.room_id = gc.room_id
           JOIN trainer t ON t.trainer_id = gc.trainer_id
           WHERE gc.class_date >= CURRENT_DATE
         ORDER BY event_date, start_time''')
    bookings = cur.fetchall()

    cur.close()
    return jsonify(
        rooms=serialize_rows(rooms),
        members=serialize_rows(members),
        trainers=serialize_rows(trainers),
        bookings=serialize_rows(bookings),
    )


@bp.route('/room-booking/session', methods=('POST',))
@role_required('admin')
def book_session():
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO personal_session
               (member_id, trainer_id, room_id, session_date, start_time, end_time)
               VALUES (%s, %s, %s, %s, %s, %s)''',
            (data['member_id'], data['trainer_id'], data['room_id'],
             data['session_date'], data['start_time'], data['end_time']))
        get_db().commit()
        return jsonify(message='Personal session booked.'), 201
    except Exception as e:
        get_db().rollback()
        msg = str(e)
        if 'already booked' in msg.lower():
            return jsonify(error='Room is already booked for that time slot.'), 409
        return jsonify(error=msg), 500
    finally:
        cur.close()


@bp.route('/room-booking/class', methods=('POST',))
@role_required('admin')
def book_class():
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO group_class
               (class_name, trainer_id, room_id, class_date,
                start_time, end_time, max_participants)
               VALUES (%s, %s, %s, %s, %s, %s, %s)''',
            (data['class_name'].strip(), data['trainer_id'], data['room_id'],
             data['class_date'], data['start_time'], data['end_time'],
             data['max_participants']))
        get_db().commit()
        return jsonify(message='Group class scheduled.'), 201
    except Exception as e:
        get_db().rollback()
        msg = str(e)
        if 'already booked' in msg.lower():
            return jsonify(error='Room is already booked for that time slot.'), 409
        return jsonify(error=msg), 500
    finally:
        cur.close()


@bp.route('/equipment')
@role_required('admin')
def equipment():
    cur = get_cursor()
    status_filter = request.args.get('status', '')

    if status_filter:
        cur.execute(
            'SELECT * FROM equipment WHERE status = %s ORDER BY name',
            (status_filter,))
    else:
        cur.execute('SELECT * FROM equipment ORDER BY name')
    equipment_list = cur.fetchall()

    cur.execute(
        '''SELECT em.*, e.name AS equipment_name, e.type AS equipment_type
           FROM equipment_maintenance em
           JOIN equipment e ON e.equipment_id = em.equipment_id
           ORDER BY em.reported_date DESC''')
    maintenance_logs = cur.fetchall()

    cur.close()
    return jsonify(
        equipment_list=serialize_rows(equipment_list),
        maintenance_logs=serialize_rows(maintenance_logs),
        status_filter=status_filter,
    )


@bp.route('/equipment/issue', methods=('POST',))
@role_required('admin')
def log_issue():
    data = request.get_json(silent=True) or {}
    issue_desc = data.get('issue_description', '').strip()
    if not issue_desc:
        return jsonify(error='Issue description is required.'), 400

    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO equipment_maintenance
               (equipment_id, issue_description) VALUES (%s, %s)''',
            (data['equipment_id'], issue_desc))
        get_db().commit()
        return jsonify(message='Maintenance issue logged.'), 201
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/equipment/<int:equipment_id>/status', methods=('PUT',))
@role_required('admin')
def update_equipment_status(equipment_id):
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            'UPDATE equipment SET status = %s WHERE equipment_id = %s',
            (data['status'], equipment_id))
        get_db().commit()
        return jsonify(message='Equipment status updated.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()


@bp.route('/equipment/maintenance/<int:log_id>', methods=('PUT',))
@role_required('admin')
def update_maintenance(log_id):
    data = request.get_json(silent=True) or {}
    cur = get_cursor()
    try:
        cur.execute(
            '''UPDATE equipment_maintenance
               SET status = %s, resolved_date = %s
               WHERE log_id = %s''',
            (data['status'], data.get('resolved_date') or None, log_id))
        get_db().commit()
        return jsonify(message='Maintenance log updated.')
    except Exception as e:
        get_db().rollback()
        return jsonify(error=str(e)), 500
    finally:
        cur.close()
