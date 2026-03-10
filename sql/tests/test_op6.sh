#!/usr/bin/env bash
# Test Op 6: Trainer Schedule View
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 6: Trainer Schedule View ==="
echo "--- SUCCESS: Trainer 1 schedule ---"
python -m backend.run_operation 6 --trainer_id 1
echo ""
echo "--- FAILURE: Trainer not found ---"
python -m backend.run_operation 6 --trainer_id 99999 || true
