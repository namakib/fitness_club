"""Tests for authentication routes: register, login, logout, me, config, refresh."""

import time

from flask import g, jsonify
import jwt as pyjwt
import pytest

from backend.jwt_utils import create_access_token, create_refresh_token, decode_token
from conftest import _make_token


# ---------------------------------------------------------------------------
# Config (demo mode)
# ---------------------------------------------------------------------------

class TestConfig:
    def test_config_not_demo(self, client, mock_db):
        resp = client.get('/api/config')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['demo_mode'] is False
        assert 'demo_accounts' not in data

    def test_config_demo_mode(self, mock_db):
        from backend import create_app
        app = create_app()
        app.config['TESTING'] = True
        app.config['DEMO_MODE'] = True
        with app.test_client() as c:
            resp = c.get('/api/config')
            assert resp.status_code == 200
            data = resp.get_json()
            assert data['demo_mode'] is True
            assert len(data['demo_accounts']) == 3
            roles = [a['role'] for a in data['demo_accounts']]
            assert 'member' in roles
            assert 'trainer' in roles
            assert 'admin' in roles


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class TestRegister:
    def test_blocked_in_demo_mode(self, mock_db):
        from backend import create_app
        app = create_app()
        app.config['TESTING'] = True
        app.config['DEMO_MODE'] = True
        with app.test_client() as c:
            resp = c.post('/api/register', json={
                'name': 'New', 'email': 'new@test.com',
                'dob': '2000-01-01', 'password': 'secret123',
            })
            assert resp.status_code == 403
            assert 'demo mode' in resp.get_json()['error'].lower()

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
        assert 'access_token' in data
        assert 'fc_refresh_token' in resp.headers.get('Set-Cookie', '')

    def test_trainer_success(self, client, mock_db, sample_trainer):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_trainer
        resp = client.post('/api/login', json={
            'email': 'trainer@test.com', 'password': 'password123', 'role': 'trainer',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['role'] == 'trainer'
        assert 'access_token' in data

    def test_admin_success(self, client, mock_db, sample_admin):
        _, mock_cur = mock_db
        mock_cur.fetchone.return_value = sample_admin
        resp = client.post('/api/login', json={
            'email': 'admin@test.com', 'password': 'password123', 'role': 'admin',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['role'] == 'admin'
        assert 'access_token' in data

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
        cookie_header = resp.headers.get('Set-Cookie', '')
        assert 'fc_refresh_token' in cookie_header


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
# load_logged_in_user – edge cases
# ---------------------------------------------------------------------------

class TestLoadLoggedInUser:
    def test_invalid_role_in_token(self, client, app, mock_db):
        token = _make_token(app, 1, 'superuser')
        resp = client.get('/api/me', headers={'Authorization': f'Bearer {token}'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user'] is None

    def test_expired_token(self, client, app, mock_db):
        token = create_access_token(1, 'member', app.config['SECRET_KEY'], -1)
        resp = client.get('/api/me', headers={'Authorization': f'Bearer {token}'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user'] is None

    def test_malformed_token(self, client, mock_db):
        resp = client.get('/api/me', headers={'Authorization': 'Bearer not.a.jwt'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user'] is None

    def test_refresh_token_rejected_as_access(self, client, app, mock_db):
        token = create_refresh_token(1, 'member', app.config['SECRET_KEY'], 900)
        resp = client.get('/api/me', headers={'Authorization': f'Bearer {token}'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user'] is None

    def test_no_bearer_prefix(self, client, mock_db):
        resp = client.get('/api/me', headers={'Authorization': 'Token abc'})
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


# ---------------------------------------------------------------------------
# Refresh endpoint
# ---------------------------------------------------------------------------

class TestRefresh:
    def test_success(self, client, app, mock_db):
        secret = app.config['SECRET_KEY']
        refresh = create_refresh_token(1, 'member', secret, 3600)
        client.set_cookie('fc_refresh_token', refresh, domain='localhost', path='/api')
        resp = client.post('/api/refresh')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'access_token' in data
        payload = decode_token(data['access_token'], secret)
        assert payload['sub'] == '1'
        assert payload['role'] == 'member'
        assert payload['type'] == 'access'

    def test_missing_cookie(self, client, mock_db):
        resp = client.post('/api/refresh')
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_001'

    def test_expired_refresh_token(self, client, app, mock_db):
        secret = app.config['SECRET_KEY']
        refresh = create_refresh_token(1, 'member', secret, -1)
        client.set_cookie('fc_refresh_token', refresh, domain='localhost', path='/api')
        resp = client.post('/api/refresh')
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_001'

    def test_access_token_rejected_as_refresh(self, client, app, mock_db):
        secret = app.config['SECRET_KEY']
        access = create_access_token(1, 'member', secret, 3600)
        client.set_cookie('fc_refresh_token', access, domain='localhost', path='/api')
        resp = client.post('/api/refresh')
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_001'

    def test_invalid_refresh_token(self, client, mock_db):
        client.set_cookie('fc_refresh_token', 'garbage.token.here', domain='localhost', path='/api')
        resp = client.post('/api/refresh')
        assert resp.status_code == 401
        assert resp.get_json()['error_code'] == 'AUTH_001'


# ---------------------------------------------------------------------------
# JWT utility functions
# ---------------------------------------------------------------------------

class TestJwtUtils:
    def test_create_and_decode_access(self):
        secret = 'a-long-enough-secret-key-for-hs256-tests'
        token = create_access_token(42, 'admin', secret, 300)
        payload = decode_token(token, secret)
        assert payload['sub'] == '42'
        assert payload['role'] == 'admin'
        assert payload['type'] == 'access'

    def test_create_and_decode_refresh(self):
        secret = 'a-long-enough-secret-key-for-hs256-tests'
        token = create_refresh_token(7, 'trainer', secret, 600)
        payload = decode_token(token, secret)
        assert payload['sub'] == '7'
        assert payload['role'] == 'trainer'
        assert payload['type'] == 'refresh'

    def test_expired_token_raises(self):
        secret = 'a-long-enough-secret-key-for-hs256-tests'
        token = create_access_token(1, 'member', secret, -1)
        with pytest.raises(pyjwt.ExpiredSignatureError):
            decode_token(token, secret)

    def test_wrong_secret_raises(self):
        secret_a = 'a-long-enough-secret-key-for-hs256-aaaa'
        secret_b = 'a-long-enough-secret-key-for-hs256-bbbb'
        token = create_access_token(1, 'member', secret_a, 300)
        with pytest.raises(pyjwt.InvalidSignatureError):
            decode_token(token, secret_b)
