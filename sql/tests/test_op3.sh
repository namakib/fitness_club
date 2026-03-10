#!/usr/bin/env bash
# Test Op 3: Health History
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 3: Health History ==="
echo "--- SUCCESS: Member 1 has health records ---"
python -m backend.run_operation 3 --member_id 1
echo ""
echo "--- FAILURE: Invalid member_id ---"
python -m backend.run_operation 3 --member_id 99999 || true
