# Fitness Club – Credentials

## Application logins

All sample users use the same password: **password123**

### Members

| Email              | Name          |
|--------------------|---------------|
| alice@example.com  | Alice Johnson |
| bob@example.com    | Bob Smith     |
| carol@example.com  | Carol Davis   |
| david@example.com  | David Lee     |
| emma@example.com   | Emma Wilson   |

### Trainers

| Email             | Name         | Specialization        |
|-------------------|--------------|------------------------|
| frank@example.com | Frank Miller | Strength Training      |
| grace@example.com | Grace Chen   | Yoga & Flexibility     |
| henry@example.com | Henry Brown  | Cardio & HIIT          |

### Admins

| Email            | Name        |
|------------------|-------------|
| ivy@example.com  | Ivy Adams   |
| jack@example.com | Jack Turner |

---

## Database

Used by the backend (`backend/config.py`, `start.sh`). Defaults:

| Variable    | Default              | Notes                          |
|-------------|----------------------|--------------------------------|
| `DB_NAME`   | fitness_club         | Database name                  |
| `DB_USER`   | `$(whoami)`          | Often your macOS username      |
| `DB_HOST`   | localhost            |                                |
| `DB_PORT`   | 5432                 |                                |
| `DB_PASSWORD` | (empty)            | Often empty for peer auth      |

Optional overrides:

```bash
export DB_NAME=fitness_club
export DB_USER=$(whoami)
export DB_HOST=localhost
export DB_PORT=5432
export DB_PASSWORD=
```

---

## Other

- **Flask port**: `FLASK_PORT=5001` (default)
- **Frontend dev**: typically http://localhost:5173 (Vite)
- **Backend API**: http://localhost:5001
