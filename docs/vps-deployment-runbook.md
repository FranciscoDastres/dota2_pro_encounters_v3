# VPS Deployment Runbook

This runbook prepares the Ubuntu 24 VPS for the Compose deployment in
`compose.prod.yml`.

## 1. DNS

Point `stomptracker.duckdns.org` to `45.77.74.76`.

## 2. Host preparation

Run as root once:

```bash
apt update
apt install -y ca-certificates curl fail2ban unattended-upgrades ufw
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -d -m 755 -o deploy -g deploy /opt/stomptracker
install -d -m 700 -o deploy -g deploy /opt/stomptracker/backups
```

Add the deploy public key to `/home/deploy/.ssh/authorized_keys`, then verify
SSH access as `deploy` before changing SSH policy.

Recommended SSH hardening in `/etc/ssh/sshd_config.d/99-hardening.conf`:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Then reload SSH:

```bash
systemctl reload ssh
```

Keep UFW to only SSH, HTTP, and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 3. Docker

Install Docker Engine and the Compose plugin from the official Docker
repository for Ubuntu 24.04, then allow the `deploy` user to run Docker:

```bash
usermod -aG docker deploy
```

Log out and back in as `deploy` before testing:

```bash
docker info
docker compose version
```

## 4. Production env

As `deploy`, create `/opt/stomptracker/.env` from
`deploy/env.production.example`.

Use a long random `POSTGRES_PASSWORD` and make sure `DATABASE_URL` uses the
same password:

```env
POSTGRES_PASSWORD=replace-with-long-random-value
DATABASE_URL=postgresql://stomptracker:replace-with-long-random-value@postgres:5432/stomptracker
```

Lock down the file:

```bash
chmod 600 /opt/stomptracker/.env
```

## 5. GitHub secrets

Configure these repository secrets:

- `VPS_HOST`: `45.77.74.76`
- `VPS_USER`: `deploy`
- `VPS_SSH_KEY`: private key for the deploy user
- `GHCR_USERNAME`: GitHub user or machine user with package read access
- `GHCR_READ_TOKEN`: read-only token for private GHCR package pulls

The workflow uses `GITHUB_TOKEN` to publish images and `GHCR_READ_TOKEN` only
on the VPS to pull them.

## 6. First deploy

Trigger the `Build and deploy` workflow manually or push to `main`.

After it completes, verify from the VPS:

```bash
cd /opt/stomptracker
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs --tail=100 backend
```

Verify externally:

```bash
curl -I https://stomptracker.duckdns.org
curl https://stomptracker.duckdns.org/api/health
curl https://stomptracker.duckdns.org/api/health/deep
```

Ports `3000` and `5432` should not be open publicly.

## 7. Backups

The workflow uploads backup units to `/opt/stomptracker/deploy/systemd`.
Install them as root after the first deploy:

```bash
cp /opt/stomptracker/deploy/systemd/stomptracker-backup.* /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now stomptracker-backup.timer
systemctl list-timers stomptracker-backup.timer
```

Manual backup test:

```bash
sudo -u deploy /opt/stomptracker/scripts/backup-postgres.sh
ls -lh /opt/stomptracker/backups
```

Backups are local-only and retain 7 days by default.
