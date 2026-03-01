#!/usr/bin/env bash
# ============================================================
# Run frontend only (Vite dev server)
# ============================================================
# Usage:  ./run-frontend.sh
# Run this in one terminal; run ./run-backend.sh in another.
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VITE_PORT="${VITE_PORT:-5173}"
# API debug log: 1=on, 0=off (or use localStorage.debugApi in browser console)
export VITE_DEBUG_API="${VITE_DEBUG_API:-1}"

cd "$PROJECT_DIR/frontend"
echo "Starting frontend at http://localhost:$VITE_PORT ..."
npx vite --port "$VITE_PORT"
