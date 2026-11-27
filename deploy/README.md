# Land-App backend deployment

This folder deploys **only the backend** as a separate service on the provided Ubuntu server
(`129.121.186.158`), with its own self-hosted PostgreSQL database and a DuckDNS hostname.
The existing `pagalpagal` app (PM2 process on port 4000, nginx `default_server`) is left untouched.

```
deploy/
├── .env.example              # config template (copy → deploy.env, never commit)
├── ecosystem.config.js       # PM2 process definition
├── nginx-land-app.conf       # nginx server block template
├── db/admin.sql              # admin account creation (psql variables)
└── scripts/
    ├── setup-server.sh       # one-shot: DB + code + build + PM2 + nginx + DuckDNS
    ├── update.sh             # pull → rebuild → restart
    ├── duckdns-update.sh     # cron updater for the dynamic DNS record
    ├── configure-duckdns.sh  # save domain/token, enable cron, update nginx
    └── smoke.sh              # health / admin-login / listings check
```

## What gets installed on the server

| Item | Value |
|---|---|
| App directory | `/var/www/Land-App` (git clone of `SystAIO/Land-App`) |
| Backend | `/var/www/Land-App/backend`, built with `npm ci && npm run build` |
| Runtime | Node 22 + PM2 process named `land-app` (port **3000**, blocked from the internet by `ufw`) |
| Database | PostgreSQL database `land_app`, role `landapp`, schema from `backend/db/schema.sql` |
| Secrets | `/var/www/Land-App/backend/.env` (mode 600) |
| nginx | `/etc/nginx/sites-available/land-app` → `server_name <duckdns-domain>` → `127.0.0.1:3000` |
| DuckDNS | `/etc/land-app/duckdns.env` + `/usr/local/bin/land-app-duckdns-update.sh`, cron every 5 min |
| Logs | `/var/log/land-app/` |

## 1. Create the DuckDNS domain (do this first)

1. Go to <https://www.duckdns.org> and sign in with Google / Reddit / GitHub.
2. Add the domain `estately` → full hostname `estately.duckdns.org`.
3. Copy the **token** shown on the page. It is a secret — treat it like a password.
4. Make sure port 80 is open on the server (the existing `pagalpagal` site already uses it, so it is).

The token cannot be created programmatically; this step needs your account.

## 2. Fill in the deployment config

On your local machine (or on the server), copy the template and edit it:

```bash
cp deploy/.env.example deploy.env
nano deploy.env
```

Required values:

- `LAND_DOMAIN` / `DUCKDNS_DOMAIN` — your DuckDNS hostname.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — the backend fails fast without them.
- `JWT_SECRET` — leave blank to auto-generate a strong 64-hex secret.
- `DB_PASSWORD` — leave blank to auto-generate a strong hex password.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the seeded dashboard admin.
- `MSG91_AUTHKEY`, `MSG91_TEMPLATE_ID` — optional, but **user OTP sign-in needs them**.
- `DUCKDNS_TOKEN` — the token from step 1. To deploy before you have a token, leave the
  placeholder `REPLACE_WITH_DUCKDNS_TOKEN` and run `configure-duckdns.sh` later.

## 3. Run the deployment

```bash
scp -i <ssh-key> deploy.env root@129.121.186.158:/tmp/land-app-deploy.env
ssh -i <ssh-key> root@129.121.186.158 \
  'git clone --depth 1 https://github.com/SystAIO/Land-App.git /tmp/land-app-setup && \
   sudo bash /tmp/land-app-setup/deploy/scripts/setup-server.sh /tmp/land-app-deploy.env'
```

`setup-server.sh` is idempotent: it can be re-run safely (schema is only applied once, the
admin password is refreshed, code is rebuilt, PM2/nginx are restarted).

If you skipped the DuckDNS token:

```bash
ssh -i <ssh-key> root@129.121.186.158 \
  'sudo bash /var/www/Land-App/deploy/scripts/configure-duckdns.sh systio-land <TOKEN>'
```

## 4. Point the mobile app at the backend

In `mobile/.env` (gitignored) set:

```dotenv
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_API_BASE_URL=http://estately.duckdns.org
```

`mobile/app.config.ts` already sets `android.usesCleartextTraffic: true`, which is required
for an `http://` API URL on Android. Restart Expo / rebuild the APK after changing this.

> User OTP login returns `503 SMS service is not configured` until `MSG91_*` are filled in
> and `setup-server.sh` is re-run. The seeded admin login works immediately.

## 5. Razorpay webhook

In the Razorpay dashboard set the webhook URL to:

```
http://estately.duckdns.org/payments/webhook
```

and copy the signing secret into `RAZORPAY_WEBHOOK_SECRET` in `deploy.env`, then re-run
`setup-server.sh`.

## 6. HTTPS (recommended, optional)

DuckDNS only updates DNS — it does not provide certificates. Once the hostname resolves:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo ufw allow 443/tcp
sudo certbot --nginx -d estately.duckdns.org
```

Then switch `EXPO_PUBLIC_API_BASE_URL` to `https://estately.duckdns.org`,
and update the Razorpay webhook URL to `https://...`.

## 7. Routine operations

```bash
# Deploy latest code
sudo bash /var/www/Land-App/deploy/scripts/update.sh

# Smoke test
sudo bash /var/www/Land-App/deploy/scripts/smoke.sh

# Load the APK's demo dataset (owners, 12 listings, 6 payments) into PostgreSQL.
# Safe to re-run; only its own rows are replaced. No app rebuild needed.
sudo bash /var/www/Land-App/deploy/scripts/seed-demo.sh

# Logs
pm2 logs land-app
tail -f /var/log/land-app/duckdns.log

# Backup the app database
sudo -u postgres pg_dump land_app | gzip > /root/backups/land_app-$(date +%F).sql.gz
```

## Troubleshooting

- `curl http://127.0.0.1:3000/health` on the server must return `{"ok":true,...}`.
- If DNS has not propagated, `dig +short estately.duckdns.org` should show `129.121.186.158`.
- `nginx -t` validates the site config; `systemctl reload nginx` applies it.
- `pm2 restart land-app` after changing `backend/.env`.
- Requests to the server IP still hit the existing `pagalpagal` app — that is expected.
  The Land-App backend is selected by the DuckDNS `Host` header.
