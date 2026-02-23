from flask import (
    Blueprint, flash, g, redirect, render_template,
    request, session, url_for,
)
from werkzeug.security import generate_password_hash

from ..db import get_cursor, get_db
from .auth import role_required

bp = Blueprint('member', __name__, url_prefix='/member')


# ── Operation 2: Profile Management ──────────────────────────

@bp.route('/profile', methods=('GET', 'POST'))
@role_required('member')
def profile():
    cur = get_cursor()

    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'update_profile':
            name = request.form['name'].strip()
            phone = request.form.get('phone', '').strip()
            gender = request.form['gender']

            try:
                cur.execute(
                    '''UPDATE member SET name = %s, phone = %s, gender = %s
                       WHERE member_id = %s''',
                    (name, phone or None, gender, g.user['member_id']),
                )
                get_db().commit()
                flash('Profile updated successfully.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error updating profile: {e}', 'danger')

        elif action == 'add_goal':
            goal_type = request.form['goal_type'].strip()
            target_value = request.form['target_value'].strip()
            start_date = request.form['start_date']
            end_date = request.form.get('end_date') or None

            try:
                cur.execute(
                    '''INSERT INTO fitness_goal
                       (member_id, goal_type, target_value, start_date, end_date)
                       VALUES (%s, %s, %s, %s, %s)''',
                    (g.user['member_id'], goal_type, target_value,
                     start_date, end_date),
                )
                get_db().commit()
                flash('Fitness goal added successfully.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error adding goal: {e}', 'danger')

        elif action == 'update_goal':
            goal_id = request.form['goal_id']
            status = request.form['goal_status']

            try:
                cur.execute(
                    '''UPDATE fitness_goal SET status = %s
                       WHERE goal_id = %s AND member_id = %s''',
                    (status, goal_id, g.user['member_id']),
                )
                get_db().commit()
                flash('Goal updated.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error updating goal: {e}', 'danger')

        elif action == 'add_metric':
            weight = request.form.get('weight') or None
            body_fat = request.form.get('body_fat_pct') or None
            bp_val = request.form.get('blood_pressure', '').strip() or None
            heart_rate = request.form.get('heart_rate') or None

            try:
                cur.execute(
                    '''INSERT INTO health_metric
                       (member_id, weight, body_fat_pct, blood_pressure, heart_rate)
                       VALUES (%s, %s, %s, %s, %s)''',
                    (g.user['member_id'], weight, body_fat, bp_val, heart_rate),
                )
                get_db().commit()
                flash('Health metric recorded.', 'success')
            except Exception as e:
                get_db().rollback()
                flash(f'Error recording metric: {e}', 'danger')

        cur.close()
        return redirect(url_for('member.profile'))

    # GET: load profile data, goals, recent metrics
    cur.execute('SELECT * FROM member WHERE member_id = %s', (g.user['member_id'],))
    member = cur.fetchone()

    cur.execute(
        '''SELECT * FROM fitness_goal
           WHERE member_id = %s ORDER BY start_date DESC''',
        (g.user['member_id'],),
    )
    goals = cur.fetchall()

    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at DESC LIMIT 5''',
        (g.user['member_id'],),
    )
    recent_metrics = cur.fetchall()

    cur.close()
    return render_template(
        'member/profile.html',
        member=member, goals=goals, recent_metrics=recent_metrics,
    )


# ── Operation 3: Health History ───────────────────────────────

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
    return render_template('member/health_history.html', metrics=metrics)


# ── Operation 4: Dashboard ───────────────────────────────────

@bp.route('/dashboard')
@role_required('member')
def dashboard():
    cur = get_cursor()
    mid = g.user['member_id']

    # Dashboard view data
    cur.execute(
        'SELECT * FROM member_dashboard_view WHERE member_id = %s',
        (mid,),
    )
    summary = cur.fetchone()

    # Active goals
    cur.execute(
        '''SELECT * FROM fitness_goal
           WHERE member_id = %s AND status = 'active'
           ORDER BY start_date DESC''',
        (mid,),
    )
    active_goals = cur.fetchall()

    # Recent health metrics (last 5)
    cur.execute(
        '''SELECT * FROM health_metric
           WHERE member_id = %s ORDER BY recorded_at DESC LIMIT 5''',
        (mid,),
    )
    recent_metrics = cur.fetchall()

    # Upcoming personal sessions
    cur.execute(
        '''SELECT ps.*, t.name AS trainer_name, r.room_name
           FROM personal_session ps
           JOIN trainer t ON t.trainer_id = ps.trainer_id
           JOIN room r ON r.room_id = ps.room_id
           WHERE ps.member_id = %s AND ps.status = 'scheduled'
             AND ps.session_date >= CURRENT_DATE
           ORDER BY ps.session_date, ps.start_time''',
        (mid,),
    )
    upcoming_sessions = cur.fetchall()

    # Upcoming enrolled classes
    cur.execute(
        '''SELECT gc.*, t.name AS trainer_name, r.room_name
           FROM class_enrollment ce
           JOIN group_class gc ON gc.class_id = ce.class_id
           JOIN trainer t ON t.trainer_id = gc.trainer_id
           JOIN room r ON r.room_id = gc.room_id
           WHERE ce.member_id = %s AND gc.class_date >= CURRENT_DATE
           ORDER BY gc.class_date, gc.start_time''',
        (mid,),
    )
    upcoming_classes = cur.fetchall()

    cur.close()
    return render_template(
        'member/dashboard.html',
        summary=summary,
        active_goals=active_goals,
        recent_metrics=recent_metrics,
        upcoming_sessions=upcoming_sessions,
        upcoming_classes=upcoming_classes,
    )
