#!/usr/bin/env bash
# Quick live check of the deployed backend.
# Usage: sudo bash smoke.sh [path/to/deploy.env]
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

BASE="http://127.0.0.1:$APP_PORT"
echo "==> /health"
curl -fsS "$BASE/health"
echo

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@systio.land}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"
if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  echo "==> admin login"
  curl -fsS -X POST "$BASE/auth/admin-login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    | head -c 300
  echo
fi

echo "==> public listings"
curl -fsS "$BASE/listings?limit=1" | head -c 300
echo
