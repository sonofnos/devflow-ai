# devflow-ai

AI-powered developer productivity tool — code snippet library with AI explanations, and an AI-prioritized task board.

**Tech stack:** React 19 · TypeScript · TanStack Query · Node.js · Express · PostgreSQL · Anthropic Claude API · Vite · Jest · Vitest

**Live:** [devflow-ai.onrender.com](https://devflow-ai.onrender.com) (backend) · [devflow-ai.vercel.app](https://devflow-ai.vercel.app) (frontend)

---

## Features

**Snippets**
- Save code snippets with language tags
- One-click AI explanation via Claude — bulleted breakdown of what the code does, patterns used, and when to reach for it
- Filter by tag, copy, delete

**Tasks (Kanban board)**
- Three-column board: To Do / In Progress / Done
- Manual priority setting: low / medium / high / critical
- **AI Prioritize** — sends all open tasks to Claude, gets back ranked priorities with a one-line reason per task, updates the board in place
- 10-second polling for live updates

**Auth**
- JWT-based register/login, 7-day token
- All data is per-user; protected routes redirect to /login on 401

---

## Architecture

```
devflow-ai/
├── backend/                  # Node.js · Express · TypeScript
│   └── src/
│       ├── routes/           # auth, snippets, tasks
│       ├── middleware/       # requireAuth (JWT)
│       └── db/               # pg Pool, schema.sql
└── frontend/                 # React 19 · TypeScript · Vite
    └── src/
        ├── pages/            # Dashboard, Snippets, Tasks, Login
        ├── components/       # PriorityBadge
        ├── hooks/            # useAuth, useSnippets, useTasks (TanStack Query)
        └── api/              # axios client with interceptors
```

The frontend proxies `/api` to the backend in development via Vite's `server.proxy`. In production, set `VITE_API_URL` to the backend's URL.

---

## Running locally

### Backend

```bash
cd backend
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm install
psql $DATABASE_URL -f src/db/schema.sql
npm run dev                   # :3001
```

### Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                   # :5173
```

### Tests

```bash
cd backend && npm test        # 21 Jest tests
cd frontend && npm test       # 7 Vitest tests
```

---

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register; returns JWT |
| POST | `/api/auth/login` | — | Login; returns JWT |
| GET | `/api/snippets` | ✓ | List snippets (optional `?tag=`) |
| POST | `/api/snippets` | ✓ | Create snippet |
| DELETE | `/api/snippets/:id` | ✓ | Delete snippet |
| POST | `/api/snippets/:id/explain` | ✓ | AI-explain snippet (Claude) |
| GET | `/api/tasks` | ✓ | List tasks (optional `?status=`) |
| POST | `/api/tasks` | ✓ | Create task |
| PATCH | `/api/tasks/:id` | ✓ | Update task (status, priority, etc.) |
| DELETE | `/api/tasks/:id` | ✓ | Delete task |
| POST | `/api/tasks/ai-prioritize` | ✓ | AI-prioritize all open tasks (Claude) |

---

## Environment variables

**Backend**
```
DATABASE_URL=postgres://...
JWT_SECRET=<32+ char secret>
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
FRONTEND_URL=https://devflow-ai.vercel.app
```

**Frontend**
```
VITE_API_URL=https://devflow-ai.onrender.com/api
```
