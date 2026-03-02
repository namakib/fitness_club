#!/usr/bin/env bash
# ============================================================
# Check if API data is fetched correctly
# ============================================================
# Usage:  ./check-api.sh [BASE_URL]
# Default: http://localhost:5001
# Requires: curl. Backend must be running.
# ============================================================

BASE="${1:-http://localhost:5001}"
COOKIES=$(mktemp)
FAIL=0

cleanup() { rm -f "$COOKIES"; }
trap cleanup EXIT

ok()  { echo "  OK: $1"; }
fail() { echo "  FAIL: $1"; FAIL=1; }

echo "Checking API at $BASE"
echo ""

# 1. Login as member
echo "[1] Login (alice@example.com, role=member)..."
RES=$(curl -s -w "\n%{http_code}" -c "$COOKIES" -b "$COOKIES" -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","role":"member"}')
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"user"'; then
    ok "Login succeeded"
  else
    fail "Login response missing user"
  fi
else
  fail "Login failed (HTTP $CODE). Is backend running? Is DB seeded?"
  echo "$BODY" | head -c 200
  echo ""
  exit 1
fi

# 2. /api/me
echo "[2] GET /api/me..."
RES=$(curl -s -w "\n%{http_code}" -b "$COOKIES" "$BASE/api/me")
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ] && echo "$BODY" | grep -q '"user"'; then
  ok "Me: user data present"
else
  fail "Me failed (HTTP $CODE)"
fi

# 3. /api/member/booking-options
echo "[3] GET /api/member/booking-options..."
RES=$(curl -s -w "\n%{http_code}" -b "$COOKIES" "$BASE/api/member/booking-options")
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"trainers"' && echo "$BODY" | grep -q '"rooms"'; then
    ok "Booking options: trainers and rooms present"
  else
    fail "Booking options missing trainers or rooms"
  fi
else
  fail "Booking options failed (HTTP $CODE)"
fi

# 4. /api/member/trainer-availability?trainer_id=1
echo "[4] GET /api/member/trainer-availability?trainer_id=1..."
RES=$(curl -s -w "\n%{http_code}" -b "$COOKIES" "$BASE/api/member/trainer-availability?trainer_id=1")
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"slots"'; then
    SLOT_COUNT=$(echo "$BODY" | grep -o '"availability_id"' | wc -l | tr -d ' ')
    if [ "$SLOT_COUNT" -gt 1 ]; then
      ok "Trainer availability: $SLOT_COUNT slots for Frank Miller"
    else
      fail "Trainer availability: only $SLOT_COUNT slot(s). Ensure DML has trainer_availability data."
    fi
  else
    fail "Trainer availability missing slots array"
  fi
else
  fail "Trainer availability failed (HTTP $CODE)"
fi

# 5. /api/member/available-classes
echo "[5] GET /api/member/available-classes..."
RES=$(curl -s -w "\n%{http_code}" -b "$COOKIES" "$BASE/api/member/available-classes")
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"classes"'; then
    ok "Available classes: data present"
  else
    fail "Available classes missing classes array"
  fi
else
  fail "Available classes failed (HTTP $CODE)"
fi

# 6. /api/member/dashboard
echo "[6] GET /api/member/dashboard..."
RES=$(curl -s -w "\n%{http_code}" -b "$COOKIES" "$BASE/api/member/dashboard")
BODY=$(echo "$RES" | sed '$d')
CODE=$(echo "$RES" | tail -1)
if [ "$CODE" = "200" ]; then
  ok "Dashboard: data fetched"
else
  fail "Dashboard failed (HTTP $CODE)"
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "All checks passed. Data is fetched correctly."
  exit 0
else
  echo "Some checks failed."
  exit 1
fi
