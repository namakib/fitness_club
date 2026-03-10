"""Op 5: Trainer Set Availability - create/update/delete slots, prevent overlap."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Trainer availability management")
    parser.add_argument("--trainer_id", type=int, required=True, help="Trainer ID")
    parser.add_argument("--action", required=True, choices=["create", "update", "delete"], help="Action")
    parser.add_argument("--date", help="Date (YYYY-MM-DD)")
    parser.add_argument("--start_time", help="Start time (HH:MM)")
    parser.add_argument("--end_time", help="End time (HH:MM)")
    parser.add_argument("--slot_id", type=int, help="Availability slot ID (for update/delete)")
    args = parser.parse_args()

    if args.action in ("update", "delete") and not args.slot_id:
        print("Error: --slot_id required for update/delete.", file=sys.stderr)
        return 1
    if args.action == "create" and not all([args.date, args.start_time, args.end_time]):
        print("Error: --date, --start_time, --end_time required for create.", file=sys.stderr)
        return 1
    if args.action == "update" and not all([args.date, args.start_time, args.end_time]):
        print("Error: --date, --start_time, --end_time required for update.", file=sys.stderr)
        return 1

    if args.start_time and args.end_time:
        if args.start_time >= args.end_time:
            print("Error: End time must be after start time.", file=sys.stderr)
            return 1

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM trainer WHERE trainer_id = %s", (args.trainer_id,))
        if not cur.fetchone():
            print("Error: Trainer not found.", file=sys.stderr)
            return 1

        if args.action == "create":
            cur.execute(
                """INSERT INTO trainer_availability (trainer_id, available_date, start_time, end_time)
                   VALUES (%s, %s, %s, %s) RETURNING availability_id""",
                (args.trainer_id, args.date, args.start_time, args.end_time),
            )
            aid = cur.fetchone()["availability_id"]
            conn.commit()
            print(f"Availability slot created. availability_id = {aid}")
        elif args.action == "update":
            cur.execute(
                """UPDATE trainer_availability
                   SET available_date = %s, start_time = %s, end_time = %s
                   WHERE availability_id = %s AND trainer_id = %s""",
                (args.date, args.start_time, args.end_time, args.slot_id, args.trainer_id),
            )
            if cur.rowcount == 0:
                print("Error: Slot not found or does not belong to this trainer.", file=sys.stderr)
                return 1
            conn.commit()
            print("Availability slot updated.")
        else:
            cur.execute(
                "DELETE FROM trainer_availability WHERE availability_id = %s AND trainer_id = %s",
                (args.slot_id, args.trainer_id),
            )
            if cur.rowcount == 0:
                print("Error: Slot not found or does not belong to this trainer.", file=sys.stderr)
                return 1
            conn.commit()
            print("Availability slot deleted.")
        return 0
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
