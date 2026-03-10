"""Standalone DB connection helper for operations (no Flask dependency)."""
import getpass
import os

import psycopg2
import psycopg2.extras
import psycopg2.errors


def get_config():
    """Read DB config from env, matching backend/config.py defaults."""
    return {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': os.environ.get('DB_PORT', '5432'),
        'dbname': os.environ.get('DB_NAME', 'fitness_club'),
        'user': os.environ.get('DB_USER', getpass.getuser()),
        'password': os.environ.get('DB_PASSWORD', ''),
    }


def get_connection():
    """Return a psycopg2 connection with RealDictCursor factory."""
    config = get_config()
    conn = psycopg2.connect(**config)
    return conn


def get_cursor(conn):
    """Return a RealDictCursor for the connection."""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def friendly_error(exc):
    """Convert psycopg2 exceptions to user-friendly messages."""
    if exc is None:
        return "An unexpected error occurred."
    msg = str(exc).lower()
    if isinstance(exc, psycopg2.errors.UniqueViolation):
        if 'member_email' in msg or 'email' in msg:
            return "Email already registered."
        if 'class_id' in msg and 'member_id' in msg:
            return "Already enrolled in this class."
        return "Duplicate value violates unique constraint."
    if isinstance(exc, psycopg2.errors.RaiseException):
        if 'already booked' in msg or ('room' in msg and 'booked' in msg):
            return "Room is already booked for an overlapping time slot."
        if 'overlapping' in msg or 'overlap' in msg:
            return "Trainer already has an overlapping availability slot."
        if 'not available' in msg:
            return "Trainer is not available at this time."
        if 'full' in msg:
            return "Class is full."
        if 'immutable' in msg:
            return "Health metric records cannot be updated or deleted."
        return str(exc)
    if isinstance(exc, psycopg2.errors.CheckViolation):
        if 'end_time' in msg and 'start_time' in msg:
            return "End time must be after start time."
        if 'status' in msg or 'gender' in msg:
            return "Invalid value. Check allowed values for the field."
        return "Validation failed: " + str(exc)
    if isinstance(exc, psycopg2.errors.ForeignKeyViolation):
        if 'room' in msg:
            return "Room not found."
        if 'member' in msg:
            return "Member does not exist."
        if 'trainer' in msg:
            return "Trainer not found."
        if 'equipment' in msg:
            return "Equipment not found."
        return "Referenced record not found."
    if isinstance(exc, psycopg2.errors.NotNullViolation):
        return "Required field is missing."
    return str(exc)
