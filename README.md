# Basecamp Tasks — Role-Based Task Management System

A full-stack task management system for organizations, with three roles
(**Admin**, **Manager**, **User**), JWT authentication, team management,
task assignment, comments, and notifications.

- **Backend:** Node.js, Express, PostgreSQL (Sequelize ORM), JWT auth, Swagger docs, Jest tests
- **Frontend:** React (Vite), React Router, Axios
- **Infra:** Docker Compose (Postgres + API + SPA), GitHub Actions CI

---

## 1. Roles & permissions

| Capability                              | Admin | Manager             | User          |
|------------------------------------------|:-----:|:--------------------:|:-------------:|
| Create / edit / delete teams              | ✅    | ❌                    | ❌            |
| Assign a manager to a team                | ✅    | ❌                    | ❌            |
| Add / remove team members                 | ✅    | ❌                    | ❌            |
| Create users with any role                | ✅    | ❌                    | ❌            |
| Create & assign tasks                     | ✅    | ✅ (own teams only)   | ❌            |
| Edit / delete any field on a task         | ✅    | ✅ (own teams only)   | ❌            |
| Update status on an assigned task         | ✅    | ✅                    | ✅ (own tasks)|
| View tasks                                | all   | own teams' tasks      | own tasks     |
| Comment on a task                         | ✅    | ✅                    | ✅ (own tasks)|
| View dashboard                            | org-wide | team-wide           | personal      |

Enforcement happens **server-side** in `backend/src/middleware/rbac.js` and
inside each controller (e.g. a manager can only assign tasks within teams
they manage; a user can only PATCH the `status` field on their own tasks).
The frontend also hides irrelevant UI, but it never relies on that alone.

---

## 2. Project structure

```
tms/
├── backend/                 # Express REST API
│   ├── src/
│   │   ├── config/          # DB connection, Swagger spec, migrate/seed scripts
│   │   ├── models/          # Sequelize models + associations
│   │   ├── middleware/      # auth (JWT), rbac, validation, error handler
│   │   ├── controllers/     # business logic per resource
│   │   ├── routes/          # Express routers + Swagger JSDoc annotations
│   │   └── utils/           # jwt helpers, notify(), asyncHandler
│   ├── tests/                # Jest + Supertest integration tests
│   └── Dockerfile
├── frontend/                 # React (Vite) SPA
│   ├── src/
│   │   ├── api/axios.js      # Axios instance with token refresh interceptor
│   │   ├── context/          # AuthContext
│   │   ├── components/       # Sidebar, NotificationBell, ProtectedRoute, tags
│   │   ├── pages/             # Login, Register, Dashboard, Tasks, TaskDetail, Teams, Users
│   │   └── styles/global.css # Design tokens + all app styling
│   └── Dockerfile             # multi-stage build served by nginx
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 3. Data model

```
User ──< TeamMember >── Team
  │                        │
  │ manager_id             │ manager_id (1 manager per team)
  │                        │
  └──< Task >── Team       │
        │
        ├──< Comment
        └── Notification (per user, per task event)
```

- **User**: `name, email, password_hash, role (admin|manager|user), is_active`
- **Team**: `name, description, manager_id, created_by`
- **TeamMember**: join table, unique `(team_id, user_id)`
- **Task**: `title, description, status (todo|in_progress|done), priority (low|medium|high), deadline, team_id, assigned_to, assigned_by`
- **Comment**: `task_id, user_id, body`
- **Notification**: `user_id, task_id, type (task_assigned|status_changed|comment_added), message, is_read`

---

## 4. Running locally with Docker (recommended)

```bash
git clone <your-fork-url>
cd tms
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Swagger docs: http://localhost:5000/api/docs
- Postgres: localhost:5432 (user/pass: `postgres` / `postgres`)

Seed demo accounts (run once, after the containers are up):

```bash
docker compose exec backend npm run seed
```

This creates:
| Role    | Email                 | Password      |
|---------|-----------------------|----------------|
| Admin   | admin@example.com     | Password123!   |
| Manager | manager@example.com   | Password123!   |
| User    | user1@example.com     | Password123!   |
| User    | user2@example.com     | Password123!   |

---

## 5. Running without Docker

### Backend

```bash
cd backend
cp .env.example .env    # edit DB credentials if needed
npm install
# create the database first, e.g.: createdb task_management
npm run migrate         # or just `npm run dev`, which auto-syncs in development
npm run seed             # optional demo data
npm run dev              # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

---

## 6. Testing

```bash
cd backend
npm test                  # Jest + Supertest; requires a reachable Postgres
                           # (defaults to task_management_test on the same host)
