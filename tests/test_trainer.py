"""Tests for trainer routes (/api/trainer/*)."""

from conftest import _exec_raises_after


# ---------------------------------------------------------------------------
# Authorization guard
# ---------------------------------------------------------------------------

def test_dashboard_unauthenticated(client, mock_db):
    resp = client.get('/api/trainer/dashboard')
    assert resp.status_code == 401
    assert resp.get_json()['error_code'] == 'AUTH_001'


def test_dashboard_wrong_role(member_auth):
    client, _, _, _ = member_auth
    resp = client.get('/api/trainer/dashboard')
    assert resp.status_code == 403
    assert resp.get_json()['error_code'] == 'AUTH_002'


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def test_dashboard_success(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [
        trainer,
        {'total': 5},    # total_sessions
        {'total': 3},    # total_classes
        {'total': 10},   # total_members
        {'total': 8},    # total_availability_slots
    ]
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total_sessions'] == 5
    assert data['total_classes'] == 3
    assert data['total_members'] == 10
    assert data['total_availability_slots'] == 8
    assert 'upcoming_sessions' in data
    assert 'session_trend' in data
    assert 'class_trend' in data


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

def test_profile_get(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, trainer]

    resp = client.get('/api/trainer/profile')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['trainer']['name'] == 'Test Trainer'
    assert 'password_hash' not in data['trainer']


def test_profile_update(trainer_auth):
    client, mock_conn, _, _ = trainer_auth

    resp = client.put('/api/trainer/profile', json={
        'name': 'Updated Trainer', 'phone': '9999999999', 'specialization': 'Yoga',
    })
    assert resp.status_code == 200
    assert 'Profile updated' in resp.get_json()['message']
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------

def test_schedule_success(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/schedule')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'sessions' in data
    assert 'classes' in data
    assert 'member_health' in data


# ---------------------------------------------------------------------------
# Rooms
# ---------------------------------------------------------------------------

def test_rooms(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/rooms')
    assert resp.status_code == 200
    assert 'rooms' in resp.get_json()


# ---------------------------------------------------------------------------
# Calendar
# ---------------------------------------------------------------------------

def test_calendar_success(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/calendar?year=2026&month=3')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['year'] == 2026
    assert data['month'] == 3
    assert 'availability' in data
    assert 'sessions' in data
    assert 'classes' in data


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

def test_availability_get(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/availability')
    assert resp.status_code == 200
    assert 'slots' in resp.get_json()


def test_availability_add_success(trainer_auth):
    client, mock_conn, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, None]

    resp = client.post('/api/trainer/availability', json={
        'available_date': '2026-04-01',
        'start_time': '09:00',
        'end_time': '17:00',
    })
    assert resp.status_code == 201
    assert 'Availability slot added' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_availability_add_overlap(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.post('/api/trainer/availability', json={
        'available_date': '2026-04-01',
        'start_time': '09:00',
        'end_time': '12:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_006'


def test_availability_add_missing_fields(trainer_auth):
    client, _, _, _ = trainer_auth

    resp = client.post('/api/trainer/availability', json={
        'available_date': '2026-04-01',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_availability_add_end_before_start(trainer_auth):
    client, _, _, _ = trainer_auth

    resp = client.post('/api/trainer/availability', json={
        'available_date': '2026-04-01',
        'start_time': '17:00',
        'end_time': '09:00',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


def test_availability_delete(trainer_auth):
    client, mock_conn, _, _ = trainer_auth

    resp = client.delete('/api/trainer/availability/1')
    assert resp.status_code == 200
    assert 'removed' in resp.get_json()['message']
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Sessions (update / delete)
# ---------------------------------------------------------------------------

def test_session_delete_success(trainer_auth):
    client, mock_conn, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.delete('/api/trainer/sessions/1')
    assert resp.status_code == 200
    assert 'Session deleted' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_session_not_found(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, None]

    resp = client.delete('/api/trainer/sessions/999')
    assert resp.status_code == 404
    assert resp.get_json()['error_code'] == 'RES_001'


def test_session_update_success(trainer_auth):
    client, mock_conn, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
        'start_time': '09:00',
        'end_time': '10:00',
    })
    assert resp.status_code == 200
    assert 'Session updated' in resp.get_json()['message']


def test_session_update_missing_fields(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


# ---------------------------------------------------------------------------
# Classes (update / delete)
# ---------------------------------------------------------------------------

def test_class_delete_success(trainer_auth):
    client, mock_conn, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.delete('/api/trainer/classes/1')
    assert resp.status_code == 200
    assert 'Class deleted' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_class_not_found(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, None]

    resp = client.delete('/api/trainer/classes/999')
    assert resp.status_code == 404
    assert resp.get_json()['error_code'] == 'RES_002'


def test_class_update_success(trainer_auth):
    client, mock_conn, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
        'start_time': '09:00',
        'end_time': '10:00',
        'class_name': 'Yoga Basics',
        'max_participants': 20,
    })
    assert resp.status_code == 200
    assert 'Class updated' in resp.get_json()['message']


# ---------------------------------------------------------------------------
# Profile update DB error
# ---------------------------------------------------------------------------

def test_profile_update_db_error(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/trainer/profile', json={
        'name': 'X', 'phone': '1', 'specialization': 'Y',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_002'


# ---------------------------------------------------------------------------
# Calendar default date (no year/month params)
# ---------------------------------------------------------------------------

def test_calendar_default_date(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/trainer/calendar')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'year' in data
    assert 'month' in data


# ---------------------------------------------------------------------------
# Session DELETE DB error
# ---------------------------------------------------------------------------

def test_session_delete_db_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    # 3 pre-route + SELECT exists(4) + DELETE(5)
    mock_cur.execute.side_effect = _exec_raises_after(4)

    resp = client.delete('/api/trainer/sessions/1')
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Session PUT error branches
# ---------------------------------------------------------------------------

def test_session_update_end_before_start(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
        'start_time': '10:00',
        'end_time': '09:00',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


def test_session_update_parse_db_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    # 3 pre-route + SELECT exists(4) + UPDATE(5)
    mock_cur.execute.side_effect = _exec_raises_after(
        4, 'Room Studio A is already booked for a class on 2026-04-01')

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_session_update_already_booked_fallback(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'already booked')

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_session_update_generic_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'connection lost')

    resp = client.put('/api/trainer/sessions/1', json={
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Class DELETE DB error
# ---------------------------------------------------------------------------

def test_class_delete_db_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4)

    resp = client.delete('/api/trainer/classes/1')
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Class PUT error branches
# ---------------------------------------------------------------------------

def test_class_update_missing_fields(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_class_update_end_before_start(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
        'start_time': '10:00',
        'end_time': '09:00',
        'class_name': 'Yoga',
        'max_participants': 10,
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


def test_class_update_parse_db_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(
        4, 'Room Studio A is already booked for a class on 2026-04-01')

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'class_name': 'Yoga', 'max_participants': 10,
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_class_update_already_booked_fallback(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'already booked')

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'class_name': 'Yoga', 'max_participants': 10,
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_class_update_generic_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'connection lost')

    resp = client.put('/api/trainer/classes/1', json={
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'class_name': 'Yoga', 'max_participants': 10,
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Availability DB errors
# ---------------------------------------------------------------------------

def test_availability_add_db_error(trainer_auth):
    client, _, mock_cur, trainer = trainer_auth
    mock_cur.fetchone.side_effect = [trainer, None]
    # 3 pre-route + SELECT overlap(4) + INSERT(5)
    mock_cur.execute.side_effect = _exec_raises_after(4)

    resp = client.post('/api/trainer/availability', json={
        'available_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '17:00',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


def test_availability_delete_db_error(trainer_auth):
    client, _, mock_cur, _ = trainer_auth
    # 3 pre-route + DELETE(4)
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.delete('/api/trainer/availability/1')
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'
