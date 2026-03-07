import pytest
from unittest.mock import MagicMock, patch
from werkzeug.security import generate_password_hash

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


@pytest.fixture
def app():
    from backend import create_app
    application = create_app()
    application.config['TESTING'] = True
    application.config['SECRET_KEY'] = 'test-secret'
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


@pytest.fixture
def member_auth(client, mock_db):
    """Authenticated member client. Returns (client, mock_conn, mock_cur, user_data).

    mock_cur.fetchone.return_value is preset to the member dict so
    load_logged_in_user finds the user.  Override with side_effect in tests
    that need multiple fetchone results.
    """
    mock_conn, mock_cur = mock_db
    with client.session_transaction() as sess:
        sess['user_id'] = SAMPLE_MEMBER['member_id']
        sess['role'] = 'member'
    mock_cur.fetchone.return_value = dict(SAMPLE_MEMBER)
    return client, mock_conn, mock_cur, dict(SAMPLE_MEMBER)


@pytest.fixture
def trainer_auth(client, mock_db):
    """Authenticated trainer client."""
    mock_conn, mock_cur = mock_db
    with client.session_transaction() as sess:
        sess['user_id'] = SAMPLE_TRAINER['trainer_id']
        sess['role'] = 'trainer'
    mock_cur.fetchone.return_value = dict(SAMPLE_TRAINER)
    return client, mock_conn, mock_cur, dict(SAMPLE_TRAINER)


@pytest.fixture
def admin_auth(client, mock_db):
    """Authenticated admin client."""
    mock_conn, mock_cur = mock_db
    with client.session_transaction() as sess:
        sess['user_id'] = SAMPLE_ADMIN['admin_id']
        sess['role'] = 'admin'
    mock_cur.fetchone.return_value = dict(SAMPLE_ADMIN)
    return client, mock_conn, mock_cur, dict(SAMPLE_ADMIN)
