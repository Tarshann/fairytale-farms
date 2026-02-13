import {
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  integer,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";

// Enums (PostgreSQL native enums)
const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
const productTypeEnum = pgEnum("product_type", [
  "standard",
  "tier",
  "build_your_own_item",
  "custom_portrait",
]);
const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "completed",
  "cancelled",
]);
const deliveryTypeEnum = pgEnum("delivery_type", ["same_day", "scheduled"]);
const contactStatusEnum = pgEnum("contact_status", ["new", "read", "replied"]);
const photoUploadStatusEnum = pgEnum("photo_upload_status", [
  "pending_review",
  "approved",
  "rejected",
]);
const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
]);
const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "quoted",
  "confirmed",
  "completed",
  "cancelled",
]);
const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * One-time login codes for passwordless sign-in
 */
export const loginCodes = pgTable("loginCodes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("loginCodes_email_idx").on(table.email),
]);

export type LoginCode = typeof loginCodes.$inferSelect;
export type InsertLoginCode = typeof loginCodes.$inferInsert;

/**
 * Product categories for the bakery
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  /** When false, category is hidden from storefront. Toggle in Admin Settings. */
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products table for bakery items
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  isCustomizable: boolean("isCustomizable").default(false).notNull(),
  customizationInstructions: text("customizationInstructions"),
  inStock: boolean("inStock").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  inventoryCap: integer("inventoryCap"),
  inventorySold: integer("inventorySold").default(0).notNull(),
  availableFrom: timestamp("availableFrom"),
  availableUntil: timestamp("availableUntil"),
  requiresPhotoUpload: boolean("requiresPhotoUpload").default(false).notNull(),
  requiresDeposit: boolean("requiresDeposit").default(false).notNull(),
  depositPercentage: integer("depositPercentage").default(50),
  productType: productTypeEnum("productType").default("standard").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("products_categoryId_idx").on(table.categoryId),
  index("products_featured_idx").on(table.featured),
  index("products_inStock_idx").on(table.inStock),
]);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Shopping cart items (persistent across sessions)
 */
export const cartItems = pgTable("cartItems", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  customizationNotes: text("customizationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("cartItems_userId_idx").on(table.userId),
  uniqueIndex("cartItems_userId_productId_idx").on(table.userId, table.productId),
]);

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Customer orders
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: orderStatusEnum("status").default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  deliveryAddress: text("deliveryAddress"),
  deliveryZipCode: varchar("deliveryZipCode", { length: 10 }),
  deliveryNotes: text("deliveryNotes"),
  scheduledDeliveryDate: timestamp("scheduledDeliveryDate"),
  deliveryType: deliveryTypeEnum("deliveryType").default("same_day"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripePaymentStatus: varchar("stripePaymentStatus", { length: 50 }),
  depositPaid: boolean("depositPaid").default(false).notNull(),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  remainingAmount: decimal("remainingAmount", { precision: 10, scale: 2 }),
  remainingCharged: boolean("remainingCharged").default(false).notNull(),
  promoCode: varchar("promoCode", { length: 50 }),
  discountAmount: decimal("discountAmount", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("orders_userId_idx").on(table.userId),
  index("orders_customerEmail_idx").on(table.customerEmail),
  index("orders_status_idx").on(table.status),
  index("orders_stripePaymentIntentId_idx").on(table.stripePaymentIntentId),
]);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order line items
 */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  customizationNotes: text("customizationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("orderItems_orderId_idx").on(table.orderId),
]);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = pgTable("contactSubmissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  status: contactStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Photo uploads for custom portrait pucks
 */
export const photoUploads = pgTable("photoUploads", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  userId: integer("userId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  status: photoUploadStatusEnum("status").default("pending_review").notNull(),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("photoUploads_orderId_idx").on(table.orderId),
  index("photoUploads_userId_idx").on(table.userId),
]);

export type PhotoUpload = typeof photoUploads.$inferSelect;
export type InsertPhotoUpload = typeof photoUploads.$inferInsert;

/**
 * Promo codes for discounts
 */
export const promoCodes = pgTable("promoCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: decimal("discountValue", {
    precision: 10,
    scale: 2,
  }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").default(0).notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  applicableProductTypes: text("applicableProductTypes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

/**
 * Delivery zones for ZIP code validation
 */
export const deliveryZones = pgTable("deliveryZones", {
  id: serial("id").primaryKey(),
  zipCode: varchar("zipCode", { length: 10 }).notNull().unique(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = typeof deliveryZones.$inferInsert;

/**
 * Wishlist/Favorites for users to save products
 */
export const wishlistItems = pgTable("wishlistItems", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("wishlistItems_userId_idx").on(table.userId),
]);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;

/**
 * Custom order inquiries from AI chatbot
 */
export const customOrderInquiries = pgTable("customOrderInquiries", {
  id: serial("id").primaryKey(),
  inquiryNumber: varchar("inquiryNumber", { length: 50 }).notNull().unique(),
  customerName: varchar("customerName", { length: 200 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  eventDate: timestamp("eventDate"),
  eventType: varchar("eventType", { length: 100 }),
  quantity: text("quantity"),
  flavorPreferences: text("flavorPreferences"),
  designTheme: text("designTheme"),
  budgetRange: varchar("budgetRange", { length: 100 }),
  estimatedPrice: varchar("estimatedPrice", { length: 50 }),
  estimateDetails: text("estimateDetails"),
  additionalNotes: text("additionalNotes"),
  imageAttachments: text("imageAttachments"),
  status: inquiryStatusEnum("status").default("new").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CustomOrderInquiry = typeof customOrderInquiries.$inferSelect;
export type InsertCustomOrderInquiry = typeof customOrderInquiries.$inferInsert;

/**
 * Chat messages for conversation history
 */
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  inquiryId: integer("inquiryId"),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("chatMessages_sessionId_idx").on(table.sessionId),
]);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Site-wide settings (key-value store for admin-controlled toggles)
 */
export const siteSettings = pgTable("siteSettings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
