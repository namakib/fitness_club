"""
Central error codes and message templates for API responses.
Error codes use category prefix + number (e.g. AUTH_001, BOOK_003).
Use error_code for client-side handling/i18n; use error for display message.
"""
import re
from datetime import datetime

# ---------------------------------------------------------------------------
# Error codes (category prefix + sequential number)
# ---------------------------------------------------------------------------

# AUTH -- Authentication / Authorization
AUTH_001 = 'AUTH_001'  # Authentication required
AUTH_002 = 'AUTH_002'  # Permission denied
AUTH_003 = 'AUTH_003'  # Invalid role selected
AUTH_004 = 'AUTH_004'  # Invalid email or password
AUTH_005 = 'AUTH_005'  # Duplicate email
AUTH_006 = 'AUTH_006'  # Registration failed

# VAL -- Validation
VAL_001 = 'VAL_001'  # Name required
VAL_002 = 'VAL_002'  # Email required
VAL_003 = 'VAL_003'  # DOB required
VAL_004 = 'VAL_004'  # Password required
VAL_005 = 'VAL_005'  # Password too short
VAL_006 = 'VAL_006'  # Required fields (template: {fields})
VAL_007 = 'VAL_007'  # End time after start time
VAL_008 = 'VAL_008'  # Issue description required
VAL_009 = 'VAL_009'  # Only cancellation allowed

# BOOK -- Booking / Scheduling
BOOK_001 = 'BOOK_001'  # Member overlapping session (date only)
BOOK_002 = 'BOOK_002'  # Member overlapping session (with time)
BOOK_003 = 'BOOK_003'  # Room already booked
BOOK_004 = 'BOOK_004'  # Trainer not available
BOOK_005 = 'BOOK_005'  # Trainer already booked
BOOK_006 = 'BOOK_006'  # Availability slot overlap

# CLASS -- Class enrollment
CLASS_001 = 'CLASS_001'  # Already enrolled
CLASS_002 = 'CLASS_002'  # Class full
CLASS_003 = 'CLASS_003'  # Class has passed

# RES -- Resource not found
RES_001 = 'RES_001'  # Session not found
RES_002 = 'RES_002'  # Class not found
RES_003 = 'RES_003'  # Enrollment not found

# ERR -- Generic / Internal
ERR_001 = 'ERR_001'  # Something went wrong
ERR_002 = 'ERR_002'  # Profile update failed

# ---------------------------------------------------------------------------
# Message templates (placeholders: {date}, {start_time}, {end_time}, {fields})
# ---------------------------------------------------------------------------
ERROR_MESSAGES = {
    AUTH_001: 'Authentication required.',
    AUTH_002: 'Permission denied.',
    AUTH_003: 'Invalid role selected.',
    AUTH_004: 'Invalid email or password.',
    AUTH_005: 'An account with this email already exists.',
    AUTH_006: 'Registration failed. Please try again.',
    VAL_001: 'Name is required.',
    VAL_002: 'Email is required.',
    VAL_003: 'Date of birth is required.',
    VAL_004: 'Password is required.',
    VAL_005: 'Password must be at least 6 characters.',
    VAL_006: '{fields} are required.',
    VAL_007: 'End time must be after start time.',
    VAL_008: 'Issue description is required.',
    VAL_009: 'Only cancellation is allowed.',
    BOOK_001: (
        'You already have a session on {date}. '
        'Please choose a different time or cancel that session first.'
    ),
    BOOK_002: (
        'You already have a session on {date} from {start_time} to {end_time}. '
        'Please choose a different time or cancel that session first.'
    ),
    BOOK_003: (
        'This room is already booked for an overlapping time on {date}. '
        'Please choose a different room or time.'
    ),
    BOOK_004: (
        'The trainer is not available at the selected time. '
        'Please choose a slot from their availability.'
    ),
    BOOK_005: (
        'The trainer is already booked for an overlapping session on {date}. '
        'Please choose a different time.'
    ),
    BOOK_006: 'This time slot overlaps with an existing availability slot.',
    CLASS_001: 'You are already enrolled in this class.',
    CLASS_002: 'This class is full. No spots available.',
    CLASS_003: 'This class has already passed. Enrollment is closed.',
    RES_001: 'Session not found.',
    RES_002: 'Class not found.',
    RES_003: 'Enrollment not found.',
    ERR_001: 'Something went wrong. Please try again.',
    ERR_002: 'Failed to update profile. Please try again.',
}

