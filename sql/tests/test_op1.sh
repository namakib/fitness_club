#!/usr/bin/env bash
# Test Op 1: Member Registration
set -e
cd "$(dirname "$0")/../.."
echo "=== Op 1: Member Registration ==="
echo "--- SUCCESS: Register new member ---"
python run_operation.py 1 --name "Test User" --email "testuser_$$@example.com" \
  --dob 2000-01-15 --gender male --phone "555-9999" --password test123
echo ""
echo "--- FAILURE: Duplicate email ---"
python run_operation.py 1 --name "Test User" --email "alice@example.com" \
  --dob 2000-01-15 --gender female --phone "555-0000" --password test123 || true
