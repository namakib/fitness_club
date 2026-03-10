"""Op 2: Profile Management - UPDATE member, INSERT goal, INSERT health metric."""
import argparse
import datetime
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2


def run():
    parser = argparse.ArgumentParser(description="Profile management (member)")
    parser.add_argument("--member_id", type=int, required=True, help="Member ID")
    parser.add_argument("--name", help="Update name")
    parser.add_argument("--phone", help="Update phone")
    parser.add_argument("--goal_type", help="Add fitness goal type")
    parser.add_argument("--target_value", help="Add fitness goal target")
    parser.add_argument("--start_date", help="Goal start date (YYYY-MM-DD)")
    parser.add_argument("--end_date", help="Goal end date (YYYY-MM-DD)")
    parser.add_argument("--weight", type=float, help="Add health metric: weight")
    parser.add_argument("--body_fat", type=float, help="Add health metric: body_fat_pct")
    parser.add_argument("--blood_pressure", help="Add health metric: blood_pressure")
    parser.add_argument("--heart_rate", type=int, help="Add health metric: heart_rate")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM member WHERE member_id = %s", (args.member_id,))
        if not cur.fetchone():
            print("Error: Member does not exist.", file=sys.stderr)
            return 1

        outputs = []

        if args.name is not None or args.phone is not None:
            name_val = args.name.strip() if args.name is not None else None
            phone_val = (args.phone.strip() or None) if args.phone is not None else None
            cur.execute(
                """UPDATE member SET name = COALESCE(%s, name), phone = COALESCE(%s, phone)
                   WHERE member_id = %s""",
                (name_val, phone_val, args.member_id),
            )
            if cur.rowcount == 0:
                print("Error: Member not found or unauthorized.", file=sys.stderr)
                return 1
            outputs.append("Profile updated.")

        if args.goal_type and args.target_value:
            start = args.start_date or datetime.date.today().isoformat()
            cur.execute(
                """INSERT INTO fitness_goal (member_id, goal_type, target_value, start_date, end_date)
                   VALUES (%s, %s, %s, %s, %s) RETURNING goal_id""",
                (args.member_id, args.goal_type.strip(), args.target_value.strip(), start, args.end_date or None),
            )
            gid = cur.fetchone()["goal_id"]
            outputs.append(f"Goal saved. goal_id = {gid}")

        if any([args.weight is not None, args.body_fat is not None, args.blood_pressure, args.heart_rate is not None]):
            cur.execute(
                """INSERT INTO health_metric (member_id, weight, body_fat_pct, blood_pressure, heart_rate)
                   VALUES (%s, %s, %s, %s, %s) RETURNING metric_id""",
                (
                    args.member_id,
                    args.weight,
                    args.body_fat,
                    args.blood_pressure.strip() if args.blood_pressure else None,
                    args.heart_rate,
                ),
            )
            mid = cur.fetchone()["metric_id"]
            outputs.append(f"Health metric recorded. metric_id = {mid}")

        if not outputs:
            print("Error: Provide at least one of: --name, --phone, --goal_type+--target_value, or health metric args.", file=sys.stderr)
            return 1

        conn.commit()
        for o in outputs:
            print(o)
        return 0
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