# Default HTTP status per error code (used when make_error is called without status)
CODE_HTTP_STATUS = {
    AUTH_001: 401,
    AUTH_002: 403,
    AUTH_003: 400,
    AUTH_004: 401,
    AUTH_005: 409,
    AUTH_006: 500,
    VAL_001: 400,
    VAL_002: 400,
    VAL_003: 400,
    VAL_004: 400,
    VAL_005: 400,
    VAL_006: 400,
    VAL_007: 400,
    VAL_008: 400,
    VAL_009: 400,
    BOOK_001: 409,
    BOOK_002: 409,
    BOOK_003: 409,
    BOOK_004: 409,
    BOOK_005: 409,
    BOOK_006: 409,
    CLASS_001: 409,
    CLASS_002: 409,
    CLASS_003: 400,
    RES_001: 404,
    RES_002: 404,
    RES_003: 404,
    ERR_001: 500,
    ERR_002: 500,
}


# ---------------------------------------------------------------------------
# Format helpers (for DB message parsing and message templates)
# ---------------------------------------------------------------------------

def _format_time(tstr):
    """Format time string (e.g. 08:00:00 or 08:00) to 8:00 AM."""
    if not tstr:
        return tstr
    tstr = str(tstr).strip()
    parts = tstr.split(':')
    try:
        h = int(parts[0]) if parts else 0
        m = int(parts[1]) if len(parts) > 1 else 0
        if h == 0:
            return f'12:{m:02d} AM'
        if h < 12:
            return f'{h}:{m:02d} AM'
        if h == 12:
            return f'12:{m:02d} PM'
        return f'{h - 12}:{m:02d} PM'
    except (ValueError, IndexError):
        return tstr


def _format_date(dstr):
    """Format date string (YYYY-MM-DD) to Mon D, YYYY."""
    if not dstr:
        return dstr
    try:
        d = datetime.strptime(str(dstr).strip()[:10], '%Y-%m-%d')
        return f'{d.strftime("%b")} {d.day}, {d.year}'
    except ValueError:
        return str(dstr)


def strip_db_context(msg):
    """Remove PostgreSQL CONTEXT line from exception message."""
    if not msg:
        return msg
    idx = msg.find('\nCONTEXT:')
    if idx != -1:
        msg = msg[:idx]
    return msg.strip()


# ---------------------------------------------------------------------------
# DB exception parser (maps trigger/constraint messages to error_code + params)
# ---------------------------------------------------------------------------

def parse_db_error(db_message):
    """
    Parse DB trigger/constraint message and return (error_code, params) for make_error.
    Returns None if not a known booking/scheduling error.
    """
    msg = strip_db_context(db_message or '')
    # New format: "You already have a session on 2026-03-02 from 08:00:00 to 09:00:00. ..."
    m = re.search(
        r'You already have a session on (\d{4}-\d{2}-\d{2}) from (\S+) to (\S+)\.',
        msg, re.IGNORECASE
    )
    if m:
        return (BOOK_002, {
            'date': _format_date(m.group(1)),
            'start_time': _format_time(m.group(2)),
            'end_time': _format_time(m.group(3)),
        })
    # Old format: "Member already has an overlapping session on 2026-03-02"
    m = re.search(
        r'Member already has an overlapping session on (\d{4}-\d{2}-\d{2})',
        msg, re.IGNORECASE
    )
    if m:
        return (BOOK_001, {'date': _format_date(m.group(1))})
    # Room already booked
    m = re.search(
        r'Room .+ is already booked .+ on (\d{4}-\d{2}-\d{2})',
        msg, re.IGNORECASE
    )
    if m:
        return (BOOK_003, {'date': _format_date(m.group(1))})
    # Trainer already booked (session or class)
    m = re.search(
        r'Trainer .+ is already booked .+ on (\d{4}-\d{2}-\d{2})',
        msg, re.IGNORECASE
    )
    if m:
        return (BOOK_005, {'date': _format_date(m.group(1))})
    # Trainer availability overlap
    if 'overlapping availability' in msg.lower() or 'overlapping slot' in msg.lower():
        return (BOOK_006, {})
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_message(error_code, **params):
    """
    Return the formatted message for an error code.
    Params fill placeholders in the template (e.g. date, start_time, end_time, fields).
    """
    template = ERROR_MESSAGES.get(error_code)
    if not template:
        return str(error_code)
    try:
        return template.format(**params)
    except KeyError:
        return template


def make_error(error_code, http_status=None, **params):
    """
    Build (body_dict, http_status) for API error responses.
    body_dict has "error" and "error_code". If http_status is omitted, use CODE_HTTP_STATUS.
    Usage: return jsonify(body), status  where body, status = make_error(CODE, 409) or make_error(CODE, 409, date=...)
    """
    if http_status is None:
        http_status = CODE_HTTP_STATUS.get(error_code, 400)
    message = get_message(error_code, **params)
    body = {
        'error': message,
        'error_code': error_code,
    }
    return (body, http_status)
