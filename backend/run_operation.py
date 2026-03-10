#!/usr/bin/env python3
"""CLI entrypoint for the 8 functional operations. Usage: python -m backend.run_operation <1-8> --args..."""
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Run one of 8 fitness club operations")
    parser.add_argument("op", type=int, choices=range(1, 9), metavar="op",
                        help="Operation number (1-8)")
    args, unknown = parser.parse_known_args()

    op = args.op
    if op == 1:
        from backend.operations.op1_member_registration import run
    elif op == 2:
        from backend.operations.op2_profile_management import run
    elif op == 3:
        from backend.operations.op3_health_history import run
    elif op == 4:
        from backend.operations.op4_member_dashboard import run
    elif op == 5:
        from backend.operations.op5_trainer_set_availability import run
    elif op == 6:
        from backend.operations.op6_trainer_schedule_view import run
    elif op == 7:
        from backend.operations.op7_admin_room_booking import run
    elif op == 8:
        from backend.operations.op8_admin_equipment_maintenance import run
    else:
        print("Error: Invalid operation number.", file=sys.stderr)
        sys.exit(1)

    sys.argv = [sys.argv[0]] + unknown
    sys.exit(run() or 0)


if __name__ == "__main__":
    main()