```

CI (`.github/workflows/ci.yml`) runs these tests against a Postgres service
container on every push/PR, and separately verifies the frontend builds.

---

## 7. API documentation

Interactive Swagger UI is served at **`/api/docs`** once the backend is
running, generated from JSDoc annotations directly above each route
(`backend/src/routes/*.js`). The raw OpenAPI JSON is available at
`/api/docs.json` if you'd like to import it into Postman.

Key endpoints:

| Method | Path                              | Description                          |
|--------|------------------------------------|---------------------------------------|
| POST   | `/api/auth/register`               | Self-register (always role `user`)    |
| POST   | `/api/auth/login`                  | Log in, receive access + refresh token|
| POST   | `/api/auth/refresh`                | Exchange refresh token for new access |
| GET    | `/api/auth/me`                     | Current user profile                  |
| GET    | `/api/users`                       | List users (admin, manager)           |
| POST   | `/api/users`                       | Create a user with any role (admin)   |
| GET    | `/api/teams`                       | List teams visible to caller          |
| POST   | `/api/teams`                       | Create a team (admin)                 |
| POST   | `/api/teams/:id/members`           | Add a member to a team (admin)        |
| GET    | `/api/tasks`                       | List tasks (filters: status, priority, team_id, deadline_before/after, search) |
| POST   | `/api/tasks`                       | Create & assign a task (admin, manager)|
| PATCH  | `/api/tasks/:id`                   | Update a task (full for admin/manager, status-only for the assignee) |
| GET/POST | `/api/tasks/:id/comments`        | List / add comments on a task         |
| GET    | `/api/notifications`               | List current user's notifications     |
| PATCH  | `/api/notifications/read-all`      | Mark all as read                      |
| GET    | `/api/dashboard`                   | Role-scoped task status overview      |

---

## 8. Security notes

- Passwords hashed with **bcrypt** (12 rounds), never returned in API responses.
- **JWT access tokens** (short-lived, default 1h) + **refresh tokens** (default 7d);
  the frontend automatically retries a failed request once after silently
  refreshing the access token.
- `helmet`, CORS restricted to `CLIENT_URL`, and a general API rate limiter
  plus a stricter one on `/auth/login`.
- All input validated with `express-validator`; all Sequelize errors and
  JWT errors are normalized by a single error-handling middleware.
- RBAC is enforced in middleware and again inside controllers where the
  rule depends on data (e.g. "a manager may only touch teams they manage").

---

## 9. Deployment notes

- **Backend:** deploy the `backend/` Dockerfile to Render/Railway; set the
  env vars listed in `.env.example`, then run `npm run migrate` (or let
  `sequelize.sync()` run once) against your managed Postgres instance.
- **Frontend:** deploy `frontend/` to Netlify/Vercel, or use the provided
  Dockerfile (nginx) on Render/Railway. Set `VITE_API_URL` to your deployed
  backend's `/api` URL at build time.
- **Database:** any managed PostgreSQL instance (Render, Railway, Neon, RDS).

### 9a. Deploying the frontend to Netlify

The backend must be deployed first (Render/Railway) — Netlify only hosts
the static frontend, and the frontend needs a live API URL to talk to.

1. **Deploy the backend somewhere reachable over HTTPS** (Render or
   Railway both work well) and note its public URL, e.g.
   `https://tms-api.onrender.com`. Confirm `https://tms-api.onrender.com/api/docs`
   loads.

2. **Push this repo to GitHub** (if you haven't already).

3. **In Netlify:** "Add new site" → "Import an existing project" → pick
   the repo. Netlify will detect `frontend/netlify.toml`, but set these
   explicitly to be safe:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

4. **Set the environment variable** in Netlify's Site settings → Environment
   variables:
   - `VITE_API_URL` = `https://tms-api.onrender.com/api`

   (Vite bakes env vars into the build at build time, so this must be set
   *before* you trigger a deploy — a redeploy is required if you change it.)

5. **Deploy.** Netlify builds and gives you a URL like
   `https://your-app.netlify.app`.

6. **Update the backend's CORS allowlist** so it accepts requests from your
   new Netlify URL. Set `CLIENT_URL` on the backend host to a comma-separated
   list, e.g.:
   ```
   CLIENT_URL=http://localhost:5173,https://your-app.netlify.app
   ```
   To also allow Netlify's per-PR deploy previews (random subdomains), add
   a regex entry wrapped in slashes:
   ```
   CLIENT_URL=https://your-app.netlify.app,/^https:\/\/.*--your-app\.netlify\.app$/
   ```
   Restart/redeploy the backend after changing this.

7. **Smoke test:** open the Netlify URL, register an account, and confirm
   you land on the dashboard. If login/register calls fail, check the
   browser console — it's almost always either a stale `VITE_API_URL` (fix:
   redeploy after setting the env var) or a CORS mismatch (fix: step 6).

`frontend/netlify.toml` already sets the build command, publish directory,
and a SPA redirect rule (`/* → /index.html`, status 200) so client-side
routes like `/tasks/123` don't 404 on a hard refresh; `frontend/public/_redirects`
duplicates that rule as a fallback.

---

## 10. What's included vs. left as an exercise

Included: full RBAC-enforced REST API, team/task/comment/notification CRUD,
JWT auth with refresh, dashboard aggregation, Swagger docs, Jest/Supertest
integration tests, Docker Compose, and CI.

Not included (left as extension points): WebSocket/real-time push for
notifications (currently polled every 30s), email delivery, password
reset flow, and file attachments on tasks.
