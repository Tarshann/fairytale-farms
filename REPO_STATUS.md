# Fairytale Farms – Repo status & recent changes

**Last updated:** February 2025  

This document summarizes the **current state** of the repo and **recent changes** made in this round of work.

---

## Current state

### Stack
- **Frontend:** React (Vite), TypeScript, tRPC client, Tailwind, shadcn-style UI.
- **Backend:** Node, Express, tRPC, Drizzle ORM.
- **Database:** **PostgreSQL** (Neon). The app is **no longer MySQL**; schema and server use `pg` and `drizzle-orm/node-postgres`.
- **Payments:** Stripe (checkout sessions, webhooks).
- **Auth:** Optional OAuth + passwordless email codes; **guest checkout** is supported (no login required to add to cart or pay).

### Live site
- **Production URL:** **https://fairytalefarms.net** (custom domain; Manus dashboard shows it connected).
- **App URL for redirects / OAuth:** Set `APP_ORIGIN` and/or `OAUTH_SERVER_URL` to `https://fairytalefarms.net` in production.

### Database (Neon / Postgres)
- **Schema:** `drizzle/schema.ts` – PostgreSQL (pgTable, serial, pgEnum). All tables and enums live there.
- **Creating/updating tables:** Use `pnpm drizzle-kit push` against Neon (no MySQL migrations are used for Neon).
- **Connection:** `DATABASE_URL` must be a **PostgreSQL** connection string (e.g. from Neon dashboard; pooler URL is fine).
- **Resetting Neon:** If push fails with “type does not exist”, run `drizzle/drop-all-neon.sql` in Neon SQL Editor, then run `pnpm drizzle-kit push` again. See **NEON.md**.

### Scripts and tooling
- **Dev:** `pnpm dev` – runs with `NODE_ENV=development`, uses Vite (no pre-build needed). Requires `cross-env` (already in devDependencies if you use the updated script).
- **Build:** `pnpm build` – Vite client build + esbuild server bundle → `dist/`.
- **Start (prod):** `pnpm start` – runs `node dist/index.js`; expects built client in `dist/public` and `DATABASE_URL` set.
- **DB push (Neon):** `pnpm drizzle-kit push` – syncs `drizzle/schema.ts` to the database. **Not** `db:migrate` (that was for MySQL).
- **Seed/update scripts** (`seed-db.mjs`, `update-valentines-pricing.mjs`, `update-prices.mjs`, etc.) were written for **MySQL** and `mysql2`. They do **not** run against Neon as-is; they need to be adapted to Postgres or used only for migrating data from an old MySQL DB.

---

## Recent changes (summary)

### 1. Guest checkout (no login required)
- **Goal:** Customers can add to cart and complete Stripe checkout without signing in.
- **What changed:**
  - **ProductDetail, Products, BuildYourOwn, CustomPortraitPucks, BickeringBros:** Removed the “sign in to add to cart” check and redirect. Guests (and logged-in users) can add to cart.
  - **Server:** Already supported guest sessions (context creates a guest user and cookie). Cart and `orders.createCheckout` use `sessionProcedure`, which allows guests. No backend change required.
- **Result:** Visitors get a guest session automatically; they can add items, open cart, and go to Stripe checkout. Email/payment are collected in Stripe.

### 2. Live site = fairytalefarms.net
- **Goal:** Treat **fairytalefarms.net** as the canonical production URL for redirects and config.
- **What changed:**
  - **`server/_core/env.ts`:** Added `appOrigin` (from `APP_ORIGIN` or `OAUTH_SERVER_URL`). Used when the request doesn’t send an `Origin` header.
  - **`server/routers.ts`:** Both Stripe checkout flows use `ctx.req.headers.origin || ENV.appOrigin || "http://localhost:3000"` for success/cancel URLs.
  - **`vite.config.ts`:** `allowedHosts` includes `fairytalefarms.net` and `www.fairytalefarms.net`.
  - **`.env.example`:** Documented live site and `APP_ORIGIN` / `OAUTH_SERVER_URL` for production.
  - **DEPLOYMENT.md, RAILWAY.md:** Added `APP_ORIGIN`, and instructions to set it (and Stripe webhook) to `https://fairytalefarms.net`.
- **Result:** When deployed at fairytalefarms.net, set `APP_ORIGIN=https://fairytalefarms.net` (and optionally `OAUTH_SERVER_URL`). Stripe redirects and OAuth use that URL when needed.

