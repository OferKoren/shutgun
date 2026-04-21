# Family Car & Shotgun

Small web app: one family coordinates cars. Pick name (no auth), book a car for a date/time, owner approves. Approving auto-declines conflicting pending requests.

## Stack
- React + Vite + TypeScript (Tailwind, react-day-picker, TanStack Query) — `web/`
- Node.js + Express + TypeScript (Prisma, Zod) — `api/`
- PostgreSQL
- Hosted on Render, CI via GitHub Actions.

## Local dev

```bash
# Postgres
docker run -d --name shotgun-pg -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=shotgun -p 5432:5432 postgres:16

# Install
npm install

# Migrate
cd api && cp .env.example .env && npx prisma migrate dev && cd ..

# Run both
npm run dev
```

Web at http://localhost:5173, API at http://localhost:4000.

## Deploy
Push to `main`. Render Blueprint (`render.yaml`) deploys web + api + postgres. GitHub Actions runs lint/typecheck/build.

## How it works
- Open app → pick your name (or add new). Stored in localStorage.
- **Calendar** (month grid) → click a day → see per-car status → request a car.
- Owner of a car sees requests in **Approvals**. Approve one → overlapping pending auto-declined.
- Driver who is also an owner auto-approves own booking.
