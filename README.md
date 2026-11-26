# SystIO Land

A premium property marketplace for India (plots, homes and farm land) built with React Native/Expo — OTP auth, owner/broker listings, map pinning with plot boundaries, Supabase PostgreSQL, Razorpay listing fees, and an in-app admin dashboard.

---

## Demo Mode (Default)

The app works immediately in Expo Go without any backend setup.

- **OTP:** `123456`
- **Demo admin:** `admin@systio.land` / `Admin@123`
- **Demo profile:** Sign up with any phone, choose **owner** or **broker**.
- **First listing:** Free (one-time, never resets even if deleted).
- **Subsequent listings:** ₹100 via Razorpay (demo simulates payment).
- **All data stored in AsyncStorage** (demo mode) or Supabase (real mode).

Switch to real mode by setting environment variables (see below).

---

## Real Mode Setup

To use Supabase, Razorpay, and real OTP, configure the following environment variables in your Expo project:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_DEMO_MODE` | Set to `false` to enable real mode |
| `RAZORPAY_KEY_ID` | Razorpay key ID (e.g., `rzp_test_XXX`) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret for HMAC verification |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `EXPO_PUBLIC_API_BASE_URL` | Base URL of the Node/Express backend (e.g. `http://10.0.2.2:3000` on AVD) |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API key (Android + iOS) |

### Backend (Node/Express)

1. Configure the backend `.env` (`cd backend`, copy `.env.example`).
2. Point `DATABASE_URL` at the Supabase Postgres **pooler** (IPv4, port 6543) — direct hosts are IPv6-only on some projects.
3. Start it: `npm run backend` from the repo root, or `node server.js` inside `backend/`. Health check at `/health`.

### Database (Supabase Postgres)

1. Run `backend/db/schema.sql` in the SQL editor to create tables.
2. Run `backend/db/seed.sql` to create the admin account (`admin@systio.land` / `Admin@123`).
3. If resetting everything, run `backend/db/reset.sql` first (wipes all app data).

### Production deployment (self-hosted PostgreSQL + DuckDNS)

A separate, plain-script deployment setup lives in [`deploy/`](deploy/README.md). It installs the
backend on an Ubuntu server with its own PostgreSQL database, PM2 process and nginx site, and keeps
the mobile app pointed at a DuckDNS hostname. Follow `deploy/README.md` for the server commands,
DuckDNS domain/token setup and the mobile `EXPO_PUBLIC_API_BASE_URL` value.

### Razorpay

1. Create a Razorpay account and obtain the Key ID and Key Secret.
2. Put them in `backend/.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
3. Set the webhook URL in Razorpay to `https://YOUR-DOMAIN/payments/webhook` and paste the signing secret into `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`.

### Google Maps

Add `EXPO_PUBLIC_GOOGLE_MAPS_KEY` to your `.env` or Expo config. The key is used in `PropertyMap` component for pinning and boundary rendering.

### EAS Build

Build Android APK/AAB:

```bash
eas build -p android --profile production
```

Or for a debug build:

```bash
eas build -p android --profile development
```

The first build may take 5–10 minutes. Subsequent builds use caching.

---

## Project Structure

```
F:.
├─ backend/             # Node/Express backend API
│  ├─ src/              # Source: routes, middleware, db, utils, config
│  │  ├─ config/        # Env validation + constants
│  │  ├─ db/            # pg pool + transaction helper
│  │  ├─ middleware/    # JWT auth + rate limiters
│  │  ├─ routes/        # auth, listings, favorites, payments, admin
│  │  ├─ utils/         # crypto, mappers, validators, asyncHandler
│  │  ├─ app.js         # Express wiring (helmet, CORS, webhook, routes)
│  │  └─ server.js      # Boot: DB check + listen
│  ├─ db/               # schema.sql, seed.sql, reset.sql
│  └─ server.js         # Backwards-compatible entry → src/server.js
└─ mobile/              # Expo React Native app
   ├─ src/              # Source code
   ├─ app.config.ts     # Expo config (permissions, Maps key, plugins)
   └─ eas.json          # EAS build configuration
```

---

## Key Flows

### User Onboarding

1. **Welcome** → Phone entry → OTP verification (demo: `123456`, real: MSG91 SMS OTP via the backend).
2. **Role setup** — choose **owner**, **broker** or **browse**. Browsers can explore and save listings but cannot publish; they can switch to owner/broker any time from their profile.
3. **First listing** is free; `profiles.free_listing_used` is set to `true` one-time only.
4. **Subsequent listings** trigger Razorpay checkout (₹100).

### Listing Flow

```
draft → free/paid → pending → admin approved/declined
```

- Owner/broker creates a property draft (heading, details, 4+ photos, area unit, map pin, landmarks, optional YouTube link).
- On submit, if `free_listing_used` is false → status becomes `pending`, flag becomes true.
- If already used → Razorpay checkout opens; on success → status `pending`.
- **Admin** reviews in the dashboard: approve → `approved`, decline → `declined` (with note).
- Owner can **edit and resubmit** a declined property.

### Payment Flow

- `startListingCheckout(propertyId)` → backend returns mode: `free` / `demo` / `razorpay`.
- `verifyListingPayment({propertyId, orderId, paymentId, signature})` → backend `POST /payments/verify` (HMAC-SHA256 signature check) → listing flagged `pending`.
- `POST /payments/webhook` (raw body, `x-razorpay-signature` verified) reconciles `payment.captured` / `payment.failed`.

### Admin Dashboard

- **Overview:** Revenue cards, stats, filtered payment list.
- **Approvals:** Pending listings with checklist; approve/decline with required note.
- **Users:** List all users, roles, free listing status.
- **Payments:** Revenue overview, per-payment rows with property links, expandable details.
- **Listings:** All properties with status badges, approve/decline actions.

---

## Development Notes

- `npx tsc --noEmit` passes after all changes.
- Backend boots fail-fast on missing `DATABASE_URL`/`JWT_SECRET`/Razorpay keys.
- Database schema and seed are plain SQL in `backend/db/` — run them in the Supabase SQL editor.
- Photos go to Cloudinary via an unsigned upload preset; if the env vars are absent, demo mode still works (local mock).
- Real uploads require `expo-image-picker` with `base64: true`.
- Avoid `StyleSheet.absoluteFillObject` in new admin UI (prior RN/TS compatibility issue).

---

## License

Proprietary — SystIO Land 2026.
# Land-App
