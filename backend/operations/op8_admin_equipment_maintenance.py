"""Op 8: Equipment Maintenance - create, update status, list all, filter by maintenance."""
import argparse
import sys

from .db_conn import get_connection, get_cursor, friendly_error
import psycopg2

VALID_STATUS = ("operational", "under_repair", "out_of_service")


def run():
    parser = argparse.ArgumentParser(description="Equipment maintenance (admin)")
    parser.add_argument("--admin_id", type=int, required=True, help="Admin ID (context)")
    parser.add_argument("--action", required=True, choices=["create", "update_status", "log_issue", "list_all", "filter_maintenance"], help="Action")
    parser.add_argument("--equipment_name", help="Equipment name (for create)")
    parser.add_argument("--type", dest="equip_type", help="Equipment type (for create)")
    parser.add_argument("--room_id", type=int, help="Room ID (for create)")
    parser.add_argument("--equipment_id", type=int, help="Equipment ID (for update_status)")
    parser.add_argument("--status", help="Status: operational, under_repair, out_of_service")
    parser.add_argument("--issue", help="Issue description (for create or log_issue)")
    args = parser.parse_args()

    conn = get_connection()
    try:
        cur = get_cursor(conn)
        cur.execute("SELECT 1 FROM admin WHERE admin_id = %s", (args.admin_id,))
        if not cur.fetchone():
            print("Error: Admin not found.", file=sys.stderr)
            return 1

        if args.action == "create":
            if not all([args.equipment_name, args.equip_type, args.room_id]):
                print("Error: --equipment_name, --type, --room_id required for create.", file=sys.stderr)
                return 1
            cur.execute(
                """INSERT INTO equipment (name, type, room_id) VALUES (%s, %s, %s) RETURNING equipment_id""",
                (args.equipment_name.strip(), args.equip_type.strip(), args.room_id),
            )
            eid = cur.fetchone()["equipment_id"]
            if args.issue:
                cur.execute(
                    """INSERT INTO equipment_maintenance (equipment_id, issue_description) VALUES (%s, %s)""",
                    (eid, args.issue.strip()),
                )
            conn.commit()
            print(f"Equipment created. equipment_id = {eid}")
        elif args.action == "update_status":
            if not all([args.equipment_id, args.status]):
                print("Error: --equipment_id and --status required for update_status.", file=sys.stderr)
                return 1
            if args.status not in VALID_STATUS:
                print(f"Error: Invalid status. Must be one of: {', '.join(VALID_STATUS)}", file=sys.stderr)
                return 1
            cur.execute(
                "UPDATE equipment SET status = %s WHERE equipment_id = %s",
                (args.status, args.equipment_id),
            )
            if cur.rowcount == 0:
                print("Error: Equipment not found.", file=sys.stderr)
                return 1
            conn.commit()
            print(f"Status updated to '{args.status}'.")
        elif args.action == "log_issue":
            if not all([args.equipment_id, args.issue]):
                print("Error: --equipment_id and --issue required for log_issue.", file=sys.stderr)
                return 1
            cur.execute(
                "SELECT 1 FROM equipment WHERE equipment_id = %s", (args.equipment_id,)
            )
            if not cur.fetchone():
                print("Error: Equipment not found.", file=sys.stderr)
                return 1
            cur.execute(
                """INSERT INTO equipment_maintenance (equipment_id, issue_description) VALUES (%s, %s) RETURNING log_id""",
                (args.equipment_id, args.issue.strip()),
            )
            log_id = cur.fetchone()["log_id"]
            conn.commit()
            print(f"Maintenance issue logged. log_id = {log_id}")
        elif args.action == "list_all":
            cur.execute(
                """SELECT e.equipment_id, e.name, e.type, e.status, r.room_name
                   FROM equipment e JOIN room r ON r.room_id = e.room_id ORDER BY e.name"""
            )
            rows = cur.fetchall()
            print("All equipment:")
            for r in rows:
                print(f"  {r['equipment_id']}: {r['name']} ({r['type']}) - {r['status']} - {r['room_name']}")
        else:
            cur.execute(
                """SELECT e.equipment_id, e.name, e.status, r.room_name, em.issue_description, em.reported_date, em.status AS issue_status
                   FROM equipment e
                   JOIN room r ON r.room_id = e.room_id
                   LEFT JOIN equipment_maintenance em ON em.equipment_id = e.equipment_id AND em.status IN ('reported','in_progress')
                   WHERE e.status != 'operational' OR em.log_id IS NOT NULL
                   ORDER BY e.name, em.reported_date DESC"""
            )
            rows = cur.fetchall()
            print("Equipment requiring maintenance:")
            seen = set()
            for r in rows:
                key = r["equipment_id"]
                if key in seen:
                    continue
                seen.add(key)
                issue = f" - {r['issue_description']} ({r['issue_status']})" if r["issue_description"] else ""
                print(f"  {r['equipment_id']}: {r['name']} - {r['status']} - {r['room_name']}{issue}")
            if not seen:
                print("  None")
        return 0
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {friendly_error(e)}", file=sys.stderr)
        return 1
    finally:
        conn.close()
