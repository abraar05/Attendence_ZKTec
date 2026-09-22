# Deployment checklist

## Required environment

Set a strong `JWT_SECRET` with at least 32 characters, a restricted `FRONTEND_URL`, and the PostgreSQL connection variables from `backend/.env.example`. Do not commit `.env` files.

## Local verification

```bash
cd backend && npm install && npm run migrate && npm start
cd ../frontend && npm install && npm run build
```

The frontend uses `/api` by default, which supports serving it behind the same reverse proxy as the backend. For a separate frontend host, set `VITE_API_URL` to the backend API URL at build time.

## Production notes

Run the backend behind HTTPS, use a managed PostgreSQL backup policy, restrict device network access to the server, and replace the seeded admin password immediately. The backend exposes `GET /health` for service checks and fails fast when `JWT_SECRET` is missing or too short.
