# Operations Features — Activation Guide

This guide covers features whose **code is complete and shipping**, but which
stay **dormant** until you provide credentials or flip a flag. Nothing here
changes customer behavior until you act.

---

## 1. SMS notifications (Twilio)

**What it does:** texts the owner on every new order, texts customers an order
confirmation and a status update (preparing / ready / cancelled). SMS is a
**no-op** unless Twilio is configured — email is unaffected either way.

**Activate:**

1. Create a Twilio account, buy a number (or set up a Messaging Service).
2. Set these env vars (Railway / Vercel):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` — your Twilio number in E.164 (`+16155551234`) **or** a
     Messaging Service SID (`MG...`)
   - `ADMIN_SMS_TO` — comma-separated owner number(s) for new-order alerts
3. Redeploy. Customer SMS requires a phone number; Stripe Checkout now collects
   one automatically (`phone_number_collection`).

---

## 2. Static asset CDN

**What it does:** serves product images (`/images/*`) from a CDN edge.

**Activate:**

1. Put a CDN (e.g. CloudFront) in front of the deployed origin.
2. Set both:
   - `ASSET_CDN_URL` (server) and `VITE_ASSET_CDN_URL` (client, baked in at build)
     to the CDN base URL (e.g. `https://dxxxx.cloudfront.net`).
3. Rebuild + redeploy. When unset, images serve from the app origin (unchanged).

Static build assets (JS/CSS) already ship with `1y immutable` cache headers.

---

## 3. Subscriptions ("Bake Box")

**What it does:** lets a product be sold as a recurring subscription (weekly or
monthly) via Stripe. A "Subscribe" button appears on a product page **only**
when an admin flags that product. Every paid invoice (first charge + renewals)
is recorded as an order, with the same email/SMS notifications.

**Status:** code complete and isolated from the one-time checkout path. Because
it bills real cards on a schedule, **validate against Stripe test mode before
enabling.**

**Activate:**

1. Apply the schema change: `pnpm db:push` (adds `products.isSubscription` +
   `products.subscriptionInterval`; see `drizzle/0010_subscriptions.sql`).
2. In the Stripe Dashboard, ensure the `invoice.paid` and
   `checkout.session.completed` events are sent to your webhook endpoint.
3. Flag a product as a subscription (admin Products: `isSubscription = true`,
   `subscriptionInterval = "week" | "month"`).
4. **Test in Stripe test mode:** subscribe, confirm the first order is recorded,
   then use Stripe's "advance clock" / test renewals to confirm renewal orders
   record correctly.
5. Go live.

**Known follow-ups (not built):** customer self-service cancellation/management
should use the Stripe Customer Portal; surface a "Manage subscription" link once
enabled.

---

## Already live (no action needed)

- **Order confirmation + admin email** on every order (webhook → Resend/SMTP).
- **Order status emails** (preparing / ready / cancelled) from the admin order view.
- **Abandoned-cart recovery email** + **review-request email** (cron jobs).
- **Product search** (catalog search bar) and **public reviews/ratings**.
- **Homepage testimonials** — auto-populated from published reviews, with a
  curated fallback until enough real reviews exist.
- **Low-stock**: accurate "Only N remaining" / "Sold out" on product cards, plus
  admin low-stock alerts (AI panel).
