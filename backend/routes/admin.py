from datetime import date

from flask import Blueprint, g, jsonify, request

from ..db import get_cursor, get_db, serialize_row, serialize_rows
from ..errors import (
    BOOK_001,
    BOOK_003,
    BOOK_004,
    ERR_001,
    ERR_002,
    VAL_006,
    VAL_008,
    make_error,
    parse_db_error,
)
from .auth import role_required

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/profile')
@role_required('admin')
def profile():
    cur = get_cursor()
    cur.execute('SELECT * FROM admin WHERE admin_id = %s',
                (g.user['admin_id'],))
    admin = cur.fetchone()
    cur.close()

    safe = serialize_row(admin)
    safe.pop('password_hash', None)
    return jsonify(admin=safe)


@bp.route('/profile', methods=('PUT',))
@role_required('admin')
def update_profile():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()

    cur = get_cursor()
    try:
        cur.execute(
            '''UPDATE admin SET name = %s, phone = %s
               WHERE admin_id = %s''',
            (name, phone or None, g.user['admin_id']),
        )
        get_db().commit()
        return jsonify(message='Profile updated.')
    except Exception:
        get_db().rollback()
        body, status = make_error(ERR_002)
        return jsonify(body), status
    finally:
        cur.close()


@bp.route('/dashboard')
@role_required('admin')
def dashboard():
    cur = get_cursor()

    cur.execute('SELECT COUNT(*) AS total FROM member')
    total_members = cur.fetchone()['total']

    cur.execute('SELECT COUNT(*) AS total FROM trainer')
    total_trainers = cur.fetchone()['total']

    cur.execute('SELECT COUNT(*) AS total FROM equipment')
    total_equipment = cur.fetchone()['total']

    cur.execute('SELECT COUNT(*) AS total FROM room')
    total_rooms = cur.fetchone()['total']

    cur.execute(
        '''SELECT status, COUNT(*) AS count
           FROM equipment GROUP BY status ORDER BY status''')
    equipment_status = serialize_rows(cur.fetchall())

    cur.execute(
        '''SELECT
             COALESCE(SUM(CASE WHEN status IN ('reported','in_progress') THEN 1 ELSE 0 END), 0) AS open,
             COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) AS resolved
           FROM equipment_maintenance''')
    maint = cur.fetchone()
    maintenance_summary = {'open': maint['open'], 'resolved': maint['resolved']}

    cur.execute(
        '''SELECT month, yr, mn, SUM(cnt)::int AS count FROM (
             SELECT TO_CHAR(session_date, 'Mon') AS month,
                    EXTRACT(YEAR FROM session_date) AS yr,
                    EXTRACT(MONTH FROM session_date) AS mn,
                    COUNT(*) AS cnt
             FROM personal_session
             WHERE session_date >= CURRENT_DATE - INTERVAL '6 months'
             GROUP BY month, yr, mn
           UNION ALL
             SELECT TO_CHAR(class_date, 'Mon') AS month,
                    EXTRACT(YEAR FROM class_date) AS yr,
                    EXTRACT(MONTH FROM class_date) AS mn,
                    COUNT(*) AS cnt
             FROM group_class
             WHERE class_date >= CURRENT_DATE - INTERVAL '6 months'
             GROUP BY month, yr, mn
           ) sub
           GROUP BY month, yr, mn
           ORDER BY yr, mn''')
    booking_trend = serialize_rows(cur.fetchall())

    cur.execute(
        '''(SELECT r.room_name, 'Personal Session' AS booking_type,
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
            WHERE gc.class_date >= CURRENT_DATE)
          ORDER BY event_date, start_time
          LIMIT 5''')
    upcoming_bookings = serialize_rows(cur.fetchall())

    cur.close()
    return jsonify(
        total_members=total_members,
        total_trainers=total_trainers,
        total_equipment=total_equipment,
        total_rooms=total_rooms,
        equipment_status=equipment_status,
        maintenance_summary=maintenance_summary,
        booking_trend=booking_trend,
        upcoming_bookings=upcoming_bookings,
    )


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
            '''SELECT 1 FROM trainer_availability
               WHERE trainer_id = %s AND available_date = %s
                 AND start_time < %s AND end_time > %s''',
            (data['trainer_id'], data['session_date'], data['end_time'], data['start_time']))
        if not cur.fetchone():
            body, status = make_error(BOOK_004)
            return jsonify(body), status
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
        parsed = parse_db_error(msg)
        if parsed:
            code, params = parsed
            body, status = make_error(code, **params)
            return jsonify(body), status
        if 'already booked' in msg.lower():
            body, status = make_error(BOOK_003, date='this date')
            return jsonify(body), status
        if 'overlapping' in msg.lower() or 'Member already has' in msg:
            body, status = make_error(BOOK_001, date='this date')
            return jsonify(body), status
        body, status = make_error(ERR_001)
        return jsonify(body), status
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
        parsed = parse_db_error(msg)
        if parsed:
            code, params = parsed
            body, status = make_error(code, **params)
            return jsonify(body), status
        if 'already booked' in msg.lower():
            body, status = make_error(BOOK_003, date='this date')
            return jsonify(body), status
        body, status = make_error(ERR_001)
        return jsonify(body), status
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
        body, status = make_error(VAL_008)
        return jsonify(body), status

    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO equipment_maintenance
               (equipment_id, issue_description) VALUES (%s, %s)''',
            (data['equipment_id'], issue_desc))
        get_db().commit()
        return jsonify(message='Maintenance issue logged.'), 201
    except Exception:
        get_db().rollback()
        body, status = make_error(ERR_001)
        return jsonify(body), status
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
    except Exception:
        get_db().rollback()
        body, status = make_error(ERR_001)
        return jsonify(body), status
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
    except Exception:
        get_db().rollback()
        body, status = make_error(ERR_001)
        return jsonify(body), status
    finally:
        cur.close()


@bp.route('/payments')
@role_required('admin')
def list_payments():
    cur = get_cursor()
    cur.execute(
        '''SELECT p.*, m.name AS member_name, m.email AS member_email
           FROM payment p
           JOIN member m ON m.member_id = p.member_id
           ORDER BY p.payment_date DESC, p.payment_id DESC''')
    payments = cur.fetchall()
    cur.close()
    return jsonify(payments=serialize_rows(payments))


@bp.route('/payments', methods=('POST',))
@role_required('admin')
def create_payment():
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')
    amount = data.get('amount')
    if member_id is None or amount is None:
        body, status = make_error(VAL_006, fields='member_id and amount')
        return jsonify(body), status
    cur = get_cursor()
    try:
        cur.execute(
            '''INSERT INTO payment (member_id, amount, payment_status, payment_date, payment_method)
               VALUES (%s, %s, %s, %s, %s)''',
            (member_id, amount,
             data.get('payment_status') or 'pending',
             data.get('payment_date') or date.today().isoformat(),
             (data.get('payment_method') or '').strip() or None))
        get_db().commit()
        return jsonify(message='Payment recorded.'), 201
    except Exception:
        get_db().rollback()
        body, status = make_error(ERR_001)
        return jsonify(body), status
    finally:
        cur.close()
