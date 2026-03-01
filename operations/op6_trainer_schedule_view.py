"""Op 6: Trainer Schedule View - future sessions and classes."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Trainer schedule view")
    parser.add_argument("--trainer_id", type=int, required=True, help="Trainer ID")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM trainer WHERE trainer_id = %s", (args.trainer_id,))
        if not cur.fetchone():
            print("Error: Trainer not found.", file=sys.stderr)
            return 1

        print(f"=== Schedule for Trainer {args.trainer_id} (future only) ===\n")

        cur.execute(
            """SELECT ps.session_date, ps.start_time, ps.end_time, m.name AS member_name, r.room_name
               FROM personal_session ps
               JOIN member m ON m.member_id = ps.member_id
               JOIN room r ON r.room_id = ps.room_id
               WHERE ps.trainer_id = %s AND ps.status = 'scheduled' AND ps.session_date >= CURRENT_DATE
               ORDER BY ps.session_date, ps.start_time""",
            (args.trainer_id,),
        )
        sessions = cur.fetchall()
        print("Personal training sessions:")
        if sessions:
            for s in sessions:
                st = s["start_time"].strftime("%H:%M") if s["start_time"] else ""
                et = s["end_time"].strftime("%H:%M") if s["end_time"] else ""
                print(f"  {s['session_date']} {st}-{et}  {s['member_name']}  {s['room_name']}")
        else:
            print("  None")

        cur.execute(
            """SELECT gc.class_date, gc.start_time, gc.end_time, gc.class_name, r.room_name
               FROM group_class gc
               JOIN room r ON r.room_id = gc.room_id
               WHERE gc.trainer_id = %s AND gc.class_date >= CURRENT_DATE
               ORDER BY gc.class_date, gc.start_time""",
            (args.trainer_id,),
        )
        classes = cur.fetchall()
        print("\nGroup fitness classes:")
        if classes:
            for c in classes:
                st = c["start_time"].strftime("%H:%M") if c["start_time"] else ""
                et = c["end_time"].strftime("%H:%M") if c["end_time"] else ""
                print(f"  {c['class_date']} {st}-{et}  {c['class_name']}  {c['room_name']}")
        else:
            print("  None")

        if not sessions and not classes:
            print("\nNo upcoming schedule.")
        return 0
    except psycopg2.Error as e:
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
