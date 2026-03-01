#!/usr/bin/env bash
# Test Op 4: Member Dashboard
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 4: Member Dashboard ==="
echo "--- SUCCESS: Member 1 dashboard ---"
python run_operation.py 4 --member_id 1
echo ""
echo "--- FAILURE: Member not found ---"
python run_operation.py 4 --member_id 99999 || true
