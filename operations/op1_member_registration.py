"""Op 1: Member Registration - INSERT member, reject duplicate email."""
import argparse
import sys
from werkzeug.security import generate_password_hash

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Member registration")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--email", required=True, help="Email (unique)")
    parser.add_argument("--dob", required=True, help="Date of birth (YYYY-MM-DD)")
    parser.add_argument("--gender", default="", help="male, female, or other")
    parser.add_argument("--phone", default="", help="Phone number")
    parser.add_argument("--password", required=True, help="Password")
    args = parser.parse_args()

    if not args.name or not args.email or not args.dob or not args.password:
        print("Error: name, email, dob, and password are required.", file=sys.stderr)
        return 1

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        pw_hash = generate_password_hash(args.password, method="pbkdf2:sha256")
        cur.execute(
            """INSERT INTO member (name, email, dob, gender, phone, password_hash)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING member_id""",
            (
                args.name.strip(),
                args.email.strip().lower(),
                args.dob,
                args.gender.strip() or None,
                args.phone.strip() or None,
                pw_hash,
            ),
        )
        row = cur.fetchone()
        conn.commit()
        mid = row["member_id"]
        print(f"Member registered successfully. member_id = {mid}")
        return 0
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
