# Railway – fairytale-farms

Use this checklist to fix crashes and run at **https://fairytalefarms.net**.

---

## 1. Fix the crash

The service often crashes when required env vars are missing or wrong. Set these in **Variables**:

| Variable | Value | Notes |
|----------|--------|--------|
| `NODE_ENV` | `production` | Required. |
| `DATABASE_URL` | `mysql://user:pass@host:port/db?ssl=true` | Your TiDB/MySQL URL. **Must be set** or DB calls fail. |
| `APP_ORIGIN` | `https://fairytalefarms.net` | Live site URL; used for Stripe checkout redirects. |
| `OAUTH_SERVER_URL` | `https://fairytalefarms.net` | **Not** `http://localhost:...`. Use your real public URL so login works. |
| `DEV_LOGIN_ENABLED` | `false` | Use `false` in production so real OAuth is used. |
| `JWT_SECRET` | (long random string) | e.g. `openssl rand -hex 32`. Required for sessions. |
| `VITE_APP_ID` | (your OAuth app id) | From your OAuth provider (e.g. Manus). **Option A (no login):** leave unset and leave `OAUTH_SERVER_URL` unset—site runs but no one can sign in. |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe live secret key. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe Dashboard → Webhooks → your endpoint → “Signing secret”. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publishable key (needed at **build** time; add in Railway so redeploys pick it up). |

If **DATABASE_URL** is empty or invalid, the app will crash when it touches the DB.

**Option A (no login):** To run without sign-in, **do not set** `OAUTH_SERVER_URL` or `VITE_APP_ID`. The app will start and the site will work for browsing and viewing products; checkout and account features that require login will not work until you add OAuth or email login later.

---

## 2. Custom domain (fairytalefarms.net)

1. In Railway: **fairytale-farms** service → **Settings** → **Networking** → **Custom Domain** → add `fairytalefarms.net` (and `www.fairytalefarms.net` if you want).
2. In your DNS: point `fairytalefarms.net` to the CNAME Railway shows (e.g. `xxx.up.railway.app`).
3. Set **OAUTH_SERVER_URL** to `https://fairytalefarms.net` and redeploy.

---

## 3. After deploy

- **Stripe:** Set webhook URL to `https://fairytalefarms.net/api/stripe/webhook` (or `https://<your-railway-url>/api/stripe/webhook` before the domain is live).
- **Database (Valentine’s flyer):** Run once with your production `DATABASE_URL`:
  ```bash
  DATABASE_URL="mysql://..." node update-valentines-pricing.mjs
  ```

---

## Option A: Run without login (no VITE_APP_ID)

1. In Railway **Variables**: remove **OAUTH_SERVER_URL** and **VITE_APP_ID** (or leave their values blank).
2. Set **DEV_LOGIN_ENABLED** = `false`.
3. Keep **NODE_ENV** = `production`, **DATABASE_URL** (valid), **JWT_SECRET** (any long random string). Add Stripe variables if you use payments.
4. **Redeploy.**

The app will start. Browsing and product pages work; cart/checkout/account need login and won't work until you add OAuth later.

---

## Quick fix for “Crashed” right now

1. **Option A (no login):** Leave **OAUTH_SERVER_URL** and **VITE_APP_ID** unset/removed. Otherwise set **OAUTH_SERVER_URL** = `https://fairytalefarms.net` (or your Railway URL).
2. Set **DEV_LOGIN_ENABLED** = `false`.
3. Ensure **DATABASE_URL** is a valid MySQL connection string (no placeholder).
4. Ensure **JWT_SECRET** is a real secret (not placeholder).
5. **Redeploy** (e.g. trigger a new deployment or push a commit).
