#!/usr/bin/env bash
# ============================================================
# Health & Fitness Club Management System — One-Click Launcher
# ============================================================
# Usage:  ./start.sh
#   --reset   Drop and recreate the database from scratch
#   --skip-db Skip database setup (just start the app)
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/venv"
DB_NAME="${DB_NAME:-fitness_club}"
DB_USER="${DB_USER:-$(whoami)}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"
FLASK_PORT="${FLASK_PORT:-5001}"
VITE_PORT="${VITE_PORT:-5173}"

RESET=false
SKIP_DB=false

for arg in "$@"; do
    case $arg in
        --reset)   RESET=true ;;
        --skip-db) SKIP_DB=true ;;
    esac
done

info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ── 1. Check / install Homebrew ───────────────────────────────
check_brew() {
    if command -v brew &>/dev/null; then
        success "Homebrew found"
    else
        info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
        success "Homebrew installed"
    fi
}

# ── 2. Check / install PostgreSQL ─────────────────────────────
check_postgres() {
    if command -v psql &>/dev/null; then
        success "PostgreSQL client found: $(psql --version)"
        return
    fi

    local pg_bin=""
    for dir in /opt/homebrew/opt/postgresql@*/bin /opt/homebrew/opt/postgresql/bin /usr/local/opt/postgresql@*/bin /usr/local/opt/postgresql/bin; do
        if [ -d "$dir" ] 2>/dev/null; then
            pg_bin="$dir"
            break
        fi
    done

    if [ -n "$pg_bin" ]; then
        export PATH="$pg_bin:$PATH"
        success "PostgreSQL found at $pg_bin"
        return
    fi

    info "PostgreSQL not found. Installing via Homebrew..."
    check_brew
    brew install postgresql@17
    brew services start postgresql@17

    local installed_bin
    installed_bin="$(brew --prefix postgresql@17)/bin"
    export PATH="$installed_bin:$PATH"

    sleep 2
    success "PostgreSQL installed and started"
}

# ── 3. Ensure PostgreSQL server is running ────────────────────
start_postgres() {
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" &>/dev/null; then
        success "PostgreSQL server is running"
        return
    fi

    info "Starting PostgreSQL server..."
    if command -v brew &>/dev/null; then
        brew services start postgresql@17 2>/dev/null || \
        brew services start postgresql 2>/dev/null || true
    fi

    for datadir in \
        /opt/homebrew/var/postgresql@17 \
        /opt/homebrew/var/postgresql \
        /opt/homebrew/var/postgres \
        /usr/local/var/postgresql@17 \
        /usr/local/var/postgres; do
        if [ -d "$datadir" ]; then
            pg_ctl -D "$datadir" start 2>/dev/null && break || true
        fi
    done

    sleep 2
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" &>/dev/null; then
        success "PostgreSQL server started"
    else
        fail "Could not start PostgreSQL. Please start it manually and re-run this script."
    fi
}

# ── 4. Set up the database ────────────────────────────────────
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        info "Skipping database setup (--skip-db)"
        return
    fi

    local psql_cmd="psql -h $DB_HOST -p $DB_PORT -U $DB_USER"
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi

    if [ "$RESET" = true ]; then
        warn "Dropping existing database '$DB_NAME'..."
        $psql_cmd -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres 2>/dev/null || true
    fi

    if $psql_cmd -lqt postgres 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        success "Database '$DB_NAME' already exists"
    else
        info "Creating database '$DB_NAME'..."
        $psql_cmd -c "CREATE DATABASE $DB_NAME;" postgres
        success "Database '$DB_NAME' created"
    fi

    info "Running DDL.sql (schema, view, trigger, index)..."
    $psql_cmd -d "$DB_NAME" -f "$PROJECT_DIR/sql/DDL.sql" -q
    success "Schema created"

    info "Running DML.sql (sample data)..."
    $psql_cmd -d "$DB_NAME" -f "$PROJECT_DIR/sql/DML.sql" -q
    success "Sample data loaded"

    info "Running RBAC.sql (roles, grants, RLS policies)..."
    $psql_cmd -d "$DB_NAME" -f "$PROJECT_DIR/sql/RBAC.sql" -q
    success "RBAC configured"

    local table_count
    table_count=$($psql_cmd -d "$DB_NAME" -t -c \
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" \
        2>/dev/null | tr -d ' ')
    success "Database ready — $table_count tables created"
}

