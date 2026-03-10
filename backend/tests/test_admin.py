"""Tests for admin routes (/api/admin/*)."""

from conftest import _exec_raises_after


# ---------------------------------------------------------------------------
# Authorization guard
# ---------------------------------------------------------------------------

def test_dashboard_unauthenticated(client, mock_db):
    resp = client.get('/api/admin/dashboard')
    assert resp.status_code == 401
    assert resp.get_json()['error_code'] == 'AUTH_001'


def test_dashboard_wrong_role(member_auth):
    client, _, _, _ = member_auth
    resp = client.get('/api/admin/dashboard')
    assert resp.status_code == 403
    assert resp.get_json()['error_code'] == 'AUTH_002'


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def test_dashboard_success(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [
        admin,
        {'total': 10},   # total_members
        {'total': 3},    # total_trainers
        {'total': 20},   # total_equipment
        {'total': 5},    # total_rooms
        {'open': 2, 'resolved': 5},  # maintenance_summary
    ]
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/admin/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total_members'] == 10
    assert data['total_trainers'] == 3
    assert data['total_equipment'] == 20
    assert data['total_rooms'] == 5
    assert data['maintenance_summary'] == {'open': 2, 'resolved': 5}
    assert 'equipment_status' in data
    assert 'booking_trend' in data
    assert 'upcoming_bookings' in data


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

def test_profile_get(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, admin]

    resp = client.get('/api/admin/profile')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['admin']['name'] == 'Test Admin'
    assert 'password_hash' not in data['admin']


def test_profile_update(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.put('/api/admin/profile', json={
        'name': 'Updated Admin', 'phone': '9999999999',
    })
    assert resp.status_code == 200
    assert 'Profile updated' in resp.get_json()['message']
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Room booking
# ---------------------------------------------------------------------------

def test_room_booking_list(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/admin/room-booking')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'rooms' in data
    assert 'members' in data
    assert 'trainers' in data
    assert 'bookings' in data


def test_available_rooms(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = [
        {'room_id': 2, 'room_name': 'Yoga Studio', 'capacity': 20},
    ]

    resp = client.get(
        '/api/admin/room-booking/available-rooms'
        '?date=2026-04-01&start_time=09:00&end_time=10:00'
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['available_rooms'] == [
        {'room_id': 2, 'room_name': 'Yoga Studio', 'capacity': 20},
    ]


def test_available_rooms_incomplete_params(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.get('/api/admin/room-booking/available-rooms?date=2026-04-01')
    assert resp.status_code == 200
    assert resp.get_json()['available_rooms'] == []


def test_available_rooms_start_after_end(admin_auth):
    """When start_time >= end_time, return empty list."""
    client, _, _, _ = admin_auth

    resp = client.get(
        '/api/admin/room-booking/available-rooms'
        '?date=2026-04-01&start_time=10:00&end_time=09:00'
    )
    assert resp.status_code == 200
    assert resp.get_json()['available_rooms'] == []


def test_trainer_availability(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = [
        {
            'availability_id': 1,
            'available_date': '2026-04-01',
            'start_time': '09:00',
            'end_time': '10:00',
            'is_booked': False,
            'booked_by_me': False,
        },
    ]

    resp = client.get(
        '/api/admin/room-booking/trainer-availability'
        '?trainer_id=1&member_id=2'
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'slots' in data
    assert len(data['slots']) == 1
    assert data['slots'][0]['available_date'] == '2026-04-01'
    assert data['slots'][0]['start_time'] == '09:00'


def test_trainer_availability_missing_params(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.get('/api/admin/room-booking/trainer-availability?trainer_id=1')
    assert resp.status_code == 400

    resp = client.get('/api/admin/room-booking/trainer-availability?member_id=1')
    assert resp.status_code == 400


def test_book_session_success(admin_auth):
    client, mock_conn, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    mock_cur.fetchall.return_value = []  # no booking conflicts

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 201
    assert 'session booked' in resp.get_json()['message'].lower()
    mock_conn.commit.assert_called()


def test_book_session_no_availability(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, None]

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_004'


def test_book_class_success(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.post('/api/admin/room-booking/class', json={
        'class_name': 'Yoga Basics', 'trainer_id': 1, 'room_id': 1,
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'max_participants': 20,
    })
    assert resp.status_code == 201
    assert 'class scheduled' in resp.get_json()['message'].lower()
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Equipment
# ---------------------------------------------------------------------------

def test_equipment_list(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/admin/equipment')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'equipment_list' in data
    assert 'maintenance_logs' in data


def test_equipment_list_filtered(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/admin/equipment?status=active')
    assert resp.status_code == 200
    assert resp.get_json()['status_filter'] == 'active'


def test_log_issue_success(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.post('/api/admin/equipment/issue', json={
        'equipment_id': 1,
        'issue_description': 'Broken belt on treadmill',
    })
    assert resp.status_code == 201
    assert 'Maintenance issue logged' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_log_issue_missing_description(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/equipment/issue', json={
        'equipment_id': 1,
        'issue_description': '',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_008'


def test_update_equipment_status(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.put('/api/admin/equipment/1/status', json={'status': 'under_maintenance'})
    assert resp.status_code == 200
    assert 'Equipment status updated' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_update_maintenance_log(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.put('/api/admin/equipment/maintenance/1', json={
        'status': 'resolved', 'resolved_date': '2026-03-06',
    })
    assert resp.status_code == 200
    assert 'Maintenance log updated' in resp.get_json()['message']
    mock_conn.commit.assert_called()


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

def test_list_payments(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.fetchall.return_value = []

    resp = client.get('/api/admin/payments')
    assert resp.status_code == 200
    assert 'payments' in resp.get_json()


def test_create_payment_success(admin_auth):
    client, mock_conn, _, _ = admin_auth

    resp = client.post('/api/admin/payments', json={
        'member_id': 1, 'amount': 99.99,
    })
    assert resp.status_code == 201
    assert 'Payment recorded' in resp.get_json()['message']
    mock_conn.commit.assert_called()


def test_create_payment_missing_fields(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/payments', json={})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


# ---------------------------------------------------------------------------
# Helper for DB error side_effects
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Profile update DB error
# ---------------------------------------------------------------------------

def test_profile_update_db_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/admin/profile', json={
        'name': 'X', 'phone': '1',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_002'


# ---------------------------------------------------------------------------
# Book session – exception branches
# ---------------------------------------------------------------------------

def test_book_session_db_parsed_error(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    # 3 pre-route + SELECT avail(4) + INSERT(5)
    mock_cur.execute.side_effect = _exec_raises_after(
        4, 'You already have a session on 2026-04-01 from 09:00:00 to 10:00:00. Cancel first.')

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_002'


def test_book_session_already_booked_fallback(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'already booked')

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_book_session_overlapping_fallback(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'overlapping session detected')

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_001'


def test_book_session_generic_error(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    mock_cur.execute.side_effect = _exec_raises_after(4, 'connection lost')

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Book class – exception branches
# ---------------------------------------------------------------------------

def test_book_class_db_parsed_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(
        3, 'Room Studio A is already booked for a class on 2026-04-01')

    resp = client.post('/api/admin/room-booking/class', json={
        'class_name': 'Yoga', 'trainer_id': 1, 'room_id': 1,
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'max_participants': 20,
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_book_class_already_booked_fallback(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3, 'already booked')

    resp = client.post('/api/admin/room-booking/class', json={
        'class_name': 'Yoga', 'trainer_id': 1, 'room_id': 1,
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'max_participants': 20,
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_003'


def test_book_class_generic_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3, 'connection lost')

    resp = client.post('/api/admin/room-booking/class', json={
        'class_name': 'Yoga', 'trainer_id': 1, 'room_id': 1,
        'class_date': '2026-04-01',
        'start_time': '09:00', 'end_time': '10:00',
        'max_participants': 20,
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Equipment – exception branches
# ---------------------------------------------------------------------------

def test_log_issue_db_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.post('/api/admin/equipment/issue', json={
        'equipment_id': 1,
        'issue_description': 'Broken belt',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


def test_update_equipment_status_db_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/admin/equipment/1/status', json={'status': 'active'})
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


def test_update_maintenance_db_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.put('/api/admin/equipment/maintenance/1', json={
        'status': 'resolved', 'resolved_date': '2026-03-06',
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Payment – exception branch
# ---------------------------------------------------------------------------

def test_create_payment_db_error(admin_auth):
    client, _, mock_cur, _ = admin_auth
    mock_cur.execute.side_effect = _exec_raises_after(3)

    resp = client.post('/api/admin/payments', json={
        'member_id': 1, 'amount': 99.99,
    })
    assert resp.status_code == 500
    assert resp.get_json()['error_code'] == 'ERR_001'


# ---------------------------------------------------------------------------
# Profile update – empty name
# ---------------------------------------------------------------------------

def test_profile_update_empty_name(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.put('/api/admin/profile', json={
        'name': '', 'phone': '1234567890',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_001'


# ---------------------------------------------------------------------------
# Book session – missing fields & end_time <= start_time
# ---------------------------------------------------------------------------

def test_book_session_missing_fields(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/room-booking/session', json={})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_book_session_end_before_start(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '10:00', 'end_time': '09:00',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


# ---------------------------------------------------------------------------
# Book session – conflict handling (fn_check_booking_conflicts)
# ---------------------------------------------------------------------------

def test_book_session_conflicts(admin_auth):
    client, _, mock_cur, admin = admin_auth
    mock_cur.fetchone.side_effect = [admin, {'1': 1}]
    mock_cur.fetchall.return_value = [
        {'conflict_type': 'member', 'detail': 'from 10:00:00 to 11:00:00'},
        {'conflict_type': 'trainer', 'detail': 'from 10:00:00 to 11:00:00'},
        {'conflict_type': 'room', 'detail': None},
    ]

    resp = client.post('/api/admin/room-booking/session', json={
        'member_id': 1, 'trainer_id': 1, 'room_id': 1,
        'session_date': '2026-04-01',
        'start_time': '10:00', 'end_time': '11:00',
    })
    assert resp.status_code == 409
    assert resp.get_json()['error_code'] == 'BOOK_002'


# ---------------------------------------------------------------------------
# Book class – missing fields & end_time <= start_time
# ---------------------------------------------------------------------------

def test_book_class_missing_fields(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/room-booking/class', json={})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_book_class_end_before_start(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/room-booking/class', json={
        'class_name': 'Yoga', 'trainer_id': 1, 'room_id': 1,
        'class_date': '2026-04-01',
        'start_time': '10:00', 'end_time': '09:00',
        'max_participants': 20,
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_007'


# ---------------------------------------------------------------------------
# Equipment – missing fields
# ---------------------------------------------------------------------------

def test_log_issue_missing_equipment_id(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/equipment/issue', json={
        'issue_description': 'Broken belt',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_update_equipment_status_missing_status(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.put('/api/admin/equipment/1/status', json={})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


def test_update_maintenance_missing_status(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.put('/api/admin/equipment/maintenance/1', json={})
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_006'


# ---------------------------------------------------------------------------
# Payment – invalid amount
# ---------------------------------------------------------------------------

def test_create_payment_negative_amount(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/payments', json={
        'member_id': 1, 'amount': -5,
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_010'


def test_create_payment_non_numeric_amount(admin_auth):
    client, _, _, _ = admin_auth

    resp = client.post('/api/admin/payments', json={
        'member_id': 1, 'amount': 'abc',
    })
    assert resp.status_code == 400
    assert resp.get_json()['error_code'] == 'VAL_010'
