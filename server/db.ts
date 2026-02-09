import { eq, ne, desc, and, sql, isNull, gt, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  loginCodes,
  InsertLoginCode,
  categories,
  Category,
  InsertCategory,
  products,
  Product,
  InsertProduct,
  cartItems,
  CartItem,
  InsertCartItem,
  orders,
  Order,
  InsertOrder,
  orderItems,
  OrderItem,
  InsertOrderItem,
  contactSubmissions,
  ContactSubmission,
  InsertContactSubmission,
  photoUploads,
  PhotoUpload,
  InsertPhotoUpload,
  wishlistItems,
  WishlistItem,
  InsertWishlistItem,
  promoCodes,
  PromoCode,
  deliveryZones,
  DeliveryZone,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;
// Normalize all admin emails: trim and lowercase to ensure consistency
// (DEFAULT_ADMIN_EMAILS may not be normalized, while parseAdminEmails() results are)
const ADMIN_EMAILS = ENV.adminEmails
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase().trim()
  );
};

// Lazily create the drizzle instance (Neon/Postgres) so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else {
      const normalizedEmail =
        typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
      const isOwner =
        (user.openId && user.openId === ENV.ownerOpenId) ||
        (ENV.ownerEmail && normalizedEmail === ENV.ownerEmail) ||
        isAdminEmail(normalizedEmail);

      if (isOwner) {
        values.role = "admin";
        updateSet.role = "admin";
      }
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet as Record<string, unknown>,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= LOGIN CODE OPERATIONS =============

export async function createLoginCode(code: InsertLoginCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(loginCodes)
    .values(code)
    .returning({ id: loginCodes.id });
  return result[0]?.id ?? 0;
}

export async function getLatestActiveLoginCode(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(loginCodes)
    .where(
      and(
        eq(loginCodes.email, normalizedEmail),
        isNull(loginCodes.usedAt),
        gt(loginCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);

  return result[0];
}

export async function markLoginCodeUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(loginCodes)
    .set({ usedAt: new Date() })
    .where(eq(loginCodes.id, id));
}

// --- Passwordless login + guest order attach ---

export async function createPasswordlessLoginCode(input: {
  email: string;
  codeHash: string;
  expiresAt: Date;
  ip: string;
  userAgent: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create login code: database not available");
    return;
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  await db
    .update(loginCodes)
    .set({ usedAt: new Date() })
    .where(
      and(eq(loginCodes.email, normalizedEmail), isNull(loginCodes.usedAt))
    );

  await db.insert(loginCodes).values({
    email: normalizedEmail,
    codeHash: input.codeHash,
    expiresAt: input.expiresAt,
  });
}

export async function consumePasswordlessLoginCode(input: {
  email: string;
  codeHash: string;
}): Promise<null | { codeHash: string; expiresAt: Date }> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot consume login code: database not available"
    );
    return null;
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date();

  return db.transaction(async tx => {
    const result = await tx
      .select({
        id: loginCodes.id,
        codeHash: loginCodes.codeHash,
        expiresAt: loginCodes.expiresAt,
      })
      .from(loginCodes)
      .where(
        and(
          eq(loginCodes.email, normalizedEmail),
          eq(loginCodes.codeHash, input.codeHash),
          isNull(loginCodes.usedAt),
          gt(loginCodes.expiresAt, now)
        )
      )
      .orderBy(desc(loginCodes.createdAt))
      .limit(1);

    const record = result[0];
    if (!record) return null;

    await tx
      .update(loginCodes)
      .set({ usedAt: now })
      .where(eq(loginCodes.id, record.id));

    return { codeHash: record.codeHash, expiresAt: record.expiresAt };
  });
}

