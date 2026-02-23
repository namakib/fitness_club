from flask import (
    Blueprint, flash, g, redirect, render_template,
    request, session, url_for,
)

from ..db import get_cursor, get_db
from .auth import role_required

bp = Blueprint('admin', __name__, url_prefix='/admin')


# ── Operation 7: Room Booking ─────────────────────────────────

@bp.route('/room-booking', methods=('GET', 'POST'))
@role_required('admin')
def room_booking():
    cur = get_cursor()

    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'book_session':
            member_id = request.form['member_id']
            trainer_id = request.form['trainer_id']
            room_id = request.form['room_id']
            session_date = request.form['session_date']
            start_time = request.form['start_time']
            end_time = request.form['end_time']

            try:
                cur.execute(
                    '''INSERT INTO personal_session
                       (member_id, trainer_id, room_id, session_date,
                        start_time, end_time)
                       VALUES (%s, %s, %s, %s, %s, %s)''',
                    (member_id, trainer_id, room_id, session_date,
                     start_time, end_time),
                )
                get_db().commit()
                flash('Personal session booked successfully.', 'success')
            except Exception as e:
                get_db().rollback()
                msg = str(e)
                if 'already booked' in msg.lower():
                    flash('Room is already booked for that time slot.', 'danger')
                else:
                    flash(f'Booking failed: {msg}', 'danger')

        elif action == 'book_class':
            class_name = request.form['class_name'].strip()
            trainer_id = request.form['trainer_id']
            room_id = request.form['room_id']
            class_date = request.form['class_date']
            start_time = request.form['start_time']
            end_time = request.form['end_time']
            max_participants = request.form['max_participants']

            try:
                cur.execute(
                    '''INSERT INTO group_class
                       (class_name, trainer_id, room_id, class_date,
                        start_time, end_time, max_participants)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                    (class_name, trainer_id, room_id, class_date,
                     start_time, end_time, max_participants),
                )
                get_db().commit()
                flash('Group class scheduled successfully.', 'success')
            except Exception as e:
                get_db().rollback()
                msg = str(e)
                if 'already booked' in msg.lower():
                    flash('Room is already booked for that time slot.', 'danger')
                else:
                    flash(f'Scheduling failed: {msg}', 'danger')

        cur.close()
        return redirect(url_for('admin.room_booking'))

    # GET: load rooms, members, trainers, and current bookings
    cur.execute('SELECT * FROM room ORDER BY room_name')
    rooms = cur.fetchall()

    cur.execute('SELECT member_id, name, email FROM member ORDER BY name')
    members = cur.fetchall()

    cur.execute('SELECT trainer_id, name, email, specialization FROM trainer ORDER BY name')
    trainers = cur.fetchall()

    # Room schedule: all upcoming sessions and classes
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
         ORDER BY event_date, start_time''',
    )
    bookings = cur.fetchall()

    cur.close()
    return render_template(
        'admin/room_booking.html',
        rooms=rooms, members=members, trainers=trainers, bookings=bookings,
    )


# ── Operation 8: Equipment Maintenance ────────────────────────

@bp.route('/equipment', methods=('GET', 'POST'))
@role_required('admin')
def equipment():
    cur = get_cursor()

    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'log_issue':
            equipment_id = request.form['equipment_id']
            issue_desc = request.form['issue_description'].strip()

            if not issue_desc:
                flash('Issue description is required.', 'danger')
            else:
                try:
                    cur.execute(
                        '''INSERT INTO equipment_maintenance
                           (equipment_id, issue_description)
                           VALUES (%s, %s)''',
                        (equipment_id, issue_desc),
                    )
                    get_db().commit()
                    flash('Maintenance issue logged.', 'success')
                except Exception as e:
                    get_db().rollback()
                    flash(f'Error logging issue: {e}', 'danger')

        elif action == 'update_status':
            equipment_id = request.form['equipment_id']
            new_status = request.form['equipment_status']

            try:
                cur.execute(
                    '''UPDATE equipment SET status = %s
                       WHERE equipment_id = %s''',
                    (new_status, equipment_id),
                )
                get_db().commit()
                flash('Equipment status updated.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error updating status: {e}', 'danger')

        elif action == 'update_maintenance':
            log_id = request.form['log_id']
            maint_status = request.form['maintenance_status']
            resolved_date = request.form.get('resolved_date') or None

            try:
                cur.execute(
                    '''UPDATE equipment_maintenance
                       SET status = %s, resolved_date = %s
                       WHERE log_id = %s''',
                    (maint_status, resolved_date, log_id),
                )
                get_db().commit()
                flash('Maintenance log updated.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error updating maintenance log: {e}', 'danger')

        cur.close()
        return redirect(url_for('admin.equipment'))

    # GET: load equipment and maintenance logs
    status_filter = request.args.get('status', '')

    if status_filter:
        cur.execute(
            'SELECT * FROM equipment WHERE status = %s ORDER BY name',
            (status_filter,),
        )
    else:
        cur.execute('SELECT * FROM equipment ORDER BY name')
    equipment_list = cur.fetchall()

    cur.execute(
        '''SELECT em.*, e.name AS equipment_name, e.type AS equipment_type
           FROM equipment_maintenance em
           JOIN equipment e ON e.equipment_id = em.equipment_id
           ORDER BY em.reported_date DESC''',
    )
    maintenance_logs = cur.fetchall()

    cur.close()
    return render_template(
        'admin/equipment.html',
        equipment_list=equipment_list,
        maintenance_logs=maintenance_logs,
        status_filter=status_filter,
    )