### 3. Category visibility (Classic Cookies & Mini Tin Cakes)
- **Goal:** Hide “Classic Cookies” and “Mini Tin Cakes” from the storefront while keeping them toggleable in admin.
- **What changed:**
  - **Schema:** Added `visible` (boolean, default true) to `categories`. In the **Postgres** schema this is already present.
  - **DB layer:** `getAllCategories()` returns only visible categories. `getAllCategoriesAdmin()` returns all. `getCategoryById()`, `setCategoryVisible(id, visible)`. `getAllProducts()` and `getFeaturedProducts()` only include products in visible categories. `products.listByCategory` returns `[]` if the category is hidden.
  - **API:** `categories.list` (public), `categories.listAdmin` (admin), `categories.setVisible` (admin).
  - **Admin:** **Settings** → new **“Category visibility”** block: list of categories with a toggle to show/hide on the storefront.
  - **Home:** “Order Cookies & Brownies” now links to `/products` instead of `/products?category=classic-cookies`.
- **Result:** Classic Cookies and Mini Tin Cakes can be hidden by default (or toggled off in Settings). Admins can turn them back on anytime. After moving to Postgres, “hidden by default” for those two is done via a one-time data fix or seed if needed (the old MySQL migration 0007 that set them hidden is not used on Neon).

### 4. Migration from MySQL to PostgreSQL (Neon)
- **Goal:** Run the app on **Neon** (PostgreSQL) instead of MySQL/TiDB.
- **What changed:**
  - **`drizzle/schema.ts`:** Replaced MySQL definitions with **PostgreSQL**: `pgTable`, `serial`, `integer`, `pgEnum` for all enums, same table/column names.
  - **`server/db.ts`:** Uses `drizzle-orm/node-postgres` and `pg` `Pool`. All inserts that need the new ID use `.returning({ id: ... })`. User upsert uses `.onConflictDoUpdate()` instead of MySQL’s `onDuplicateKeyUpdate`.
  - **`drizzle.config.ts`:** `dialect: "postgresql"`.
  - **Dependencies:** Removed `mysql2`; added `pg` and `@types/pg`.
  - **NEON.md:** Step-by-step: create Neon project, set `DATABASE_URL`, run `drizzle-kit push`, optional seed/data migration, run app. Also: how to reset the DB with `drizzle/drop-all-neon.sql` if push fails (e.g. “type chat_role does not exist”).
  - **`drizzle/drop-all-neon.sql`:** Script to drop all app tables and enums in Neon so a clean `drizzle-kit push` can be run.
- **Result:** App and Drizzle are **Postgres-only**. Use a Neon (or any Postgres) `DATABASE_URL`, run `pnpm drizzle-kit push` to create/update tables. Old MySQL migrations in `drizzle/*.sql` are **not** used for Neon.

### 5. Dev server and SSL warning
- **Dev:** `package.json` dev script updated to `cross-env NODE_ENV=development tsx watch ...` so that `pnpm dev` runs in development mode, uses Vite, and doesn’t require a pre-built client (no “Could not find the build directory” when not built).
- **SSL:** The warning from `drizzle-kit push` about `sslmode=require` is from the `pg` driver; safe to ignore or adjust `DATABASE_URL` as suggested in the message.

---

## File-level reference

| Area | Files touched |
|------|----------------|
| **Guest checkout** | `client/src/pages/ProductDetail.tsx`, `Products.tsx`, `BuildYourOwn.tsx`, `CustomPortraitPucks.tsx`, `BickeringBros.tsx` |
| **fairytalefarms.net** | `server/_core/env.ts`, `server/routers.ts`, `vite.config.ts`, `.env.example`, `DEPLOYMENT.md`, `RAILWAY.md` |
| **Category visibility** | `drizzle/schema.ts` (visible on categories), `server/db.ts`, `server/routers.ts`, `client/src/pages/admin/AdminSettings.tsx`, `client/src/pages/Home.tsx` |
| **Neon / Postgres** | `drizzle/schema.ts` (full rewrite to pg), `server/db.ts`, `drizzle.config.ts`, `package.json`, `NEON.md`, `drizzle/drop-all-neon.sql` |
| **Dev script** | `package.json` (`dev` script with `cross-env NODE_ENV=development`) |

---

## What to do next (checklist)

- [ ] **Neon:** If you haven’t already, run `drizzle/drop-all-neon.sql` in Neon SQL Editor, then `pnpm drizzle-kit push`.
- [ ] **Env:** In production, set `APP_ORIGIN=https://fairytalefarms.net` (and `OAUTH_SERVER_URL` if you use login).
- [ ] **Stripe:** Webhook URL set to `https://fairytalefarms.net/api/stripe/webhook`.
- [ ] **Seed data:** If Neon is empty, add categories/products via a Postgres-capable seed or manual SQL (existing `.mjs` seed/update scripts are MySQL-only).
- [ ] **Deploy:** Build and start with `pnpm build` and `node dist/index.js`; point fairytalefarms.net at that deployment.

For more detail on Neon, see **NEON.md**. For deployment, see **DEPLOYMENT.md** and **RAILWAY.md**.
