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
- Use a strong **SECRET_KEY** (e.g. `openssl rand -hex 32`).

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
- **Schema and data**: Run your SQL once against that DB:
  ```bash
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/DDL.sql
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/DML.sql
  ```

---

## Option 2: Frontend and backend on different hosts

Good for: **Vercel/Netlify** (frontend) + **Render/Railway/Fly.io** (backend + DB).

### 1. Deploy the backend

- Deploy the **Flask app** (e.g. as a Web Service on Render/Railway) and give it a URL like `https://your-api.example.com`.
- Set **DB_*** and **SECRET_KEY** in that app’s environment.
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

## Checklist before going live

- [ ] **SECRET_KEY** is a long random value, not the default.
- [ ] **DB_PASSWORD** and DB are not the dev defaults in production.
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
