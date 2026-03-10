import datetime
import decimal
from unittest.mock import MagicMock, patch

from backend.db import apply_role, close_db, serialize_row, serialize_rows


# ---------------------------------------------------------------------------
# serialize_row
# ---------------------------------------------------------------------------

class TestSerializeRow:
    def test_none_returns_none(self):
        assert serialize_row(None) is None

    def test_date(self):
        row = {'d': datetime.date(2026, 3, 6)}
        assert serialize_row(row) == {'d': '2026-03-06'}

    def test_datetime(self):
        row = {'dt': datetime.datetime(2026, 3, 6, 14, 30, 0)}
        assert serialize_row(row) == {'dt': '2026-03-06T14:30:00'}

    def test_time(self):
        row = {'t': datetime.time(8, 30)}
        assert serialize_row(row) == {'t': '08:30'}

    def test_timedelta_hours_minutes(self):
        row = {'dur': datetime.timedelta(hours=2, minutes=15)}
        assert serialize_row(row) == {'dur': '02:15'}

    def test_timedelta_zero(self):
        row = {'dur': datetime.timedelta(0)}
        assert serialize_row(row) == {'dur': '00:00'}

    def test_decimal_to_float(self):
        row = {'amount': decimal.Decimal('99.99')}
        result = serialize_row(row)
        assert result['amount'] == 99.99
        assert isinstance(result['amount'], float)

    def test_plain_values_pass_through(self):
        row = {'name': 'Alice', 'age': 30, 'active': True}
        assert serialize_row(row) == {'name': 'Alice', 'age': 30, 'active': True}

    def test_mixed_types(self):
        row = {
            'id': 1,
            'created': datetime.date(2026, 1, 1),
            'amount': decimal.Decimal('50.00'),
            'name': 'Test',
        }
        assert serialize_row(row) == {
            'id': 1,
            'created': '2026-01-01',
            'amount': 50.0,
            'name': 'Test',
        }


# ---------------------------------------------------------------------------
# apply_role
# ---------------------------------------------------------------------------

class TestApplyRole:
    def test_none_role_returns_early(self, app, mock_db):
        with app.test_request_context():
            apply_role(None, 1)

    def test_none_user_id_returns_early(self, app, mock_db):
        with app.test_request_context():
            apply_role('member', None)

    def test_unknown_role_returns_early(self, app, mock_db):
        mock_conn, mock_cur = mock_db
        with app.test_request_context():
            from flask import g
            g.db = mock_conn
            apply_role('unknown', 1)
            mock_cur.execute.assert_not_called()

    def test_non_int_user_id_returns_early(self, app, mock_db):
        mock_conn, mock_cur = mock_db
        with app.test_request_context():
            from flask import g
            g.db = mock_conn
            apply_role('member', 'not-a-number')
            mock_cur.execute.assert_not_called()


# ---------------------------------------------------------------------------
# close_db
# ---------------------------------------------------------------------------

class TestCloseDb:
    def test_no_db_in_g(self, app):
        with app.test_request_context():
            close_db()

    def test_reset_role_success(self, app):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.__enter__ = MagicMock(return_value=mock_cur)
        mock_cur.__exit__ = MagicMock(return_value=False)
        mock_conn.cursor.return_value = mock_cur
        with app.test_request_context():
            from flask import g
            g.db = mock_conn
            close_db()
            mock_conn.close.assert_called_once()

    def test_reset_role_exception(self, app):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.__enter__ = MagicMock(return_value=mock_cur)
        mock_cur.__exit__ = MagicMock(return_value=False)
        mock_cur.execute.side_effect = Exception('connection closed')
        mock_conn.cursor.return_value = mock_cur
        with app.test_request_context():
            from flask import g
            g.db = mock_conn
            close_db()
            mock_conn.close.assert_called_once()


# ---------------------------------------------------------------------------
# serialize_rows
# ---------------------------------------------------------------------------

class TestSerializeRows:
    def test_empty_list(self):
        assert serialize_rows([]) == []

    def test_multiple_rows(self):
        rows = [{'id': 1, 'name': 'A'}, {'id': 2, 'name': 'B'}]
        assert serialize_rows(rows) == [{'id': 1, 'name': 'A'}, {'id': 2, 'name': 'B'}]

    def test_dates_serialized(self):
        rows = [
            {'d': datetime.date(2026, 1, 1)},
            {'d': datetime.date(2026, 12, 31)},
        ]
        assert serialize_rows(rows) == [{'d': '2026-01-01'}, {'d': '2026-12-31'}]


# ---------------------------------------------------------------------------
# get_db with DB_SSLMODE
# ---------------------------------------------------------------------------

class TestGetDbSslMode:
    def test_connect_includes_sslmode_when_set(self, app):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.__enter__ = MagicMock(return_value=mock_cur)
        mock_cur.__exit__ = MagicMock(return_value=False)
        mock_conn.cursor.return_value = mock_cur
        with patch('psycopg2.connect', return_value=mock_conn) as mock_connect:
            app.config['DB_SSLMODE'] = 'require'
            with app.test_request_context():
                from backend.db import get_db
                get_db()
            mock_connect.assert_called_once()
            call_kwargs = mock_connect.call_args[1]
            assert call_kwargs.get('sslmode') == 'require'