export async function attachGuestOrdersByEmail(input: {
  email: string;
  openId: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot attach guest orders: database not available"
    );
    return;
  }

  const accountUser = await getUserByOpenId(input.openId);
  if (!accountUser) {
    console.warn("[Database] Cannot attach guest orders: user not found");
    return;
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  // Use a subquery to find guest user IDs instead of loading all guest users into memory
  await db
    .update(orders)
    .set({ userId: accountUser.id })
    .where(
      and(
        eq(orders.customerEmail, normalizedEmail),
        or(
          isNull(orders.userId),
          sql`${orders.userId} IN (SELECT id FROM users WHERE "loginMethod" = 'guest' AND id != ${accountUser.id})`
        )
      )
    );
}

// ============= CATEGORY OPERATIONS =============

/** All categories (for storefront) – only visible ones. */
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .where(eq(categories.visible, true))
    .orderBy(categories.displayOrder, categories.name);
}

/** All categories including hidden (for admin). */
export async function getAllCategoriesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .orderBy(categories.displayOrder, categories.name);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return result[0];
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return result[0];
}

export async function setCategoryVisible(id: number, visible: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(categories)
    .set({ visible, updatedAt: new Date() })
    .where(eq(categories.id, id));
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(categories)
    .values(category)
    .returning({ id: categories.id });
  return result[0]?.id ?? 0;
}

// ============= PRODUCT OPERATIONS =============

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  const visibleCategoryIds = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.visible, true));
  const ids = visibleCategoryIds.map((r) => r.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(
      and(
        inArray(products.categoryId, ids),
        eq(products.inStock, true),
        ne(products.productType, "build_your_own_item")
      )
    )
    .orderBy(products.displayOrder, products.name);
}

// Get all products including out-of-stock (for admin)
export async function getAllProductsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .orderBy(products.displayOrder, products.name);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.inStock, true)))
    .orderBy(products.displayOrder, products.name);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result[0];
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return result[0];
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  const visibleCategoryIds = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.visible, true));
  const ids = visibleCategoryIds.map((r) => r.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(
      and(eq(products.featured, true), inArray(products.categoryId, ids))
    )
    .orderBy(products.displayOrder)
    .limit(6);
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(products)
    .values(product)
    .returning({ id: products.id });
  return result[0]?.id ?? 0;
}

export async function updateProduct(
  id: number,
  updates: Partial<InsertProduct>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(updates).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ============= CART OPERATIONS =============

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      customizationNotes: cartItems.customizationNotes,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      product: products,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));

  return items;
}

export async function addToCart(item: InsertCartItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Atomic upsert: insert or increment quantity on conflict
  const result = await db
    .insert(cartItems)
    .values(item)
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: {
        quantity: sql`${cartItems.quantity} + ${item.quantity || 1}`,
        customizationNotes: item.customizationNotes ?? sql`${cartItems.customizationNotes}`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: cartItems.id });
  return result[0]?.id ?? 0;
}

export async function getCartItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, id))
    .limit(1);
  return result[0];
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function removeFromCart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.id, id));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function transferCartItems(fromUserId: number, toUserId: number) {
  if (fromUserId === toUserId) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, fromUserId));

  if (!items.length) return;

  await db.delete(cartItems).where(eq(cartItems.userId, fromUserId));

  await db.insert(cartItems).values(
    items.map(item => ({
      userId: toUserId,
      productId: item.productId,
      quantity: item.quantity,
      customizationNotes: item.customizationNotes ?? undefined,
    }))
  );
}

// ============= ORDER OPERATIONS =============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(orders)
    .values(order)
    .returning({ id: orders.id });
  return result[0]?.id ?? 0;
}

export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(orderItems)
    .values(item)
    .returning({ id: orderItems.id });
  return result[0]?.id ?? 0;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return result[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return result[0];
}

export async function getOrderByPaymentIntentId(paymentIntentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  return result[0];
}

/** Batch-load order items for a list of orders (avoids N+1). */
async function batchLoadOrderItems(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  orderIds: number[]
) {
  if (orderIds.length === 0) return new Map<number, OrderItem[]>();
  const allItems = await database
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));
  const itemsByOrder = new Map<number, OrderItem[]>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  return itemsByOrder;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const ordersList = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const itemsByOrder = await batchLoadOrderItems(
    db,
    ordersList.map(o => o.id)
  );
  return ordersList.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));
}