# ── 5. Set up Python virtual environment & dependencies ──────
setup_python() {
    if [ ! -d "$VENV_DIR" ]; then
        info "Creating Python virtual environment..."
        python3 -m venv "$VENV_DIR"
        success "Virtual environment created"
    else
        success "Virtual environment exists"
    fi

    source "$VENV_DIR/bin/activate"

    info "Installing Python dependencies..."
    pip install -q -r "$PROJECT_DIR/requirements.txt" 2>&1 | tail -1
    success "Dependencies installed"
}

# ── 6. Set up Node.js / frontend dependencies ────────────────
setup_frontend() {
    if ! command -v node &>/dev/null; then
        info "Node.js not found. Installing via Homebrew..."
        check_brew
        brew install node
        success "Node.js installed: $(node --version)"
    else
        success "Node.js found: $(node --version)"
    fi

    if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
        info "Installing frontend dependencies..."
        cd "$PROJECT_DIR/frontend" && npm install --silent 2>&1 | tail -1
        success "Frontend dependencies installed"
    else
        success "Frontend dependencies exist"
    fi
}

# ── 7. Export environment variables for Flask ─────────────────
configure_env() {
    export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
    export FLASK_APP=run.py
    export FLASK_ENV=development
    export SECRET_KEY="${SECRET_KEY:-dev-secret-key-$(date +%s)}"
}

# ── 8. Kill any existing servers on our ports ───────────────────
kill_existing_servers() {
    local killed=false
    for port in "$FLASK_PORT" "$VITE_PORT"; do
        pids=$(lsof -ti ":$port" 2>/dev/null) || true
        if [ -n "$pids" ]; then
            info "Killing existing process(es) on port $port..."
            echo "$pids" | xargs kill -9 2>/dev/null || true
            success "Port $port cleared"
            killed=true
        fi
    done
    # Give the OS a moment to release the ports before starting new servers
    if [ "$killed" = true ]; then sleep 2; fi
}

# ── 9. Launch both servers ──────────────────────────────────────
cleanup() {
    info "Shutting down..."
    [ -n "$FLASK_PID" ] && kill "$FLASK_PID" 2>/dev/null
    [ -n "$VITE_PID" ] && kill "$VITE_PID" 2>/dev/null
    exit 0
}

launch_app() {
    trap cleanup SIGINT SIGTERM

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} Fitness Club Management System${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  Backend API:  ${CYAN}http://localhost:${FLASK_PORT}${NC}"
    echo -e "  Frontend:     ${CYAN}http://localhost:${VITE_PORT}${NC}"
    if command -v ipconfig &>/dev/null; then
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
    else
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
    fi
    if [ -n "$LOCAL_IP" ]; then
        echo -e "  Network:       ${CYAN}http://${LOCAL_IP}:${VITE_PORT}${NC}"
    fi
    echo ""
    echo -e "  Sample logins (password: ${YELLOW}password123${NC}):"
    echo -e "    Member:  alice@example.com"
    echo -e "    Trainer: frank@example.com"
    echo -e "    Admin:   ivy@example.com"
    echo ""
    echo -e "  Press ${RED}Ctrl+C${NC} to stop both servers."
    echo ""

    cd "$PROJECT_DIR"
    python run.py &
    FLASK_PID=$!

    cd "$PROJECT_DIR/frontend"
    npx vite --port "$VITE_PORT" &
    VITE_PID=$!

    wait
}

# ── Main ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}=== Health & Fitness Club — Setup & Launch ===${NC}"
echo ""

kill_existing_servers
check_postgres
start_postgres
setup_database
setup_python
setup_frontend
configure_env
launch_app
