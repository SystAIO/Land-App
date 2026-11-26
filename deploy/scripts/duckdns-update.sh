#!/usr/bin/env bash
# Push this server's public IP to DuckDNS. Run by cron every 5 minutes.
set -euo pipefail

ENV_FILE="${DUCKDNS_ENV_FILE:-/etc/land-app/duckdns.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DUCKDNS_DOMAIN:?DUCKDNS_DOMAIN is not set}"
: "${DUCKDNS_TOKEN:?DUCKDNS_TOKEN is not set}"

SUBDOMAIN="${DUCKDNS_DOMAIN%.duckdns.org}"
IP="$(curl -fsS --max-time 10 https://api.ipify.org || curl -fsS --max-time 10 https://ifconfig.me)"
RESPONSE="$(curl -fsS --max-time 15 \
  "https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=${IP}")"

echo "$(date -Is) domain=$DUCKDNS_DOMAIN ip=$IP response=$RESPONSE"
[[ "$RESPONSE" == OK* ]]
