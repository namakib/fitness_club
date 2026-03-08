"""Tests for authentication routes: register, login, logout, me."""

from flask import g, jsonify


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class TestRegister:
    def test_success(self, client, mock_db):
        mock_conn, mock_cur = mock_db
        resp = client.post('/api/register', json={
            'name': 'New User',
            'email': 'new@test.com',
            'dob': '2000-01-01',
            'password': 'secret123',
        })
        assert resp.status_code == 201
        assert 'Registration successful' in resp.get_json()['message']
        mock_conn.commit.assert_called()

    def test_missing_name(self, client, mock_db):
        resp = client.post('/api/register', json={
            'email': 'a@b.com', 'dob': '2000-01-01', 'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_001'

    def test_missing_email(self, client, mock_db):
        resp = client.post('/api/register', json={
            'name': 'User', 'dob': '2000-01-01', 'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_002'

    def test_missing_dob(self, client, mock_db):
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'a@b.com', 'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_003'

    def test_missing_password(self, client, mock_db):
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'a@b.com', 'dob': '2000-01-01',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_004'

    def test_short_password(self, client, mock_db):
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'a@b.com', 'dob': '2000-01-01',
            'password': '123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_005'

    def test_invalid_email_format(self, client, mock_db):
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'bademail', 'dob': '2000-01-01',
            'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'VAL_011'

    def test_duplicate_email(self, client, mock_db):
        _, mock_cur = mock_db
        mock_cur.execute.side_effect = Exception('unique constraint violation')
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'dup@test.com', 'dob': '2000-01-01',
            'password': 'secret123',
        })
        assert resp.status_code == 409
        assert resp.get_json()['error_code'] == 'AUTH_005'

    def test_generic_db_error(self, client, mock_db):
        _, mock_cur = mock_db
        mock_cur.execute.side_effect = Exception('connection lost')
        resp = client.post('/api/register', json={
            'name': 'User', 'email': 'a@b.com', 'dob': '2000-01-01',
            'password': 'secret123',
        })
        assert resp.status_code == 500
        assert resp.get_json()['error_code'] == 'AUTH_006'


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:
    def test_member_success(self, client, mock_db, sample_member):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_member
        resp = client.post('/api/login', json={
            'email': 'member@test.com', 'password': 'password123', 'role': 'member',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['role'] == 'member'
        assert data['user']['name'] == 'Test Member'
        assert 'password_hash' not in data['user']

    def test_trainer_success(self, client, mock_db, sample_trainer):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_trainer
        resp = client.post('/api/login', json={
            'email': 'trainer@test.com', 'password': 'password123', 'role': 'trainer',
        })
        assert resp.status_code == 200
        assert resp.get_json()['role'] == 'trainer'

    def test_admin_success(self, client, mock_db, sample_admin):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_admin
        resp = client.post('/api/login', json={
            'email': 'admin@test.com', 'password': 'password123', 'role': 'admin',
        })
        assert resp.status_code == 200
        assert resp.get_json()['role'] == 'admin'

    def test_invalid_role(self, client, mock_db):
        resp = client.post('/api/login', json={
            'email': 'a@b.com', 'password': 'x', 'role': 'superuser',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error_code'] == 'AUTH_003'

    def test_wrong_email(self, client, mock_db):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = None
        resp = client.post('/api/login', json={
            'email': 'wrong@test.com', 'password': 'password123', 'role': 'member',
        })
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_004'

    def test_wrong_password(self, client, mock_db, sample_member):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_member
        resp = client.post('/api/login', json={
            'email': 'member@test.com', 'password': 'wrongpass', 'role': 'member',
        })
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_004'


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class TestLogout:
    def test_logout(self, client, mock_db):
        resp = client.post('/api/logout')
        assert resp.status_code == 200
        assert 'Logged out' in resp.get_json()['message']


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

class TestMe:
    def test_unauthenticated(self, client, mock_db):
        resp = client.get('/api/me')
        data = resp.get_json()
        assert data['user'] is None
        assert data['role'] is None

    def test_authenticated_member(self, member_auth):
        client, _, _, _ = member_auth
        resp = client.get('/api/me')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user']['name'] == 'Test Member'
        assert data['role'] == 'member'
        assert 'password_hash' not in data['user']

    def test_authenticated_trainer(self, trainer_auth):
        client, _, _, _ = trainer_auth
        resp = client.get('/api/me')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user']['name'] == 'Test Trainer'
        assert data['role'] == 'trainer'


# ---------------------------------------------------------------------------
# load_logged_in_user – invalid role in session
# ---------------------------------------------------------------------------

class TestLoadLoggedInUser:
    def test_invalid_role_in_session(self, client, mock_db):
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['role'] = 'superuser'
        resp = client.get('/api/me')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user'] is None


# ---------------------------------------------------------------------------
# login_required decorator (used standalone)
# ---------------------------------------------------------------------------

class TestLoginRequired:
    def test_blocks_unauthenticated(self, app, mock_db):
        from backend.routes.auth import login_required

        @login_required
        def protected_view():
            return jsonify(ok=True)

        with app.test_request_context():
            g.user = None
            resp = protected_view()
            assert resp[1] == 401

    def test_allows_authenticated(self, app, mock_db):
        from backend.routes.auth import login_required

        @login_required
        def protected_view():
            return jsonify(ok=True)

        with app.test_request_context():
            g.user = {'name': 'Test'}
            resp = protected_view()
            assert resp.status_code == 200
