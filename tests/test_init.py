"""Tests for backend/__init__.py: _log_api, DEBUG_API_LOGGING, CORS_ORIGINS."""

import os
from io import StringIO
from unittest.mock import patch, MagicMock

import pytest


# ---------------------------------------------------------------------------
# _log_api
# ---------------------------------------------------------------------------

class TestLogApi:
    def test_msg_only(self, capsys):
        from backend import _log_api
        _log_api('hello')
        out = capsys.readouterr().out
        assert '[API] hello' in out

    def test_msg_with_data(self, capsys):
        from backend import _log_api
        _log_api('info', {'key': 'val'})
        out = capsys.readouterr().out
        assert '[API] info' in out
        assert '"key"' in out

    def test_msg_with_none_data(self, capsys):
        from backend import _log_api
        _log_api('no data', None)
        out = capsys.readouterr().out
        assert '[API] no data' in out
        assert '"key"' not in out


# ---------------------------------------------------------------------------
# DEBUG_API_LOGGING branch
# ---------------------------------------------------------------------------

class TestDebugApiLogging:
    @pytest.fixture
    def debug_app(self, mock_db):
        from backend.config import Config
        with patch.object(Config, 'DEBUG_API_LOGGING', True):
            from backend import create_app
            app = create_app()
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret'
        return app

    def test_get_request_logging(self, debug_app, mock_db, capsys):
        client = debug_app.test_client()
        client.get('/api/me')
        out = capsys.readouterr().out
        assert '>>> REQUEST:' in out
        assert '<<< RESPONSE:' in out

    def test_post_request_logging(self, debug_app, mock_db, capsys):
        client = debug_app.test_client()
        client.post('/api/logout')
        out = capsys.readouterr().out
        assert '>>> REQUEST:' in out

    def test_post_with_json_body(self, debug_app, mock_db, capsys):
        client = debug_app.test_client()
        client.post('/api/login', json={
            'email': 'x@test.com', 'password': 'p', 'role': 'member',
        })
        out = capsys.readouterr().out
        assert '>>> BODY:' in out

    def test_get_with_query_string(self, debug_app, mock_db, capsys):
        client = debug_app.test_client()
        client.get('/api/me?foo=bar')
        out = capsys.readouterr().out
        assert '?foo=bar' in out


# ---------------------------------------------------------------------------
# CORS_ORIGINS env var
# ---------------------------------------------------------------------------

class TestCorsOrigins:
    def test_extra_cors_origins(self, mock_db):
        from backend import create_app
        with patch.dict(os.environ, {'CORS_ORIGINS': 'http://extra:3000, http://other:4000'}):
            app = create_app()
        assert app is not None
