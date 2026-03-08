# Publishing / Deploying the Fitness Club App

This guide covers how to **build for production** and **publish** the app (frontend + backend + database).

---

## Option 1: Single server (Flask serves React build + API)

Good for: a VPS (DigitalOcean, Linode, AWS EC2), or platforms like **Render** or **Railway** that run one process and optional DB.

### 1. Build the frontend

```bash
cd frontend
npm ci
npm run build
cd ..
```

This creates `frontend/dist/` with static files.

### 2. Set production environment variables

Create a `.env` (or set in your host’s dashboard):

```env
FLASK_ENV=production
SECRET_KEY=your-long-random-secret-key-here
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=fitness_club
DB_USER=your-db-user
DB_PASSWORD=your-db-password
SERVING_FRONTEND=1
```

- **SERVING_FRONTEND=1** tells Flask to serve the built React app from `frontend/dist` so one URL serves both API and UI.
- Use a strong **SECRET_KEY** (e.g. `openssl rand -hex 32`). This key is used for signing JWT tokens.
- **JWT_ACCESS_EXPIRES** (default 900) — access token lifetime in seconds (15 min).
- **JWT_REFRESH_EXPIRES** (default 604800) — refresh token lifetime in seconds (7 days).

### 3. Run with Gunicorn (production WSGI server)

From the **project root** (where `run.py` is):

```bash
source venv/bin/activate
pip install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:5001 "run:app"
```

- **-w 4**: 4 worker processes (adjust as needed).
- **-b 0.0.0.0:5001**: listen on port 5001 on all interfaces.
- Use a **reverse proxy** (e.g. Nginx, Caddy) in front for HTTPS and static caching in a “real” server setup.

### 4. Database

- **Managed PostgreSQL**: Create a DB (e.g. Render PostgreSQL, Railway, Neon, Supabase) and set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (and `DB_PORT` if not 5432).
- **Schema and data**: Run your SQL once against that DB (as superuser or table owner):
  ```bash
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/DDL.sql
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/RBAC.sql
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/DML.sql
  ```
  The app connects as `fc_app` (RBAC). Set `DB_APP_USER=fc_app` and `DB_APP_PASSWORD=fc_app_dev` (or override via env).

---

## Option 2: Frontend and backend on different hosts

Good for: **Vercel/Netlify** (frontend) + **Render/Railway/Fly.io** (backend + DB).

### 1. Deploy the backend

- Deploy the **Flask app** (e.g. as a Web Service on Render/Railway) and give it a URL like `https://your-api.example.com`.
- Set **DB_***, **DB_APP_USER**, **DB_APP_PASSWORD** (for fc_app role), and **SECRET_KEY** in that app’s environment.
- Do **not** set `SERVING_FRONTEND=1` (backend only serves API).

### 2. Build frontend with API base URL

Point the frontend at your deployed API:

- In `frontend/src/api.js`, either:
  - Keep `const BASE = '/api'` and configure your **frontend host** to proxy `/api` to the backend URL, or
  - Use an env variable, e.g. `const BASE = import.meta.env.VITE_API_URL || '/api'`, and set `VITE_API_URL=https://your-api.example.com/api` when building.

Then build:

```bash
cd frontend
npm ci
npm run build
```

### 3. CORS

On the Flask app, allow your frontend origin:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
```

(Your backend already reads `CORS_ORIGINS` and adds them to allowed origins.)

### 4. Deploy the frontend

- **Vercel**: Connect the repo, set root to `frontend`, build command `npm run build`, output directory `dist`.
- **Netlify**: Same idea; publish directory `frontend/dist` after `npm run build` in `frontend`.

---

## Option 3: Run production build locally (test before publishing)

1. Build frontend: `cd frontend && npm run build && cd ..`
2. Set env: `export SERVING_FRONTEND=1` (and DB vars if not default).
3. Run: `gunicorn -w 2 -b 0.0.0.0:5001 "run:app"`
4. Open **http://localhost:5001** — you should see the app and API on the same port.

---

## Option 4: Free demo deployment (Vercel + Render + Neon)

A zero-cost live demo with registration disabled. All three services have generous free tiers — no credit card required.

| Service | Role | Free Tier |
|---------|------|-----------|
| **Neon** | PostgreSQL database | 0.5 GB storage, 190 compute hours/mo |
| **Render** | Flask API backend | 750 hours/mo, sleeps after 15 min idle |
| **Vercel** | React frontend | 100 GB bandwidth/mo, unlimited deploys |

### 1. Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card).
2. Create a project → create a database named `fitness_club`.
3. Run the SQL scripts against the database (via Neon's SQL Editor or `psql`):
   ```bash
   psql "$NEON_CONNECTION_STRING" -f sql/DDL.sql
   psql "$NEON_CONNECTION_STRING" -f sql/RBAC.sql
   psql "$NEON_CONNECTION_STRING" -f sql/DML.sql
   ```
4. Note the host, database name, user, and password from the Neon dashboard.

### 2. Backend (Render)

1. Connect the GitHub repo to [Render](https://render.com).
2. Create a new **Web Service** (free tier).
3. Set root directory to `.` (project root).
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn -w 2 -b 0.0.0.0:$PORT "run:app"`
6. Add environment variables:
   - `DEMO_MODE=1`
   - `SECRET_KEY` — generate a strong value (`openssl rand -hex 32`)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — from Neon
   - `DB_APP_USER=fc_app`, `DB_APP_PASSWORD` — your RBAC app password
   - `CORS_ORIGINS` — set to the Vercel URL once known (e.g. `https://your-app.vercel.app`)

> A `render.yaml` is included in the repo for one-click blueprint deploys.

### 3. Frontend (Vercel)

1. Connect the GitHub repo to [Vercel](https://vercel.com).
2. Set root directory to `frontend`.
3. Build command: `npm run build`, output directory: `dist`.
4. Add environment variable:
   - `VITE_API_URL=https://your-render-service.onrender.com/api`
5. After deploy, copy the Vercel URL and update `CORS_ORIGINS` on Render.

### Demo mode behaviour

When `DEMO_MODE=1`:
- New user registration is blocked (API returns 403).
- The login page shows sample credentials (click-to-fill) for each role.
- The "Create Account" link is hidden on the home and login pages.
- Logged-in users can still perform all other actions (view dashboards, book sessions, etc.).

### Console logging in production / demo

- **Frontend**: API debug logs are off by default in production builds (`VITE_DEBUG_API` defaults to `0`). Dev scripts (`start.sh`, `run-frontend.sh`) set `VITE_DEBUG_API=1` for local development.
- **Backend**: `DEBUG_API_LOGGING` defaults to `False`. Do not set `DEBUG_API=1` in production.

---

## Checklist before going live

- [ ] **SECRET_KEY** is a long random value, not the default.
- [ ] **DB_PASSWORD**, **DB_APP_USER**, **DB_APP_PASSWORD** and DB are not the dev defaults in production.
- [ ] **HTTPS** in front of the app (via platform or Nginx/Caddy).
- [ ] Sample users/passwords from `DML.sql` changed or removed if the DB is public.
- [ ] `docs/Credentials.md` is not deployed or is excluded from public repos.

---

## Quick reference

| Task              | Command / setting |
|-------------------|-------------------|
| Build frontend    | `cd frontend && npm run build` |
| Run production    | `gunicorn -w 4 -b 0.0.0.0:5001 "run:app"` |
| Serve UI from Flask | `SERVING_FRONTEND=1` |
| Add CORS origin   | `CORS_ORIGINS=https://your-frontend.com` |
