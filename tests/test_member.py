"""Tests for member routes (/api/member/*)."""

from conftest import SAMPLE_MEMBER
from backend.routes.member import _parse_detail_times


# ---------------------------------------------------------------------------
# Authorization guard
# ---------------------------------------------------------------------------

def test_dashboard_unauthenticated(client, mock_db):
    resp = client.get('/api/member/dashboard')
    assert resp.status_code == 401
    assert resp.get_json()['error_code'] == 'AUTH_001'


def test_dashboard_wrong_role(trainer_auth):
    client, _, _, _ = trainer_auth
    resp = client.get('/api/member/dashboard')
    assert resp.status_code == 403
    assert resp.get_json()['error_code'] == 'AUTH_002'


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def test_dashboard_success(member_auth):
    client, _, mock_cur, member = member_auth
    summary = {'member_id': 1, 'total_sessions': 5}
    mock_cur.fetchone.side_effect = [member, summary]
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()
    for key in ('summary', 'active_goals', 'recent_metrics',
                'all_metrics', 'upcoming_sessions', 'upcoming_classes'):
        assert key in data


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

def test_profile_get(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, member]
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/profile')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['member']['name'] == 'Test Member'
    assert 'password_hash' not in data['member']
    assert 'goals' in data
    assert 'recent_metrics' in data


def test_profile_update(member_auth):
    client, mock_conn, mock_cur, member = member_auth

    resp = client.put('/api/member/profile', json={
        'name': 'Updated Name', 'phone': '9999999999', 'gender': 'male',
    })
    assert resp.status_code == 200
    assert 'Profile updated' in resp.get_json()['message']
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------

def test_add_goal_success(member_auth):
    client, mock_conn, _, _ = member_auth

    resp = client.post('/api/member/goals', json={
        'goal_type': 'Weight Loss',
        'target_value': '75 kg',
        'start_date': '2026-03-01',
        'end_date': '2026-06-01',
    })
    assert resp.status_code == 201
    assert 'Goal added' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_update_goal_success(member_auth):
    client, mock_conn, _, _ = member_auth

    resp = client.put('/api/member/goals/1', json={'status': 'achieved'})
    assert resp.status_code == 200
    assert 'Goal updated' in resp.get_json()['message']


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def test_add_metric_success(member_auth):
    client, mock_conn, _, _ = member_auth

    resp = client.post('/api/member/metrics', json={
        'weight': 75.5,
        'body_fat_pct': 20.0,
        'blood_pressure': '120/80',
        'heart_rate': 72,
    })
    assert resp.status_code == 201
    assert 'Health metric recorded' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_health_history(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/health-history')
    assert resp.status_code == 200
    assert 'metrics' in resp.get_json()


# ---------------------------------------------------------------------------
# Booking options / trainer availability
# ---------------------------------------------------------------------------

def test_booking_options(member_auth):
    client, _, mock_cur, _ = member_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/booking-options')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'trainers' in data
    assert 'rooms' in data


def test_trainer_availability_missing_id(member_auth):
    client, _, _, _ = member_auth

    resp = client.get('/api/member/trainer-availability')
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_trainer_availability_success(member_auth):
    client, _, mock_cur, _ = member_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/trainer-availability?trainer_id=1')
    assert resp.status_code == 200
    assert 'slots' in resp.get_json()


# ---------------------------------------------------------------------------
# Book session
# ---------------------------------------------------------------------------

def test_book_session_success(member_auth):
    client, mock_conn, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = []

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 201
    assert 'Session booked' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_book_session_missing_fields(member_auth):
    client, _, _, _ = member_auth

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1,
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_book_session_end_before_start(member_auth):
    client, _, _, _ = member_auth

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '10:00', 'end_time': '09:00',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


def test_book_session_trainer_not_available(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, None]

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_004'


# ---------------------------------------------------------------------------
# Cancel session
# ---------------------------------------------------------------------------

def test_cancel_session_success(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    mock_cur.rowcount = 1

    resp = client.put('/api/member/sessions/1', json={'status': 'cancelled'})
    assert resp.status_code == 200
    assert 'Session cancelled' in resp.get_json()['message']


def test_cancel_session_not_found(member_auth):
    client, _, mock_cur, _ = member_auth
    mock_cur.rowcount = 0

    resp = client.put('/api/member/sessions/999', json={'status': 'cancelled'})
    assert resp.status_code == 404
    assert resp.get_json()['error_code'] == 'RES_001'


def test_cancel_session_invalid_status(member_auth):
    client, _, _, _ = member_auth

    resp = client.put('/api/member/sessions/1', json={'status': 'completed'})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_009'


# ---------------------------------------------------------------------------
# Available classes / enroll / drop
# ---------------------------------------------------------------------------

def test_available_classes(member_auth):
    client, _, mock_cur, _ = member_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/member/available-classes')
    assert resp.status_code == 200
    assert 'classes' in resp.get_json()


def test_enroll_success(member_auth):
    client, mock_conn, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'class_id': 1}, {'1': 1}]

    resp = client.post('/api/member/classes/1/enroll')
    assert resp.status_code == 201
    assert 'Enrolled' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_enroll_class_not_found(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, None]

    resp = client.post('/api/member/classes/999/enroll')
    assert resp.status_code == 404
    assert resp.get_json()['error_code'] == 'RES_002'


