# 🎫 DeskMate

DeskMate is a lightweight helpdesk / support-ticketing web app for small teams, with an AI-assisted reply drafter. Support agents see a shared inbox of tickets, claim one, read the customer thread, click "Generate Draft," get an AI-written reply grounded in the ticket context, edit it, and send.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://desk-mate-iota.vercel.app)
[![Backend](https://img.shields.io/badge/api-render-46E3B7)](https://deskmate-backend-gv25.onrender.com)
[![React](https://img.shields.io/badge/frontend-React%2019-61DAFB)](https://react.dev)
[![Express](https://img.shields.io/badge/backend-Express%205-000000)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/orm-Prisma-2D3748)](https://www.prisma.io)

**🔗 [Live app](https://desk-mate-iota.vercel.app/login)** · **🔗 [Backend API](https://deskmate-backend-gv25.onrender.com)**

---

## ✨ Try it

Log in with the seeded demo agent account:

| | |
|---|---|
| **Email** | `agent@deskmate.test` |
| **Password** | `AgentPass123!` |

The login page has a **"Fill demo credentials"** button if you'd rather not type it. The inbox comes pre-seeded with sample tickets across every status (open · pending · resolved · closed) and priority — no need to create anything to see the app in action.

👉 Click a ticket → **Claim** it → hit **"Generate Draft"** to see a live AI-drafted reply (powered by Gemini) that you can edit before sending.

> ⚠️ **Private/incognito windows:** the session cookie is cross-site (frontend on Vercel, backend on Render). Browsers that block third-party cookies by default in private mode (Chrome, Brave) will show "session expired" right after login even though nothing is broken. Use a regular browser window for the demo.

> 🐢 **Cold starts:** the backend runs on Render's free tier, which spins down after inactivity. The first request after idle time can take 30–60 seconds.

Demo data resets periodically via a scheduled job, since tickets get claimed/replied/closed as people try the app.

---

## 🛠️ Tech stack

| Layer | Choice |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **Backend** | Node.js + Express 5 + TypeScript |
| **Database** | PostgreSQL via Prisma ORM, hosted on [Neon](https://neon.tech) |
| **Session store** | Redis ([Upstash](https://upstash.com)) — payloads encrypted with AES-256-GCM, only an opaque session id ever reaches the browser |
| **AI drafting** | Google Gemini (`gemini-3.5-flash-lite`) behind a swappable `generateDraftReply()` interface |
| **Hosting** | Vercel (frontend) · Render (backend) · Neon (Postgres) · Upstash (Redis) |


---

## 💻 Local development

### Prerequisites
- Node.js 20+
- A Postgres instance (local or hosted, e.g. Neon)
- A Redis instance (local or hosted, e.g. Upstash)
- A Gemini API key *(optional — runs fine with `AI_DRAFT_MODE=mock`)*

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, SESSION_ENCRYPTION_KEY, etc.
npx prisma migrate deploy
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to the backend automatically — no `VITE_API_BASE_URL` needed locally.

---

## ⚙️ Environment variables

See `.env.example` in `backend/` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string (`rediss://` for TLS) |
| `SESSION_ENCRYPTION_KEY` | 32-byte key for AES-256-GCM session encryption |
| `AI_DRAFT_MODE` | `mock` or `live` — controls whether draft generation calls Gemini or returns templated text |
| `GEMINI_API_KEY` | Required when `AI_DRAFT_MODE=live` |
| `RESEED_SECRET` | Shared secret for the protected `/api/admin/reseed` endpoint used by the demo-data reset cron |
