-- 0010_subscriptions.sql
-- Adds optional subscription ("Bake Box") support to products.
-- Idempotent + additive: existing products default to non-subscription, so this
-- is safe to apply to a live database with zero behavior change until an admin
-- flags a product. Applied automatically by `pnpm db:push`; included here for
-- environments that apply SQL migrations directly.

DO $$ BEGIN
  CREATE TYPE "public"."subscription_interval" AS ENUM('week', 'month');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "isSubscription" boolean DEFAULT false NOT NULL;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "subscriptionInterval" "subscription_interval";
