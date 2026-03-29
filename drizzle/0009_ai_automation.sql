CREATE TYPE "public"."abandoned_cart_status" AS ENUM('pending', 'recovered', 'lost');
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'approved', 'published', 'rejected');
CREATE TYPE "public"."pricing_recommendation_status" AS ENUM('pending', 'applied', 'rejected');
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected');

CREATE TABLE IF NOT EXISTS "abandonedCarts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"userEmail" varchar(320) NOT NULL,
	"cartContents" text NOT NULL,
	"status" "abandoned_cart_status" DEFAULT 'pending' NOT NULL,
	"recoveryEmailSentAt" timestamp,
	"recoveredOrderId" integer,
	"lastActiveAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lowStockAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"currentStock" integer NOT NULL,
	"forecastedDemand" integer,
	"resolved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "marketingCampaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"caption" text NOT NULL,
	"suggestedImagePrompt" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduledFor" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pricingRecommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"currentPrice" numeric(10, 2) NOT NULL,
	"suggestedPrice" numeric(10, 2) NOT NULL,
	"reasoning" text NOT NULL,
	"status" "pricing_recommendation_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"comment" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"aiSentimentScore" numeric(3, 2),
	"aiFlagged" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "abandonedCarts_userId_idx" ON "abandonedCarts" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "abandonedCarts_status_idx" ON "abandonedCarts" USING btree ("status");
CREATE INDEX IF NOT EXISTS "lowStockAlerts_productId_idx" ON "lowStockAlerts" USING btree ("productId");
CREATE INDEX IF NOT EXISTS "lowStockAlerts_resolved_idx" ON "lowStockAlerts" USING btree ("resolved");
CREATE INDEX IF NOT EXISTS "pricingRecommendations_productId_idx" ON "pricingRecommendations" USING btree ("productId");
CREATE INDEX IF NOT EXISTS "pricingRecommendations_status_idx" ON "pricingRecommendations" USING btree ("status");
CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews" USING btree ("productId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews" USING btree ("status");

-- Add admin note and review request tracking to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "adminNote" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reviewRequestSentAt" timestamp;
