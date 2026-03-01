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

# Run migrations (keeps DB schema/backfills in sync when using run-backend.sh without start.sh)
if ! command -v psql &>/dev/null; then
    echo "Migrations skipped (psql not found)"
else
    [ -n "$DB_PASSWORD" ] && export PGPASSWORD="$DB_PASSWORD"

    # Check migration status (verify if applied)
    check_migration() {
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$1" 2>/dev/null | grep -q 't'
    }
    echo "Migration status:"
    if check_migration "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='equipment' AND column_name='room_id')"; then
        echo "  001 (equipment.room_id): applied"
    else
        echo "  001 (equipment.room_id): not applied"
    fi
    if check_migration "SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='fn_trainer_slot_booking_status')"; then
        echo "  002 (fn_trainer_slot_booking_status): applied"
    else
        echo "  002 (fn_trainer_slot_booking_status): not applied"
    fi
    if check_migration "SELECT EXISTS (SELECT 1 FROM trainer_availability WHERE trainer_id=1 AND available_date='2026-03-02' AND start_time='14:00' AND end_time='18:00')"; then
        echo "  003 (trainer availability backfill): applied"
    else
        echo "  003 (trainer availability backfill): not applied"
    fi

    # Apply migrations
    migrated=0
    for m in "$PROJECT_DIR/sql/migrations/"*.sql; do
        if [ -f "$m" ]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$m" -q 2>/dev/null && migrated=1
        fi
    done
    unset PGPASSWORD 2>/dev/null || true
    if [ "$migrated" = 1 ]; then
        echo "Migrations applied"
    else
        echo "Migrations skipped (database unavailable or no migrations)"
    fi
fi

echo "Starting backend at http://localhost:${FLASK_PORT:-5001} ..."
python run.py
