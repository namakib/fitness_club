"""Op 3: Health History - SELECT all health metrics for member, ORDER BY timestamp."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Health history (member)")
    parser.add_argument("--member_id", type=int, required=True, help="Member ID")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM member WHERE member_id = %s", (args.member_id,))
        if not cur.fetchone():
            print("Error: Member does not exist.", file=sys.stderr)
            return 1

        cur.execute(
            """SELECT metric_id, weight, body_fat_pct, blood_pressure, heart_rate, recorded_at
               FROM health_metric WHERE member_id = %s ORDER BY recorded_at ASC""",
            (args.member_id,),
        )
        rows = cur.fetchall()
        if not rows:
            print("No health records found for member", args.member_id)
            return 0

        print(f"Health history for member {args.member_id} ({len(rows)} records):")
        print("-" * 70)
        for r in rows:
            ts = r["recorded_at"].strftime("%Y-%m-%d %H:%M") if r["recorded_at"] else ""
            w = r["weight"] if r["weight"] is not None else "-"
            bf = r["body_fat_pct"] if r["body_fat_pct"] is not None else "-"
            bp = r["blood_pressure"] or "-"
            hr = r["heart_rate"] if r["heart_rate"] is not None else "-"
            print(f"  {ts}  weight={w}  body_fat%={bf}  bp={bp}  hr={hr}")
        return 0
    except psycopg2.Error as e:
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
