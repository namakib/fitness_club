"""Op 4: Member Dashboard - latest metrics, active goals, classes attended, upcoming sessions."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Member dashboard")
    parser.add_argument("--member_id", type=int, required=True, help="Member ID")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM member WHERE member_id = %s", (args.member_id,))
        if not cur.fetchone():
            print("Error: Member does not exist.", file=sys.stderr)
            return 1

        print(f"=== Dashboard for Member {args.member_id} ===\n")

        cur.execute(
            """SELECT weight, body_fat_pct, blood_pressure, heart_rate, recorded_at
               FROM health_metric WHERE member_id = %s ORDER BY recorded_at DESC LIMIT 1""",
            (args.member_id,),
        )
        m = cur.fetchone()
        print("Latest health metrics:")
        if m:
            ts = m["recorded_at"].strftime("%Y-%m-%d %H:%M") if m["recorded_at"] else ""
            w = m["weight"] if m["weight"] is not None else "-"
            bf = m["body_fat_pct"] if m["body_fat_pct"] is not None else "-"
            bp = m["blood_pressure"] or "-"
            hr = m["heart_rate"] if m["heart_rate"] is not None else "-"
            print(f"  weight={w}  body_fat%={bf}  bp={bp}  hr={hr}  ({ts})")
        else:
            print("  No records")

        cur.execute(
            """SELECT goal_type, target_value, start_date, end_date
               FROM fitness_goal WHERE member_id = %s AND status = 'active' ORDER BY start_date""",
            (args.member_id,),
        )
        goals = cur.fetchall()
        print("\nActive fitness goals:")
        if goals:
            for g in goals:
                print(f"  - {g['goal_type']}: {g['target_value']} ({g['start_date']} to {g['end_date'] or 'ongoing'})")
        else:
            print("  None")

        cur.execute(
            """SELECT COUNT(*) AS total FROM class_enrollment ce
               JOIN group_class gc ON gc.class_id = ce.class_id
               WHERE ce.member_id = %s AND gc.class_date < CURRENT_DATE""",
            (args.member_id,),
        )
        total = cur.fetchone()["total"]
        print(f"\nTotal group classes attended: {total}")

        cur.execute(
            """SELECT ps.session_date, ps.start_time, ps.end_time, t.name AS trainer_name, r.room_name
               FROM personal_session ps
               JOIN trainer t ON t.trainer_id = ps.trainer_id
               JOIN room r ON r.room_id = ps.room_id
               WHERE ps.member_id = %s AND ps.status = 'scheduled' AND ps.session_date >= CURRENT_DATE
               ORDER BY ps.session_date, ps.start_time""",
            (args.member_id,),
        )
        sessions = cur.fetchall()
        print("\nUpcoming personal sessions:")
        if sessions:
            for s in sessions:
                st = s["start_time"].strftime("%H:%M") if s["start_time"] else ""
                et = s["end_time"].strftime("%H:%M") if s["end_time"] else ""
                print(f"  {s['session_date']} {st}-{et}  {s['trainer_name']}  {s['room_name']}")
        else:
            print("  None")
        return 0
    except psycopg2.Error as e:
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