def test_enroll_class_passed(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'class_id': 1}, None]

    resp = client.post('/api/member/classes/1/enroll')
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'CLASS_003'


def test_drop_class_success(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    mock_cur.rowcount = 1

    resp = client.delete('/api/member/classes/1/enroll')
    assert resp.status_code == 200
    assert 'Dropped' in resp.get_json()['message']


def test_drop_class_not_enrolled(member_auth):
    client, _, mock_cur, _ = member_auth
    mock_cur.rowcount = 0

    resp = client.delete('/api/member/classes/999/enroll')
    assert resp.status_code == 404
    assert resp.get_json()['error_code'] == 'RES_003'


# ---------------------------------------------------------------------------
# _parse_detail_times
# ---------------------------------------------------------------------------

def test_parse_detail_times_with_times():
    result = _parse_detail_times('from 08:00:00 to 09:00:00')
    assert result == ('8:00 AM', '9:00 AM')


def test_parse_detail_times_no_to():
    assert _parse_detail_times('some other detail') is None


# ---------------------------------------------------------------------------
# Profile update DB error
# ---------------------------------------------------------------------------

def _exec_raises_after(n, error_msg='db error'):
    """Return a side_effect list: n Nones then an Exception."""
    return [None] * n + [Exception(error_msg)]


def test_profile_update_db_error(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    # 3 pre-route executes (SELECT user, SET ROLE, SET user_id) + 1 route UPDATE
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/member/profile', json={
        'name': 'N', 'phone': '1', 'gender': 'male',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_002'


# ---------------------------------------------------------------------------
# Goal DB errors
# ---------------------------------------------------------------------------

def test_add_goal_db_error(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.post('/api/member/goals', json={
        'goal_type': 'Weight Loss', 'target_value': '75 kg',
        'start_date': '2026-03-01',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


def test_update_goal_db_error(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/member/goals/1', json={'status': 'achieved'})
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Metric DB error
# ---------------------------------------------------------------------------

def test_add_metric_db_error(member_auth):
    client, mock_conn, mock_cur, _ = member_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.post('/api/member/metrics', json={
        'weight': 75.5,
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Book session – conflict branch (fn_check_booking_conflicts returns rows)
# ---------------------------------------------------------------------------

def test_book_session_member_conflict(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = [
        {'conflict_type': 'member', 'detail': 'from 09:00:00 to 10:00:00'},
    ]

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_002'


def test_book_session_trainer_conflict(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = [
        {'conflict_type': 'trainer', 'detail': 'from 09:00:00 to 10:00:00'},
    ]

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_005'


def test_book_session_room_conflict(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = [
        {'conflict_type': 'room', 'detail': 'from 09:00:00 to 10:00:00'},
    ]

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_book_session_conflict_no_detail_times(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = [
        {'conflict_type': 'member', 'detail': ''},
    ]

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_002'


# ---------------------------------------------------------------------------
# Book session – DB exception paths
# ---------------------------------------------------------------------------

def test_book_session_db_error_parsed(member_auth):
    """DB exception that parse_db_error can recognize."""
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = []
    # 3 pre-route + SELECT avail(4) + SELECT conflicts(5) + INSERT(6)
    mock_cur.execute.side_effect = _exec_raises_after(
        5, 'You already have a session on 2026-04-01 from 09:00:00 to 10:00:00. Cancel first.')

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_002'


def test_book_session_db_error_already_booked_fallback(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = []
    mock_cur.execute.side_effect = _exec_raises_after(5, 'already booked for this slot')

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_book_session_db_error_overlapping_fallback(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = []
    mock_cur.execute.side_effect = _exec_raises_after(5, 'overlapping session detected')

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_001'


def test_book_session_db_error_generic(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'1': 1}]
    mock_cur.fetchall.return_value = []
    mock_cur.execute.side_effect = _exec_raises_after(5, 'connection lost unexpectedly')

    resp = client.post('/api/member/sessions', json={
        'trainer_id': 1, 'room_id': 1, 'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Enroll – exception branches
# ---------------------------------------------------------------------------

def test_enroll_duplicate_error(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'class_id': 1}, {'1': 1}]
    # 3 pre-route + SELECT class(4) + SELECT future(5) + INSERT(6)
    mock_cur.execute.side_effect = _exec_raises_after(
        5, 'unique constraint violation on class_enrollment')

    resp = client.post('/api/member/classes/1/enroll')
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'CLASS_001'


def test_enroll_class_full_error(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'class_id': 1}, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(5, 'class is full')

    resp = client.post('/api/member/classes/1/enroll')
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'CLASS_002'


def test_enroll_generic_error(member_auth):
    client, _, mock_cur, member = member_auth
    mock_cur.fetchone.side_effect = [member, {'class_id': 1}, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(5, 'connection lost')

    resp = client.post('/api/member/classes/1/enroll')
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'
