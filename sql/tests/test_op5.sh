#!/usr/bin/env bash
# Test Op 5: Trainer Set Availability
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 5: Trainer Set Availability ==="
echo "--- SUCCESS: Create new slot ---"
python run_operation.py 5 --trainer_id 1 --action create --date 2026-04-15 --start_time 09:00 --end_time 12:00
echo ""
echo "--- FAILURE: Overlapping slot (trainer 1 has 08:00-12:00 on 2026-02-23) ---"
python run_operation.py 5 --trainer_id 1 --action create --date 2026-02-23 --start_time 11:00 --end_time 14:00 || true
