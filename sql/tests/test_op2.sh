#!/usr/bin/env bash
# Test Op 2: Profile Management
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 2: Profile Management ==="
echo "--- SUCCESS: Update profile + add goal + add metric ---"
python run_operation.py 2 --member_id 1 --name "Alice J." --goal_type endurance --target_value "5K in 27 min" \
  --start_date 2026-03-01 --weight 159.5 --heart_rate 69
echo ""
echo "--- FAILURE: Invalid member_id ---"
python run_operation.py 2 --member_id 99999 --name "Hacker" || true
