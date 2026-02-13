-- Add siteSettings table for admin-controlled toggles (e.g. checkout enabled/disabled)
CREATE TABLE IF NOT EXISTS "siteSettings" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Disable checkout by default (the whole point of this migration)
INSERT INTO "siteSettings" ("key", "value", "updatedAt")
VALUES ('checkout_enabled', 'false', now())
ON CONFLICT ("key") DO UPDATE SET "value" = 'false', "updatedAt" = now();
