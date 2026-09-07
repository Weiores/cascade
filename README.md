<img width="1213" height="492" alt="image" src="https://github.com/user-attachments/assets/0007c164-cf49-44af-99b6-26e7c181f50c" />

Cascade is a rail maintenance scheduling optimisation prototype built around the CAPO framework:

- **Capture** maintenance demand and available resources
- **Assess** time, space, resource, and safety constraints
- **Prioritise** work by urgency, trust, and operational value
- **Optimise** the nightly schedule against limited engineering hours and manpower

The app helps a duty manager turn competing maintenance requests into a conflict-aware nightly plan, understand why work was moved or deferred, and test whether adding resources would improve output.

## Features

- Maintenance request intake with trust and priority scoring
- Constraint and conflict detection across sectors, crews, equipment, and work compatibility
- Priority-weighted schedule optimisation for overnight engineering windows
- Interactive Gantt-style crew schedule
- Conflict warnings with suggested alternatives
- Resource management for crews, equipment, and sectors
- What-if simulator for extra crews, equipment, or engineering time
- Dashboard KPIs and bottleneck analysis

## Architecture

```text
React + Vite frontend
        |
        | /api proxy
        v
Express backend (Node.js)
        |
        v
SQLite local database
```

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Recharts, Tailwind CSS
- Backend: Express, TypeScript, built-in Node.js SQLite (`node:sqlite`)
- Database: generated locally in `backend/capo.db` and seeded automatically on first run

## Requirements

- Node.js 24+
- npm

## Setup

Install dependencies for both apps:

```bash
npm install
cd backend && npm install && cd ..
```

Start frontend and backend together:

```bash
npm run dev:all
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`

If port `3001` is already in use, stop the old backend process and run `npm run dev:all` again.

## Scripts

Root project:

```bash
npm run dev       # start Vite frontend only
npm run dev:all   # start backend + frontend together
npm run build     # type-check and build frontend
npm run lint      # run oxlint
npm run preview   # preview frontend build
```

Backend:

```bash
cd backend
npm run dev       # start backend in watch mode
npm run build     # compile backend TypeScript
npm start         # run compiled backend
```

## Database

Cascade uses a local SQLite database file under `backend/`. Runtime database files are intentionally ignored by git:

```text
backend/*.db*
```

A fresh database is created and seeded automatically from `backend/src/db/seed.ts` when the backend starts and no requests exist.

## Main API areas

- `GET /api/requests` — list maintenance requests
- `POST /api/requests` — create a request
- `POST /api/optimise` — run scheduling optimisation
- `GET /api/schedule` — retrieve the current schedule
- `POST /api/what-if` — simulate added resources or time
- `GET /api/crews` — list crews
- `GET /api/equipment` — list equipment
- `GET /api/sectors` — list sectors

## Notes

This is a hackathon/MVP prototype. It is designed for local demonstration rather than production deployment.
