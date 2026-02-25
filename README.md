# Health and Fitness Club Management System

A PostgreSQL-backed web application for managing a small fitness club, built with Python Flask and Bootstrap 5.

## Features

- **Member Operations**: Registration, profile management, health metric tracking, personal dashboard
- **Trainer Operations**: Availability management, schedule viewing, read-only member health data
- **Admin Operations**: Room booking (sessions & group classes), equipment maintenance tracking
- **Role-Based Access Control**: Members, trainers, and admins each see only their permitted pages
- **Database Integrity**: Constraints, triggers (room double-booking prevention), views, and indexes

## Tech Stack

- **Backend**: Python 3 / Flask (REST API)
- **Database**: PostgreSQL
- **Frontend**: React (Vite), Tailwind CSS, Recharts
- **Auth**: Flask sessions with werkzeug password hashing (pbkdf2:sha256)

## Prerequisites

- macOS with Homebrew (the run script installs PostgreSQL automatically if missing)
- Python 3.9+

## Quick Start (One Command)

```bash
./start.sh
```

This single script handles **everything** automatically:
1. Installs PostgreSQL via Homebrew (if not already installed)
2. Starts the PostgreSQL server
3. Creates the `fitness_club` database
4. Runs DDL.sql (tables, constraints, view, trigger, index)
5. Loads DML.sql (sample data)
6. Creates a Python virtual environment and installs dependencies
7. Launches the Flask API and the React frontend dev server

- **Backend API**: http://localhost:5001  
- **Frontend**: http://localhost:5173  

### Script Options

```bash
./start.sh              # Normal run (skips DB creation if it already exists)
./start.sh --reset      # Drop and recreate the database from scratch
./start.sh --skip-db    # Skip all database steps, just start the app
```

### Environment Variable Overrides (optional)

```bash
export DB_NAME=fitness_club    # default
export DB_USER=$(whoami)       # default: your macOS username
export DB_HOST=localhost       # default
export DB_PORT=5432            # default
export DB_PASSWORD=            # default: empty (Homebrew PostgreSQL uses peer auth)
export FLASK_PORT=5001         # default
export VITE_PORT=5173          # default (frontend)
```

## Publishing / Deployment

To deploy to a server or a hosting provider (Render, Railway, Vercel, etc.), see **[docs/Deployment.md](docs/Deployment.md)** for:

- Building the frontend for production
- Running the backend with **Gunicorn**
- Serving the React app from Flask (single-server deploy)
- Splitting frontend and backend (e.g. Vercel + Render)
- Environment variables and CORS for production

## Manual Setup (Step by Step)

If you prefer to set things up manually:

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create database and load schema + data
createdb fitness_club
psql -d fitness_club -f sql/DDL.sql
psql -d fitness_club -f sql/DML.sql

# 4. Run the app
python run.py
```

The API runs at **http://localhost:5001** and the frontend at **http://localhost:5173**.

## Sample Login Credentials

All sample users share the password: `password123`

| Role    | Email              |
|---------|--------------------|
| Member  | alice@example.com  |
| Member  | bob@example.com    |
| Trainer | frank@example.com  |
| Trainer | grace@example.com  |
| Admin   | ivy@example.com    |

## Project Structure

```
DB_project/
├── app/                    # Flask application
│   ├── __init__.py         # App factory
│   ├── config.py           # Configuration
│   ├── db.py               # Database connection
│   ├── routes/
│   │   ├── auth.py         # Login, register, logout, role decorators
│   │   ├── member.py       # Operations 1-4
│   │   ├── trainer.py      # Operations 5-6
│   │   └── admin.py        # Operations 7-8
│   ├── templates/          # Jinja2 HTML templates
│   └── static/             # CSS
├── sql/
│   ├── DDL.sql             # Schema definition
│   └── DML.sql             # Sample data
├── docs/
│   ├── ER_Diagram.md       # ER model with Mermaid diagram
│   ├── Relational_Schema.md # Relational schema with Mermaid diagram
│   └── Project_Report.md   # Design decisions and normalization
├── requirements.txt
├── run.py                  # Flask entry point
├── start.sh                # One-click setup & launch script
└── README.md
```

## 8 Required Operations

| # | Operation              | Role    | Route                  |
|---|------------------------|---------|------------------------|
| 1 | User Registration      | Public  | `/register`            |
| 2 | Profile Management     | Member  | `/member/profile`      |
| 3 | Health History         | Member  | `/member/health-history` |
| 4 | Dashboard              | Member  | `/member/dashboard`    |
| 5 | Set Availability       | Trainer | `/trainer/availability` |
| 6 | Schedule View          | Trainer | `/trainer/schedule`    |
| 7 | Room Booking           | Admin   | `/admin/room-booking`  |
| 8 | Equipment Maintenance  | Admin   | `/admin/equipment`     |

## Video Demonstration

_Link to be added here._
