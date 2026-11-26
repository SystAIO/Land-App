#!/usr/bin/env bash
# Store DuckDNS credentials, install the 5-minute cron updater, and update nginx.
# Usage: sudo bash configure-duckdns.sh <domain> <token>
set -euo pipefail

DOMAIN="${1:?Usage: configure-duckdns.sh <domain> <token>}"
TOKEN="${2:?Usage: configure-duckdns.sh <domain> <token>}"

# Accept either "systio-land" or "systio-land.duckdns.org".
DOMAIN="${DOMAIN%.duckdns.org}.duckdns.org"

APP_ROOT="${APP_ROOT:-/var/www/Land-App}"
DEPLOY_DIR="${DEPLOY_DIR:-/etc/land-app}"
LOG_DIR="${LOG_DIR:-/var/log/land-app}"
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/deploy.env}"
APP_PORT=3000
if [[ -f "$ENV_FILE" ]]; then
  APP_PORT="$(grep -E '^APP_PORT=' "$ENV_FILE" | tail -n 1 | cut -d= -f2 || true)"
  APP_PORT="${APP_PORT:-3000}"
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: run as root (sudo)." >&2
  exit 1
fi
if [[ ! "$DOMAIN" =~ ^[A-Za-z0-9-]+\.duckdns\.org$ ]]; then
  echo "ERROR: invalid DuckDNS domain: $DOMAIN" >&2
  exit 1
fi

mkdir -p "$DEPLOY_DIR" "$LOG_DIR"
chmod 700 "$DEPLOY_DIR"

echo "==> Saving DuckDNS credentials"
umask 077
cat > "$DEPLOY_DIR/duckdns.env" <<EOF
DUCKDNS_DOMAIN=$DOMAIN
DUCKDNS_TOKEN=$TOKEN
EOF
chmod 600 "$DEPLOY_DIR/duckdns.env"

echo "==> Installing updater"
install -m 755 "$APP_ROOT/deploy/scripts/duckdns-update.sh" \
  /usr/local/bin/land-app-duckdns-update.sh
(crontab -l 2> /dev/null | grep -v land-app-duckdns-update.sh || true; \
  echo "*/5 * * * * /usr/local/bin/land-app-duckdns-update.sh >> $LOG_DIR/duckdns.log 2>&1") \
  | crontab -

echo "==> Updating nginx server_name to $DOMAIN"
if [[ -f /etc/nginx/sites-available/land-app ]]; then
  sed -i -E "s|^[[:space:]]*server_name .*;|    server_name $DOMAIN;|" \
    /etc/nginx/sites-available/land-app
  ln -sfn /etc/nginx/sites-available/land-app /etc/nginx/sites-enabled/land-app
  nginx -t
  systemctl reload nginx
fi

echo "==> Running updater once"
/usr/local/bin/land-app-duckdns-update.sh || true

echo "==> Done. Mobile app API base URL: http://$DOMAIN"
echo "    crontab entry:"
crontab -l | grep land-app-duckdns-update.sh || true
