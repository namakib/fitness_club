#!/usr/bin/env bash
# Test Op 7: Admin Room Booking
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 7: Admin Room Booking ==="
echo "--- SUCCESS: List available rooms ---"
python run_operation.py 7 --admin_id 1 --action list_available --date 2026-06-01 --start_time 14:00 --end_time 15:00
echo ""
echo "--- FAILURE: Assign room 4 to session 17 at 08:30-09:30 (conflicts with session 16 at 08:00-09:00 in room 4) ---"
python run_operation.py 7 --admin_id 1 --action modify --target session --target_id 17 --room_id 4 \
  --date 2026-02-23 --start_time 08:30 --end_time 09:30 || true
