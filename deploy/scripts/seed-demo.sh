#!/usr/bin/env bash
# Mirrors the APK's demo dataset into PostgreSQL. Safe to re-run (it replaces
# only its own rows; real user data is untouched). No app rebuild needed.
# Usage: sudo bash seed-demo.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/Land-App}"
ENV_FILE="$APP_ROOT/backend/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE" >&2
  exit 1
fi

echo "==> Seeding demo owners, properties and payments"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$APP_ROOT/deploy/db/demo-seed.sql"
echo "==> Done. Refresh the app to see the listings."
