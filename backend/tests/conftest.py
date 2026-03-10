import pytest
from unittest.mock import MagicMock, patch
from werkzeug.security import generate_password_hash

from backend.jwt_utils import create_access_token

SAMPLE_MEMBER = {
    'member_id': 1,
    'name': 'Test Member',
    'email': 'member@test.com',
    'dob': '2000-01-01',
    'gender': 'male',
    'phone': '1234567890',
    'password_hash': generate_password_hash('password123', method='pbkdf2:sha256'),
}

SAMPLE_TRAINER = {
    'trainer_id': 1,
    'name': 'Test Trainer',
    'email': 'trainer@test.com',
    'specialization': 'Fitness',
    'phone': '1234567890',
    'password_hash': generate_password_hash('password123', method='pbkdf2:sha256'),
}

SAMPLE_ADMIN = {
    'admin_id': 1,
    'name': 'Test Admin',
    'email': 'admin@test.com',
    'phone': '1234567890',
    'password_hash': generate_password_hash('password123', method='pbkdf2:sha256'),
}


class _AuthClient:
    """Wraps Flask test client to inject JWT Authorization header automatically."""

    def __init__(self, real_client, token):
        self._client = real_client
        self._auth = {'Authorization': f'Bearer {token}'}

    def _kw(self, kwargs):
        headers = dict(self._auth)
        if 'headers' in kwargs:
            headers.update(kwargs.pop('headers'))
        kwargs['headers'] = headers
        return kwargs

    def get(self, *a, **kw):
        return self._client.get(*a, **self._kw(kw))

    def post(self, *a, **kw):
        return self._client.post(*a, **self._kw(kw))

    def put(self, *a, **kw):
        return self._client.put(*a, **self._kw(kw))

    def delete(self, *a, **kw):
        return self._client.delete(*a, **self._kw(kw))


@pytest.fixture
def app():
    from backend import create_app
    application = create_app()
    application.config['TESTING'] = True
    application.config['SECRET_KEY'] = 'test-secret-key-that-is-long-enough-for-hs256'
    return application


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def mock_db():
    """Patch psycopg2.connect so no real DB is needed. Yields (mock_conn, mock_cur)."""
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_cur.__enter__ = MagicMock(return_value=mock_cur)
    mock_cur.__exit__ = MagicMock(return_value=False)
    mock_conn.cursor.return_value = mock_cur
    with patch('psycopg2.connect', return_value=mock_conn):
        yield mock_conn, mock_cur


@pytest.fixture
def sample_member():
    return dict(SAMPLE_MEMBER)


@pytest.fixture
def sample_trainer():
    return dict(SAMPLE_TRAINER)


@pytest.fixture
def sample_admin():
    return dict(SAMPLE_ADMIN)


def _make_token(app, user_id, role):
    return create_access_token(
        user_id, role,
        app.config['SECRET_KEY'],
        app.config.get('JWT_ACCESS_EXPIRES', 900),
    )


def _make_auth_client(client, app, mock_db, user_id, role, user_data):
    mock_conn, mock_cur = mock_db
    token = _make_token(app, user_id, role)
    mock_cur.fetchone.return_value = dict(user_data)
    return _AuthClient(client, token), mock_conn, mock_cur, dict(user_data)


@pytest.fixture
def member_auth(client, app, mock_db):
    """Authenticated member client. Returns (client, mock_conn, mock_cur, user_data)."""
    return _make_auth_client(
        client, app, mock_db,
        SAMPLE_MEMBER['member_id'], 'member', SAMPLE_MEMBER,
    )


@pytest.fixture
def trainer_auth(client, app, mock_db):
    """Authenticated trainer client."""
    return _make_auth_client(
        client, app, mock_db,
        SAMPLE_TRAINER['trainer_id'], 'trainer', SAMPLE_TRAINER,
    )


def _exec_raises_after(n, error_msg='db error'):
    """Return side_effect list: n Nones then Exception. For testing DB failure paths."""
    return [None] * n + [Exception(error_msg)]


@pytest.fixture
def admin_auth(client, app, mock_db):
    """Authenticated admin client."""
    return _make_auth_client(
        client, app, mock_db,
        SAMPLE_ADMIN['admin_id'], 'admin', SAMPLE_ADMIN,
    )
