from flask import (
    Blueprint, flash, g, redirect, render_template,
    request, session, url_for,
)

from ..db import get_cursor, get_db
from .auth import role_required

bp = Blueprint('trainer', __name__, url_prefix='/trainer')


# ── Operation 5: Set Availability ─────────────────────────────

@bp.route('/availability', methods=('GET', 'POST'))
@role_required('trainer')
def availability():
    cur = get_cursor()
    tid = g.user['trainer_id']

    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'add':
            avail_date = request.form['available_date']
            start_time = request.form['start_time']
            end_time = request.form['end_time']

            error = None
            if not avail_date or not start_time or not end_time:
                error = 'All fields are required.'
            elif start_time >= end_time:
                error = 'End time must be after start time.'

            if error is None:
                # Check for overlapping availability for this trainer
                cur.execute(
                    '''SELECT 1 FROM trainer_availability
                       WHERE trainer_id = %s AND available_date = %s
                         AND start_time < %s AND end_time > %s''',
                    (tid, avail_date, end_time, start_time),
                )
                if cur.fetchone():
                    error = 'This time slot overlaps with an existing availability slot.'

            if error is None:
                try:
                    cur.execute(
                        '''INSERT INTO trainer_availability
                           (trainer_id, available_date, start_time, end_time)
                           VALUES (%s, %s, %s, %s)''',
                        (tid, avail_date, start_time, end_time),
                    )
                    get_db().commit()
                    flash('Availability slot added.', 'success')
                except Exception as e:
                    get_db().rollback()
                    flash(f'Error adding availability: {e}', 'danger')
            else:
                flash(error, 'danger')

        elif action == 'delete':
            avail_id = request.form['availability_id']
            try:
                cur.execute(
                    '''DELETE FROM trainer_availability
                       WHERE availability_id = %s AND trainer_id = %s''',
                    (avail_id, tid),
                )
                get_db().commit()
                flash('Availability slot removed.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error removing slot: {e}', 'danger')

        cur.close()
        return redirect(url_for('trainer.availability'))

    # GET: show current availability
    cur.execute(
        '''SELECT * FROM trainer_availability
           WHERE trainer_id = %s AND available_date >= CURRENT_DATE
           ORDER BY available_date, start_time''',
        (tid,),
    )
    slots = cur.fetchall()
    cur.close()
    return render_template('trainer/availability.html', slots=slots)


# ── Operation 6: Schedule View ────────────────────────────────

@bp.route('/schedule')
@role_required('trainer')
def schedule():
    cur = get_cursor()
    tid = g.user['trainer_id']

    # Upcoming personal sessions
    cur.execute(
        '''SELECT ps.*, m.name AS member_name, r.room_name
           FROM personal_session ps
           JOIN member m ON m.member_id = ps.member_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.trainer_id = %s AND ps.status = 'scheduled'
             AND ps.session_date >= CURRENT_DATE
           ORDER BY ps.session_date, ps.start_time''',
        (tid,),
    )
    sessions = cur.fetchall()

    # Upcoming group classes
    cur.execute(
        '''SELECT gc.*, r.room_name,
                  COUNT(ce.enrollment_id) AS enrolled_count
           FROM group_class gc
           JOIN room r ON r.room_id = gc.room_id
           LEFT JOIN class_enrollment ce ON ce.class_id = gc.class_id
           WHERE gc.trainer_id = %s AND gc.class_date >= CURRENT_DATE
           GROUP BY gc.class_id, r.room_name
           ORDER BY gc.class_date, gc.start_time''',
        (tid,),
    )
    classes = cur.fetchall()

    # Member health data (read-only, for all members with sessions with this trainer)
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
           ORDER BY m.name''',
        (tid,),
    )
    member_health = cur.fetchall()

    cur.close()
    return render_template(
        'trainer/schedule.html',
        sessions=sessions, classes=classes, member_health=member_health,
    )
