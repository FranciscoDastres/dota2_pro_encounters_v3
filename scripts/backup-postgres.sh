#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/stomptracker}
COMPOSE_FILE=${COMPOSE_FILE:-compose.prod.yml}
BACKUP_DIR=${BACKUP_DIR:-$APP_DIR/backups}
RETENTION_DAYS=${RETENTION_DAYS:-7}
POSTGRES_DB=${POSTGRES_DB:-stomptracker}
POSTGRES_USER=${POSTGRES_USER:-stomptracker}

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
tmp_file="$BACKUP_DIR/.stomptracker-$timestamp.dump.gz.tmp"
backup_file="$BACKUP_DIR/stomptracker-$timestamp.dump.gz"

cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"

cd "$APP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=custom \
    --no-owner \
    --no-privileges |
  gzip -9 > "$tmp_file"

chmod 600 "$tmp_file"
mv "$tmp_file" "$backup_file"
find "$BACKUP_DIR" -type f -name 'stomptracker-*.dump.gz' -mtime "+$RETENTION_DAYS" -delete

echo "wrote $backup_file"
