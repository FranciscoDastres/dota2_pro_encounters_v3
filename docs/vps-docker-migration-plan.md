# VPS Docker Migration Plan

## Summary

Migrate StompTracker from Vercel + Supabase to the VPS `45.77.74.76` using
Docker Compose and the domain `stomptracker.duckdns.org`.

The target deployment flow is:

1. Push to `main` in `FranciscoDastres/dota2_pro_encounters_v3`.
2. GitHub Actions builds the frontend and backend Docker images outside the VPS.
3. GitHub Actions publishes the images to private GHCR packages.
4. GitHub Actions connects to the VPS over SSH as the `deploy` user.
5. The VPS runs `docker compose pull` and `docker compose up -d`.

The VPS must not build application images. It only pulls already-built images
and restarts containers.

## Key Implementation Changes

- Replace Supabase with a lightweight Postgres container.
- Use direct SQL from the backend with `pg`.
- Keep the backend API shape stable, except `/api/health/deep` reports
  `database` instead of `supabase`.
- Serve the Vite frontend as static files through Caddy.
- Route `/api/*` from Caddy to the internal backend container.
- Expose only Caddy on ports `80` and `443`.
- Keep Postgres and the backend private on the Docker network.
- Use Caddy automatic HTTPS for `stomptracker.duckdns.org`.
- Keep production secrets in `/opt/stomptracker/.env`, never in Git.
- Add local compressed Postgres backups with 7-day retention.

## Runtime Defaults

- Domain: `https://stomptracker.duckdns.org`
- Compose directory on VPS: `/opt/stomptracker`
- Public service: Caddy `web`
- Internal services: `backend`, `postgres`
- Postgres database: `stomptracker`
- Postgres user: `stomptracker`
- Backend port inside Docker: `3000`
- Backend memory tuning: `NODE_OPTIONS=--max-old-space-size=256`

## Required Secrets

GitHub repository secrets:

- `VPS_HOST`: `45.77.74.76`
- `VPS_USER`: `deploy`
- `VPS_SSH_KEY`: private SSH key for the `deploy` user
- `GHCR_USERNAME`: GitHub username or machine user allowed to read packages
- `GHCR_READ_TOKEN`: read-only token for pulling private GHCR images

VPS `.env` values in `/opt/stomptracker/.env`:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `FRONTEND_URL=https://stomptracker.duckdns.org`
- `OPENDOTA_API_URL=https://api.opendota.com/api`
- `OPENDOTA_API_KEY` optional
- `GHCR_USERNAME`
- `GHCR_READ_TOKEN`
- image tags or image names if overriding defaults

## Test Plan

- Run backend unit tests after replacing Supabase with Postgres.
- Run frontend unit tests after changing production API base behavior.
- Run `npm run build:all`.
- Build Docker images locally or in GitHub Actions.
- Run Compose locally with a test env and verify:
  - `/api/health`
  - `/api/health/deep`
  - SPA route fallback
  - Caddy proxy from `/api/*` to backend
- On production, verify:
  - `https://stomptracker.duckdns.org` responds over HTTPS.
  - `https://stomptracker.duckdns.org/api/health` returns `status: ok`.
  - Backend port `3000` and Postgres port `5432` are not public.
  - A push to `main` updates containers without building on the VPS.

## Assumptions

- Postgres starts empty; no Supabase data migration is required.
- `match_cache` can be regenerated from OpenDota.
- SSH remains open because the admin IP is dynamic.
- SSH hardening uses keys, no root login, no password auth, Fail2ban, and
  unattended security upgrades.
- Backup v1 is local-only with 7-day retention.
