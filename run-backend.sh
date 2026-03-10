#!/usr/bin/env bash
# ============================================================
# Run backend only (Flask API)
# ============================================================
# Usage:  ./run-backend.sh
#   --skip-db   Skip database reset (just start the app)
# Run this in one terminal; run ./run-frontend.sh in another.
# Each run drops and recreates the database from scratch
# so you always start with fresh schema + seed data.
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

SKIP_DB=false
for arg in "$@"; do
    case $arg in
        --skip-db) SKIP_DB=true ;;
    esac
done

# Env (match start.sh)
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-fitness_club}"
export DB_USER="${DB_USER:-$(whoami)}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export FLASK_APP=backend.run
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

# ── Fresh database setup ──────────────────────────────────────
if [ "$SKIP_DB" = false ]; then
    PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER"
    [ -n "$DB_PASSWORD" ] && export PGPASSWORD="$DB_PASSWORD"

    echo "[DB] Dropping existing database '$DB_NAME'..."
    $PSQL -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres 2>/dev/null || true

    echo "[DB] Creating database '$DB_NAME'..."
    $PSQL -c "CREATE DATABASE $DB_NAME;" postgres

    echo "[DB] Running DDL.sql (schema, views, triggers)..."
    $PSQL -d "$DB_NAME" -f "$PROJECT_DIR/sql/DDL.sql" -q

    echo "[DB] Running DML.sql (seed data)..."
    $PSQL -d "$DB_NAME" -f "$PROJECT_DIR/sql/DML.sql" -q

    echo "[DB] Running RBAC.sql (roles, grants, RLS)..."
    $PSQL -d "$DB_NAME" -f "$PROJECT_DIR/sql/RBAC.sql" -q

    echo "[DB] Fresh database ready."
    echo ""
fi

echo "Starting backend at http://localhost:${FLASK_PORT:-5001} ..."
python -m backend.run
