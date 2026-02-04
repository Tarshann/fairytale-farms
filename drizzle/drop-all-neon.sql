-- Run this in Neon SQL Editor to reset the database, then run: pnpm drizzle-kit push
-- Drop tables first (they reference enums)
DROP TABLE IF EXISTS "chatMessages" CASCADE;
DROP TABLE IF EXISTS "customOrderInquiries" CASCADE;
DROP TABLE IF EXISTS "wishlistItems" CASCADE;
DROP TABLE IF EXISTS "deliveryZones" CASCADE;
DROP TABLE IF EXISTS "promoCodes" CASCADE;
DROP TABLE IF EXISTS "photoUploads" CASCADE;
DROP TABLE IF EXISTS "contactSubmissions" CASCADE;
DROP TABLE IF EXISTS "orderItems" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "cartItems" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "loginCodes" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "chat_role" CASCADE;
DROP TYPE IF EXISTS "inquiry_status" CASCADE;
DROP TYPE IF EXISTS "discount_type" CASCADE;
DROP TYPE IF EXISTS "photo_upload_status" CASCADE;
DROP TYPE IF EXISTS "contact_status" CASCADE;
DROP TYPE IF EXISTS "delivery_type" CASCADE;
DROP TYPE IF EXISTS "order_status" CASCADE;
DROP TYPE IF EXISTS "product_type" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;
