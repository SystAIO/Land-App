#!/usr/bin/env bash
# Pull the latest code, rebuild and restart the backend without touching the DB.
# Usage: sudo bash update.sh [path/to/deploy.env]
set -euo pipefail

ENV_FILE="${1:-/etc/land-app/deploy.env}"
APP_PORT=3000
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  APP_PORT="${APP_PORT:-3000}"
fi

APP_ROOT="${APP_ROOT:-/var/www/Land-App}"
if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: run as root (sudo)." >&2
  exit 1
fi

echo "==> Pulling latest code"
git -C "$APP_ROOT" pull --ff-only

echo "==> Rebuilding"
cd "$APP_ROOT/backend"
npm ci
npm run build

echo "==> Restarting"
pm2 restart land-app
pm2 save

sleep 4
echo "==> Health check"
curl -fsS "http://127.0.0.1:$APP_PORT/health"
echo
