#!/usr/bin/env bash
# Run all 8 operation tests
set -e
cd "$(dirname "$0")/../.."
echo "=========================================="
echo " Running all 8 operation tests"
echo "=========================================="
for i in 1 2 3 4 5 6 7 8; do
    bash "sql/tests/test_op${i}.sh"
    echo ""
done
echo "=========================================="
echo " All tests completed"
echo "=========================================="
