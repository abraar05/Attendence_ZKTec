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

## GitHub Actions

The workflow in `.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual dispatches. It installs dependencies from the lockfiles, builds the frontend, validates backend JavaScript, and builds both Docker images. On a successful push to `main`, it will also `POST` to the repository secret `DEPLOY_HOOK_URL` when that secret is configured. Add the deployment hook URL supplied by the hosting provider under **Settings → Secrets and variables → Actions → New repository secret**. If the secret is absent, checks still pass and deployment is explicitly skipped.