export async function getOrdersForAccount(
  userId: number,
  email?: string | null
) {
  const db = await getDb();
  if (!db) return [];

  const normalizedEmail = email?.trim().toLowerCase();
  const whereClause = normalizedEmail
    ? or(eq(orders.userId, userId), eq(orders.customerEmail, normalizedEmail))
    : eq(orders.userId, userId);

  const ordersList = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt));

  const itemsByOrder = await batchLoadOrderItems(
    db,
    ordersList.map(o => o.id)
  );
  return ordersList.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  const ordersList = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const orderIds = ordersList.map(o => o.id);
  const userIds = [...new Set(ordersList.map(o => o.userId))];

  // Batch load items and users in parallel (2 queries instead of 2N)
  const [itemsByOrder, usersList] = await Promise.all([
    batchLoadOrderItems(db, orderIds),
    userIds.length > 0
      ? db.select().from(users).where(inArray(users.id, userIds))
      : Promise.resolve([]),
  ]);

  const usersById = new Map(usersList.map(u => [u.id, u]));

  return ordersList.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    user: usersById.get(order.userId),
  }));
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function updateOrderPayment(
  id: number,
  paymentIntentId: string,
  paymentStatus: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(orders)
    .set({
      stripePaymentIntentId: paymentIntentId,
      stripePaymentStatus: paymentStatus,
    })
    .where(eq(orders.id, id));
}

// ============= CONTACT OPERATIONS =============

export async function createContactSubmission(
  submission: InsertContactSubmission
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(contactSubmissions)
    .values(submission)
    .returning({ id: contactSubmissions.id });
  return result[0]?.id ?? 0;
}

export async function getAllContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt));
}

export async function updateContactSubmissionStatus(
  id: number,
  status: "new" | "read" | "replied"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(contactSubmissions)
    .set({ status })
    .where(eq(contactSubmissions.id, id));
}

// ============= PHOTO UPLOAD OPERATIONS =============

export async function createPhotoUpload(
  upload: InsertPhotoUpload
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(photoUploads)
    .values(upload)
    .returning({ id: photoUploads.id });
  return result[0]?.id ?? 0;
}

export async function getPhotoUploadsByOrder(
  orderId: number
): Promise<PhotoUpload[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(photoUploads)
    .where(eq(photoUploads.orderId, orderId));
}

export async function getPendingPhotoUploads(): Promise<PhotoUpload[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(photoUploads)
    .where(eq(photoUploads.status, "pending_review"));
}

export async function updatePhotoUploadStatus(
  id: number,
  status: "pending_review" | "approved" | "rejected",
  reviewNotes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(photoUploads)
    .set({ status, reviewNotes, updatedAt: new Date() })
    .where(eq(photoUploads.id, id));
}

// ============= PROMO CODE OPERATIONS =============

export async function getPromoCodeByCode(
  code: string
): Promise<PromoCode | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  return result;
}

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  promoCode?: PromoCode;
  reason?: string;
}> {
  const promoCode = await getPromoCodeByCode(code);

  if (!promoCode) {
    return { valid: false, reason: "Promo code not found" };
  }

  if (!promoCode.isActive) {
    return { valid: false, reason: "Promo code is no longer active" };
  }

  const now = new Date();
  if (promoCode.validFrom && now < promoCode.validFrom) {
    return { valid: false, reason: "Promo code is not yet valid" };
  }

  if (promoCode.validUntil && now > promoCode.validUntil) {
    return { valid: false, reason: "Promo code has expired" };
  }

  if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, reason: "Promo code has reached maximum uses" };
  }

  return { valid: true, promoCode };
}

export async function incrementPromoCodeUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(eq(promoCodes.id, id));
}

