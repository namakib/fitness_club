"""Op 7: Admin Room Booking - assign/modify room, list available rooms."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Admin room booking")
    parser.add_argument("--admin_id", type=int, required=True, help="Admin ID (context)")
    parser.add_argument("--action", required=True, choices=["assign", "modify", "list_available"], help="Action")
    parser.add_argument("--target", choices=["session", "class"], help="Target type (session or class)")
    parser.add_argument("--target_id", type=int, help="Session or class ID")
    parser.add_argument("--room_id", type=int, help="Room ID")
    parser.add_argument("--date", help="Date (YYYY-MM-DD)")
    parser.add_argument("--start_time", help="Start time (HH:MM)")
    parser.add_argument("--end_time", help="End time (HH:MM)")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM admin WHERE admin_id = %s", (args.admin_id,))
        if not cur.fetchone():
            print("Error: Admin not found.", file=sys.stderr)
            return 1

        if args.action == "list_available":
            if not all([args.date, args.start_time, args.end_time]):
                print("Error: --date, --start_time, --end_time required for list_available.", file=sys.stderr)
                return 1
            cur.execute(
                """SELECT r.room_id, r.room_name, r.capacity FROM room r
                   WHERE r.room_id NOT IN (
                     SELECT room_id FROM personal_session
                     WHERE session_date = %s AND status != 'cancelled'
                       AND start_time < %s AND end_time > %s
                     UNION
                     SELECT room_id FROM group_class
                     WHERE class_date = %s AND start_time < %s AND end_time > %s
                   )
                   ORDER BY r.room_name""",
                (args.date, args.end_time, args.start_time, args.date, args.end_time, args.start_time),
            )
            rows = cur.fetchall()
            print(f"Available rooms for {args.date} {args.start_time}-{args.end_time}:")
            for r in rows:
                print(f"  {r['room_id']}: {r['room_name']} (capacity {r['capacity']})")
            if not rows:
                print("  None")
            return 0

        if args.action in ("assign", "modify") and not all([args.target, args.target_id, args.room_id, args.date, args.start_time, args.end_time]):
            print("Error: --target, --target_id, --room_id, --date, --start_time, --end_time required.", file=sys.stderr)
            return 1

        if args.start_time >= args.end_time:
            print("Error: End time must be after start time.", file=sys.stderr)
            return 1

        if args.target == "session":
            cur.execute(
                """UPDATE personal_session
                   SET room_id = %s, session_date = %s, start_time = %s, end_time = %s
                   WHERE session_id = %s""",
                (args.room_id, args.date, args.start_time, args.end_time, args.target_id),
            )
            if cur.rowcount == 0:
                print("Error: Session not found.", file=sys.stderr)
                return 1
            conn.commit()
            print(f"Room {args.room_id} assigned to session {args.target_id} on {args.date} {args.start_time}-{args.end_time}")
        else:
            cur.execute(
                """UPDATE group_class
                   SET room_id = %s, class_date = %s, start_time = %s, end_time = %s
                   WHERE class_id = %s""",
                (args.room_id, args.date, args.start_time, args.end_time, args.target_id),
            )
            if cur.rowcount == 0:
                print("Error: Class not found.", file=sys.stderr)
                return 1
            conn.commit()
            print(f"Room {args.room_id} assigned to class {args.target_id} on {args.date} {args.start_time}-{args.end_time}")
        return 0
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
