#!/usr/bin/env bash
# Test Op 8: Equipment Maintenance
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 8: Equipment Maintenance ==="
echo "--- SUCCESS: List all equipment ---"
python run_operation.py 8 --admin_id 1 --action list_all
echo ""
echo "--- FAILURE: Invalid status ---"
python run_operation.py 8 --admin_id 1 --action update_status --equipment_id 1 --status broken || true