export async function calculateDiscount(
  promoCode: PromoCode,
  subtotal: number,
  productTypes: string[]
): Promise<number> {
  // Check if promo code applies to these product types
  if (promoCode.applicableProductTypes) {
    const applicableTypes = JSON.parse(promoCode.applicableProductTypes);
    const hasApplicableProduct = productTypes.some(type =>
      applicableTypes.includes(type)
    );
    if (!hasApplicableProduct) {
      return 0;
    }
  }

  // Check minimum order amount
  if (promoCode.minOrderAmount && subtotal < Number(promoCode.minOrderAmount)) {
    return 0;
  }

  // Calculate discount
  if (promoCode.discountType === "percentage") {
    return (subtotal * Number(promoCode.discountValue)) / 100;
  } else {
    return Math.min(Number(promoCode.discountValue), subtotal);
  }
}

// ============= DELIVERY ZONE OPERATIONS =============

export async function validateDeliveryZone(zipCode: string): Promise<{
  valid: boolean;
  zone?: DeliveryZone;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { valid: false, reason: "Database not available" };
  }

  const [zone] = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.zipCode, zipCode))
    .limit(1);

  if (!zone) {
    return { valid: false, reason: "Delivery not available in this ZIP code" };
  }

  if (!zone.isActive) {
    return {
      valid: false,
      reason: "Delivery temporarily unavailable in this area",
    };
  }

  return { valid: true, zone };
}

export async function getAllDeliveryZones(): Promise<DeliveryZone[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true));
}

// ============= PRODUCT INVENTORY OPERATIONS =============

export async function checkProductAvailability(
  productId: number,
  quantity: number
): Promise<{
  available: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { available: false, reason: "Database not available" };
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    return { available: false, reason: "Product not found" };
  }

  if (!product.inStock) {
    return { available: false, reason: "Product is out of stock" };
  }

  // Check availability dates
  const now = new Date();
  if (product.availableFrom && now < product.availableFrom) {
    return { available: false, reason: "Product is not yet available" };
  }

  if (product.availableUntil && now > product.availableUntil) {
    return { available: false, reason: "Product is no longer available" };
  }

  // Check inventory cap
  if (product.inventoryCap) {
    const remaining = product.inventoryCap - (product.inventorySold || 0);
    if (remaining < quantity) {
      return { available: false, reason: `Only ${remaining} remaining` };
    }
  }

  return { available: true };
}

export async function incrementProductSold(
  productId: number,
  quantity: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({ inventorySold: sql`${products.inventorySold} + ${quantity}` })
    .where(eq(products.id, productId));
}

export async function getValentinesProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const valentinesCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "valentines-day-2026"))
    .limit(1);

  if (!valentinesCategory.length) return [];

  return db
    .select()
    .from(products)
    .where(eq(products.categoryId, valentinesCategory[0].id))
    .orderBy(products.displayOrder);
}

export async function getProductsByType(
  productType: "standard" | "tier" | "build_your_own_item" | "custom_portrait"
): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(eq(products.productType, productType))
    .orderBy(products.displayOrder);
}

// ============ WISHLIST FUNCTIONS ============

export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select({
      id: wishlistItems.id,
      userId: wishlistItems.userId,
      productId: wishlistItems.productId,
      createdAt: wishlistItems.createdAt,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        basePrice: products.basePrice,
        imageUrl: products.imageUrl,
        inStock: products.inStock,
        categoryId: products.categoryId,
      },
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));

  return items;
}

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return null;

  // Check if already in wishlist
  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db
    .insert(wishlistItems)
    .values({ userId, productId })
    .returning({ id: wishlistItems.id });
  return {
    id: result[0]?.id ?? 0,
    userId,
    productId,
  };
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    );

  return true;
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      )
    )
    .limit(1);

  return existing.length > 0;
}

export async function getWishlistProductIds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  return items.map(item => item.productId);
}

export async function getWishlistCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  return result[0]?.count || 0;
}
