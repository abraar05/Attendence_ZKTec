# Employee Attendance & Management App

Live-syncs punch data from ZKTeco 40 & 50i devices (network push + polling
fallback), manages employees, and generates attendance reports.

## Stack (all free / open-source)
- **Backend**: Node.js + Express + Sequelize
- **Database**: PostgreSQL (self-host via Docker, or free tier on Supabase/Neon/Render)
- **Frontend**: React + Vite
- **Device link**: `node-zklib` — standard ZKTeco TCP protocol (port 4370), used both for the live real-time listener and the polling fallback
- **Hosting**: Docker Compose included for self-hosting on any VPS/office server for $0 in licensing; or deploy backend+DB free tier on Render/Railway/Fly.io and frontend free on Netlify/Vercel/GitHub Pages

## Quick start (local / Docker)
```bash
git clone <this repo>
cd attendance-app
docker compose up -d --build
docker compose exec backend npm run migrate   # creates tables + seeds admin user
```
Then open http://localhost:5173 and log in with:
- email: `admin@example.com`
- password: `ChangeMe123!` (change immediately — see Users below)

## Quick start (manual, no Docker)
```bash
# 1. Postgres running locally, then:
cd backend
cp .env.example .env   # fill in DB creds, JWT_SECRET
npm install
npm run migrate
npm run dev

# 2. In a second terminal:
cd frontend
npm install
npm run dev
```

## Connecting your ZKTeco devices
1. On each device, note its **IP address** and make sure it's reachable
   from the server on **port 4370** (device menu: Comm → Ethernet). Both the
   40 and 50i speak the same TCP protocol node-zklib uses.
2. In the app, go to **Devices → Add Device**, enter the IP/port.
3. The server opens a persistent connection and starts receiving punches
   in real time as they happen (`getRealTimeLogs`), plus a scheduled pull
   every `DEVICE_POLL_INTERVAL_MINUTES` (default 5) as a safety net if the
   live connection drops or the device was offline.
4. Employees are matched to punches by **device user ID** — set this field
   when creating/importing an employee to match how they're registered on
   the physical device (fingerprint/card enrollment ID).

## Manual file import (fallback for your current workflow)
If you ever need to fall back to manually exporting data from a device (as
you do today) instead of relying on live sync:
- **Attendance → Manual Import** accepts multiple files at once, any mix of
  `.csv`, `.xlsx`/`.xls`, or raw `.dat`/`.txt` exports from the device software.
- **Employees → Bulk Import** accepts CSV/Excel with columns:
  `empCode, deviceUserId, name, department, designation, email, phone`

## Reports
- **Reports** page: date-range summary per employee — days present/absent,
  late days, total hours — viewable in-app or exported to Excel.

## Users & roles
Roles: `admin` (full access, manage devices/users), `hr` (manage employees,
import data), `viewer` (read-only reports). Create additional users via
`POST /api/auth/users` (admin only) once logged in.

## Production hardening checklist (before going fully live)
- [ ] Change `JWT_SECRET` and the seeded admin password
- [ ] Put the backend behind HTTPS (nginx/Caddy reverse proxy or your host's built-in TLS)
- [ ] Set proper Postgres backups (pg_dump cron, or managed provider's automatic backups)
- [ ] Restrict `FRONTEND_URL` CORS origin to your real domain
- [ ] Add rate limiting on `/api/auth/login` (e.g. `express-rate-limit`)
- [ ] Set up device IP allow-listing / VPN if devices are on a different network than the server
- [ ] Add monitoring/alerting for device `offline` status (e.g. email/Slack webhook when a device drops)

## Suggested next features
- Shift/roster management (per-employee or per-department shift patterns feeding the late/absent logic)
- Leave management (so approved leave doesn't count as "absent")
- Push notifications when a device goes offline
- Employee self-service portal (view own attendance, request corrections)
