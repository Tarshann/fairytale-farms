# Fairytale Farms – Deployment options

Production site: **https://fairytalefarms.net**

With Manus out of tokens, you can run the app on **Vercel** (serverless), **Render**, **Railway**, or any host that runs Node or Docker. Set the same environment variables (and Stripe webhook URL) for whichever you use.

---

## Deploy for fairytalefarms.net

1. **Pick a platform** (e.g. Vercel, Render, or Railway — see options below).
2. **Connect this repo** and deploy (build: `pnpm build`, start: `node dist/index.js` for Node hosts).
3. **Add custom domain** in the platform dashboard: `fairytalefarms.net` (and `www.fairytalefarms.net` if desired). Point your domain’s DNS to the host’s instructions (usually a CNAME or A record).
4. **Set environment variables** (see table below). For the live site at fairytalefarms.net set:
   - `APP_ORIGIN` = `https://fairytalefarms.net` (used for Stripe success/cancel redirects when request origin is missing)
   - `OAUTH_SERVER_URL` = `https://fairytalefarms.net` (if using login)
   - Stripe webhook URL = `https://fairytalefarms.net/api/stripe/webhook`
5. **Update production database** (once, so BYO and tier pricing match the Valentine’s flyer):
   ```bash
   DATABASE_URL="mysql://..." node update-valentines-pricing.mjs
   ```
6. **Redeploy** after any code or env changes so fairytalefarms.net serves the latest build.

---

## Required environment variables

Set these in your platform’s dashboard (Secrets / Environment):

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | MySQL connection string (e.g. TiDB Cloud) |
| `APP_ORIGIN` | Recommended | Public app URL (e.g. `https://fairytalefarms.net`) for checkout redirects |
| `STRIPE_SECRET_KEY` | Yes (payments) | Stripe live secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes (payments) | Webhook signing secret (`whsec_...`) |
| `OAUTH_SERVER_URL` | For login | Your app’s public URL (e.g. `https://fairytalefarms.net`) so OAuth/login works |
| `JWT_SECRET` | For login | Secret for session cookies |
| `VITE_APP_ID` | For login | App ID from your OAuth provider (if used) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key (for checkout) |
| `ANTHROPIC_API_KEY` | Optional | For chatbot / AI features |

After deploying, **update Stripe**: Developers → Webhooks → your webhook → set URL to  
`https://<your-deployment-url>/api/stripe/webhook`.

---

## Option A: Vercel (serverless)

Already configured in this repo.

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Vercel will use `vercel.json`: build `pnpm build`, output `dist/public`, and run `api/index.ts` for `/api/*`.
3. Add the environment variables above in Vercel (Project → Settings → Environment Variables).  
   For the **client** (Stripe key shown in browser), add variables prefixed with `VITE_` so they are exposed at build time.
4. (Optional) Add a custom domain in Vercel and set `OAUTH_SERVER_URL` to that domain.
5. Redeploy. Set your Stripe webhook URL to `https://<your-vercel-url>/api/stripe/webhook`.

No code changes needed; `vercel.json` and `api/index.ts` are already in place.

---

## Option B: Render (single Node server)

1. Create a **Web Service** at [Render](https://render.com).
2. Connect your GitHub repo.
3. Use the **Blueprint** (recommended): ensure `render.yaml` is in the repo (see below). Render will create the service from it.
4. Or configure manually:
   - **Build command:** `pnpm install && pnpm build`
   - **Start command:** `node dist/index.js`
   - **Root directory:** (leave blank)
5. Add environment variables in the Render dashboard (see table above).
6. Set your Stripe webhook URL to `https://<your-render-url>/api/stripe/webhook`.

---

## Option C: Railway (Node or Docker)

**Using Node (no Docker):**

1. Create a project at [Railway](https://railway.app) and connect the repo.
2. Set **Build command:** `pnpm install && pnpm build`  
   **Start command:** `node dist/index.js`  
   (or leave empty and add a `nixpacks.toml` / rely on Railway’s Node detection.)
3. Add environment variables in Railway (Variables tab).
4. Deploy. Use the generated URL for Stripe webhook and `OAUTH_SERVER_URL`.

**Using Docker:**

1. Use the included `Dockerfile` (see below).
2. In Railway, create a service from the repo; select **Dockerfile** as the build method.
3. Add the same environment variables.
4. Deploy and set Stripe webhook and `OAUTH_SERVER_URL` to the Railway URL.

---

## Option D: Docker (any host)

Build and run locally or on any container host (Railway, Fly.io, your VPS):

```bash
docker build -t fairytale-farms .
docker run -p 3000:3000 --env-file .env fairytale-farms
```

Or set each variable with `-e` / your host’s env config. Ensure `NODE_ENV=production` and `DATABASE_URL` (and Stripe/OAuth vars as needed) are set.

---

## Summary

| Platform | Config file | How it runs |
|----------|-------------|-------------|
| Vercel | `vercel.json`, `api/index.ts` | Static from `dist/public`; `/api/*` via serverless function |
| Render | `render.yaml` (or manual) | One Node process: `node dist/index.js` serves API + static |
| Railway | Optional `Dockerfile` or build/start commands | Same as Render, or container from Dockerfile |
| Docker | `Dockerfile` | Single container: Node serves app and static files |

After switching from Manus, set `OAUTH_SERVER_URL` to your new app URL so login continues to work (or leave unset to run without login until you configure OAuth).
