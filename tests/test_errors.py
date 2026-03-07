from backend.errors import (
    _format_time,
    _format_date,
    strip_db_context,
    parse_db_error,
    get_message,
    make_error,
    AUTH_001,
    AUTH_004,
    VAL_006,
    BOOK_001,
    BOOK_002,
    BOOK_003,
    BOOK_005,
    BOOK_006,
    ERR_001,
    CODE_HTTP_STATUS,
)


# ---------------------------------------------------------------------------
# _format_time
# ---------------------------------------------------------------------------

class TestFormatTime:
    def test_morning(self):
        assert _format_time('08:00:00') == '8:00 AM'

    def test_afternoon(self):
        assert _format_time('14:30:00') == '2:30 PM'

    def test_noon(self):
        assert _format_time('12:00:00') == '12:00 PM'

    def test_noon_with_minutes(self):
        assert _format_time('12:45') == '12:45 PM'

    def test_midnight(self):
        assert _format_time('00:00:00') == '12:00 AM'

    def test_midnight_with_minutes(self):
        assert _format_time('00:30') == '12:30 AM'

    def test_short_format(self):
        assert _format_time('09:15') == '9:15 AM'

    def test_late_evening(self):
        assert _format_time('23:59:00') == '11:59 PM'

    def test_one_pm(self):
        assert _format_time('13:00') == '1:00 PM'

    def test_none_returns_none(self):
        assert _format_time(None) is None

    def test_empty_returns_empty(self):
        assert _format_time('') == ''

    def test_invalid_returns_original(self):
        assert _format_time('not-a-time') == 'not-a-time'


# ---------------------------------------------------------------------------
# _format_date
# ---------------------------------------------------------------------------

class TestFormatDate:
    def test_standard(self):
        assert _format_date('2026-03-06') == 'Mar 6, 2026'

    def test_january(self):
        assert _format_date('2026-01-15') == 'Jan 15, 2026'

    def test_december(self):
        assert _format_date('2025-12-25') == 'Dec 25, 2025'

    def test_trailing_time_ignored(self):
        assert _format_date('2026-03-06 12:00:00') == 'Mar 6, 2026'

    def test_none_returns_none(self):
        assert _format_date(None) is None

    def test_empty_returns_empty(self):
        assert _format_date('') == ''

    def test_invalid_returns_string(self):
        assert _format_date('not-a-date') == 'not-a-date'


# ---------------------------------------------------------------------------
# strip_db_context
# ---------------------------------------------------------------------------

class TestStripDbContext:
    def test_removes_context(self):
        msg = 'Some error\nCONTEXT: PL/pgSQL function trigger'
        assert strip_db_context(msg) == 'Some error'

    def test_no_context_unchanged(self):
        assert strip_db_context('Just an error') == 'Just an error'

    def test_preserves_other_newlines(self):
        msg = 'Line1\nLine2\nCONTEXT: stuff'
        assert strip_db_context(msg) == 'Line1\nLine2'

    def test_none(self):
        assert strip_db_context(None) is None

    def test_empty(self):
        assert strip_db_context('') == ''


# ---------------------------------------------------------------------------
# parse_db_error
# ---------------------------------------------------------------------------

class TestParseDbError:
    def test_member_session_with_times(self):
        msg = (
            'You already have a session on 2026-03-02 '
            'from 08:00:00 to 09:00:00. Cancel first.'
        )
        code, params = parse_db_error(msg)
        assert code == BOOK_002
        assert params['date'] == 'Mar 2, 2026'
        assert params['start_time'] == '8:00 AM'
        assert params['end_time'] == '9:00 AM'

    def test_member_overlap_old_format(self):
        msg = 'Member already has an overlapping session on 2026-05-10'
        code, params = parse_db_error(msg)
        assert code == BOOK_001
        assert params['date'] == 'May 10, 2026'

    def test_room_already_booked(self):
        msg = 'Room Studio A is already booked for a class on 2026-04-01'
        code, params = parse_db_error(msg)
        assert code == BOOK_003
        assert params['date'] == 'Apr 1, 2026'

    def test_trainer_already_booked(self):
        msg = 'Trainer Jane is already booked for a session on 2026-06-15'
        code, params = parse_db_error(msg)
        assert code == BOOK_005
        assert params['date'] == 'Jun 15, 2026'

    def test_availability_overlap(self):
        code, params = parse_db_error('overlapping availability found')
        assert code == BOOK_006
        assert params == {}

    def test_overlapping_slot(self):
        code, params = parse_db_error('overlapping slot detected')
        assert code == BOOK_006

    def test_unknown_returns_none(self):
        assert parse_db_error('some random error') is None

    def test_none_input(self):
        assert parse_db_error(None) is None

    def test_context_stripped_before_matching(self):
        msg = (
            'You already have a session on 2026-03-02 '
            'from 08:00:00 to 09:00:00.\nCONTEXT: pg_trigger'
        )
        code, _ = parse_db_error(msg)
        assert code == BOOK_002


# ---------------------------------------------------------------------------
# get_message
# ---------------------------------------------------------------------------

class TestGetMessage:
    def test_simple_code(self):
        assert get_message(AUTH_001) == 'Authentication required.'

    def test_template_with_params(self):
        assert get_message(VAL_006, fields='Name, Email') == 'Name, Email are required.'

    def test_booking_template(self):
        msg = get_message(
            BOOK_002,
            date='Mar 2, 2026',
            start_time='8:00 AM',
            end_time='9:00 AM',
        )
        assert 'Mar 2, 2026' in msg
        assert '8:00 AM' in msg
        assert '9:00 AM' in msg

    def test_unknown_code_returns_string(self):
        assert get_message('UNKNOWN_CODE') == 'UNKNOWN_CODE'

    def test_missing_params_returns_template(self):
        msg = get_message(VAL_006)
        assert '{fields}' in msg


# ---------------------------------------------------------------------------
# make_error
# ---------------------------------------------------------------------------

class TestMakeError:
    def test_returns_tuple_of_dict_and_int(self):
        body, status = make_error(AUTH_001)
        assert isinstance(body, dict)
        assert isinstance(status, int)

    def test_body_has_error_and_code(self):
        body, _ = make_error(AUTH_004)
        assert 'error' in body
        assert 'error_code' in body
        assert body['error_code'] == AUTH_004

    def test_default_http_status(self):
        _, status = make_error(AUTH_001)
        assert status == 401

    def test_override_http_status(self):
        _, status = make_error(AUTH_001, http_status=500)
        assert status == 500

    def test_with_params_in_body(self):
        body, status = make_error(
            BOOK_002, date='Mar 2, 2026', start_time='8:00 AM', end_time='9:00 AM'
        )
        assert 'Mar 2, 2026' in body['error']
        assert status == 409

    def test_all_codes_have_mapped_status(self):
        for code, expected_status in CODE_HTTP_STATUS.items():
            _, status = make_error(code)
            assert status == expected_status

    def test_unknown_code_defaults_to_400(self):
        _, status = make_error('UNKNOWN')
        assert status == 400
