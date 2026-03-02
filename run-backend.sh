#!/usr/bin/env bash
# ============================================================
# Run backend only (Flask API)
# ============================================================
# Usage:  ./run-backend.sh
# Run this in one terminal; run ./run-frontend.sh in another.
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Env (match start.sh)
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-fitness_club}"
export DB_USER="${DB_USER:-$(whoami)}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export FLASK_APP=run.py
export FLASK_ENV=development
export SECRET_KEY="${SECRET_KEY:-dev-secret-key}"
export DEBUG_API="${DEBUG_API:-1}"

# Activate venv if present
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Add PostgreSQL bin to PATH (Homebrew installs may not be in default PATH)
for dir in /opt/homebrew/opt/postgresql@*/bin /opt/homebrew/opt/postgresql/bin /usr/local/opt/postgresql@*/bin /usr/local/opt/postgresql/bin; do
    if [ -d "$dir" ] 2>/dev/null; then
        export PATH="$dir:$PATH"
        break
    fi
done

echo "Starting backend at http://localhost:${FLASK_PORT:-5001} ..."
python run.py
