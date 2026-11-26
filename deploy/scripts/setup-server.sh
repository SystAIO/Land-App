#!/usr/bin/env bash
# Land-App — one-shot backend deployment on Ubuntu (Node + PM2 + PostgreSQL + nginx).
# It never touches the existing pagalpagal app (port 4000 / default nginx site).
#
# Usage:  sudo bash setup-server.sh /path/to/deploy.env
set -euo pipefail

ENV_FILE="${1:-/etc/land-app/deploy.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: run this script as root (sudo)." >&2
  exit 1
fi

APP_ROOT="${APP_ROOT:-/var/www/Land-App}"
DEPLOY_DIR="${DEPLOY_DIR:-/etc/land-app}"
LOG_DIR="${LOG_DIR:-/var/log/land-app}"
APP_PORT="${APP_PORT:-3000}"
LAND_DOMAIN="${LAND_DOMAIN:-systio-land.duckdns.org}"
REPO_URL="${REPO_URL:-https://github.com/SystAIO/Land-App.git}"
DB_NAME="${DB_NAME:-land_app}"
DB_USER="${DB_USER:-landapp}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@systio.land}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"
DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-$LAND_DOMAIN}"

for name in DB_NAME DB_USER; do
  if [[ ! "${!name}" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "ERROR: $name may only contain letters, digits and underscores." >&2
    exit 1
  fi
done

# Generated values are hex-only, so they are safe in URLs and SQL literals.
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
if (( ${#JWT_SECRET} < 32 )); then
  echo "ERROR: JWT_SECRET must be at least 32 characters." >&2
  exit 1
fi
: "${RAZORPAY_KEY_ID:?RAZORPAY_KEY_ID is required in deploy.env}"
: "${RAZORPAY_KEY_SECRET:?RAZORPAY_KEY_SECRET is required in deploy.env}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing / verifying system packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl openssl nginx > /dev/null
command -v node > /dev/null || { echo "ERROR: Node.js is required." >&2; exit 1; }
command -v npm  > /dev/null || { echo "ERROR: npm is required." >&2; exit 1; }
if ! command -v pm2 > /dev/null; then
  npm install -g pm2 > /dev/null
fi

mkdir -p "$DEPLOY_DIR" "$LOG_DIR"
chmod 700 "$DEPLOY_DIR"

if [[ "$(readlink -f "$ENV_FILE")" != "$(readlink -f "$DEPLOY_DIR/deploy.env")" ]]; then
  cp "$ENV_FILE" "$DEPLOY_DIR/deploy.env"
fi
chmod 600 "$DEPLOY_DIR/deploy.env"

echo "==> Fetching application code into $APP_ROOT"
if [[ ! -d "$APP_ROOT/.git" ]]; then
  git clone "$REPO_URL" "$APP_ROOT"
else
  git -C "$APP_ROOT" pull --ff-only
fi

echo "==> Building backend"
cd "$APP_ROOT/backend"
npm ci
npm run build

echo "==> Configuring PostgreSQL"
sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -v db_role="$DB_USER" -v db_pass="$DB_PASSWORD" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_role') THEN
    CREATE ROLE :"db_role" LOGIN PASSWORD :'db_pass';
  ELSE
    ALTER ROLE :"db_role" WITH LOGIN PASSWORD :'db_pass';
  END IF;
END
$$;
SQL

if ! sudo -u postgres psql -Atqc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi

dbpsql() {
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 "$@"
}

if [[ -z "$(dbpsql -Atqc "select to_regclass('public.profiles')")" ]]; then
  echo "==> Applying schema.sql"
  dbpsql -f "$APP_ROOT/backend/db/schema.sql"
else
  echo "==> Schema already present, skipping schema.sql (data preserved)"
fi

echo "==> Creating/updating admin account"
dbpsql -v admin_email="$ADMIN_EMAIL" -v admin_password="$ADMIN_PASSWORD" \
  -f "$APP_ROOT/deploy/db/admin.sql"

echo "==> Writing backend .env"
cat > "$APP_ROOT/backend/.env" <<EOF
PORT=$APP_PORT
NODE_ENV=production
CORS_ORIGIN=http://$LAND_DOMAIN
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
JWT_SECRET=$JWT_SECRET
MSG91_AUTHKEY=${MSG91_AUTHKEY:-}
MSG91_TEMPLATE_ID=${MSG91_TEMPLATE_ID:-}
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET:-}
EOF
chmod 600 "$APP_ROOT/backend/.env"

echo "==> Starting backend with PM2"
pm2 delete land-app > /dev/null 2>&1 || true
pm2 start "$APP_ROOT/deploy/ecosystem.config.js" --env production
pm2 save
if ! systemctl is-enabled pm2-root > /dev/null 2>&1; then
  STARTUP_LINE="$(pm2 startup systemd -u root --hp /root 2> /dev/null | grep -E '^(sudo|env|systemctl)' | tail -n 1 || true)"
  if [[ -n "$STARTUP_LINE" ]]; then
    eval "$STARTUP_LINE" || true
  fi
fi

echo "==> Configuring nginx for $LAND_DOMAIN"
sed -e "s|__LAND_DOMAIN__|$LAND_DOMAIN|g" \
    -e "s|__APP_PORT__|$APP_PORT|g" \
    "$APP_ROOT/deploy/nginx-land-app.conf" > /etc/nginx/sites-available/land-app
ln -sfn /etc/nginx/sites-available/land-app /etc/nginx/sites-enabled/land-app
nginx -t
systemctl reload nginx

if [[ -n "${DUCKDNS_TOKEN:-}" && "$DUCKDNS_TOKEN" != "REPLACE_WITH_DUCKDNS_TOKEN" ]]; then
  echo "==> Configuring DuckDNS updater"
  bash "$APP_ROOT/deploy/scripts/configure-duckdns.sh" "$DUCKDNS_DOMAIN" "$DUCKDNS_TOKEN"
else
  echo "==> DuckDNS token not set yet. After creating https://www.duckdns.org/domain run:"
  echo "    sudo bash $APP_ROOT/deploy/scripts/configure-duckdns.sh <domain> <token>"
fi

echo "==> Health check"
sleep 4
curl -fsS "http://127.0.0.1:$APP_PORT/health"
echo
echo "==> Deploy complete. Point $LAND_DOMAIN at this server, then use"
echo "    http://$LAND_DOMAIN as EXPO_PUBLIC_API_BASE_URL in the mobile app."
