import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  categories, Category, InsertCategory,
  products, Product, InsertProduct,
  cartItems, CartItem, InsertCartItem,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  contactSubmissions, ContactSubmission, InsertContactSubmission,
  wishlistItems, WishlistItem, InsertWishlistItem
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= CATEGORY OPERATIONS =============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.displayOrder, categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(category) as any;
  return Number(result.insertId);
}

// ============= PRODUCT OPERATIONS =============

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.inStock, true))
    .orderBy(products.displayOrder, products.name);
}

// Get all products including out-of-stock (for admin)
export async function getAllProductsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.displayOrder, products.name);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.inStock, true)))
    .orderBy(products.displayOrder, products.name);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.featured, true))
    .orderBy(products.displayOrder)
    .limit(6);
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(product) as any;
  return Number(result.insertId);
}

export async function updateProduct(id: number, updates: Partial<InsertProduct>) {
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
  
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, item.userId),
        eq(cartItems.productId, item.productId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + (item.quantity || 1);
    await db
      .update(cartItems)
      .set({ quantity: newQuantity, customizationNotes: item.customizationNotes })
      .where(eq(cartItems.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(cartItems).values(item) as any;
    return Number(result.insertId);
  }
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

// ============= ORDER OPERATIONS =============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order) as any;
  return Number(result.insertId);
}

export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(item) as any;
  return Number(result.insertId);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const ordersList = await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  
  // Add item counts to each order
  const ordersWithItems = await Promise.all(
    ordersList.map(async (order) => {
      const items = await getOrderItems(order.id);
      return { ...order, items };
    })
  );
  
  return ordersWithItems;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  const ordersList = await db.select().from(orders).orderBy(desc(orders.createdAt));
  
  // Add user info and item counts to each order
  const ordersWithDetails = await Promise.all(
    ordersList.map(async (order) => {
      const items = await getOrderItems(order.id);
      const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
      return { ...order, items, user };
    })
  );
  
  return ordersWithDetails;
}

export async function updateOrderStatus(id: number, status: "pending" | "processing" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function updateOrderPayment(id: number, paymentIntentId: string, paymentStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ 
    stripePaymentIntentId: paymentIntentId,
    stripePaymentStatus: paymentStatus 
  }).where(eq(orders.id, id));
}

// ============= CONTACT OPERATIONS =============

export async function createContactSubmission(submission: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(submission) as any;
  return Number(result.insertId);
}

export async function getAllContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function updateContactSubmissionStatus(id: number, status: "new" | "read" | "replied") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactSubmissions).set({ status }).where(eq(contactSubmissions.id, id));
}

// ============= PHOTO UPLOAD OPERATIONS =============

import { photoUploads, PhotoUpload, InsertPhotoUpload } from "../drizzle/schema";

export async function createPhotoUpload(upload: InsertPhotoUpload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(photoUploads).values(upload);
  return Number(result.insertId);
}

export async function getPhotoUploadsByOrder(orderId: number): Promise<PhotoUpload[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photoUploads).where(eq(photoUploads.orderId, orderId));
}

export async function getPendingPhotoUploads(): Promise<PhotoUpload[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photoUploads).where(eq(photoUploads.status, "pending_review"));
}

export async function updatePhotoUploadStatus(
  id: number, 
  status: "pending_review" | "approved" | "rejected",
  reviewNotes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(photoUploads)
    .set({ status, reviewNotes, updatedAt: new Date() })
    .where(eq(photoUploads.id, id));
}

// ============= PROMO CODE OPERATIONS =============

import { promoCodes, PromoCode } from "../drizzle/schema";

export async function getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const [result] = await db.select()
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
  
  await db.update(promoCodes)
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
    const hasApplicableProduct = productTypes.some(type => applicableTypes.includes(type));
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

import { deliveryZones, DeliveryZone } from "../drizzle/schema";

export async function validateDeliveryZone(zipCode: string): Promise<{
  valid: boolean;
  zone?: DeliveryZone;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { valid: false, reason: "Database not available" };
  }
  
  const [zone] = await db.select()
    .from(deliveryZones)
    .where(eq(deliveryZones.zipCode, zipCode))
    .limit(1);
  
  if (!zone) {
    return { valid: false, reason: "Delivery not available in this ZIP code" };
  }
  
  if (!zone.isActive) {
    return { valid: false, reason: "Delivery temporarily unavailable in this area" };
  }
  
  return { valid: true, zone };
}

export async function getAllDeliveryZones(): Promise<DeliveryZone[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true));
}

// ============= PRODUCT INVENTORY OPERATIONS =============

export async function checkProductAvailability(productId: number, quantity: number): Promise<{
  available: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { available: false, reason: "Database not available" };
  }
  
  const [product] = await db.select()
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

export async function incrementProductSold(productId: number, quantity: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products)
    .set({ inventorySold: sql`${products.inventorySold} + ${quantity}` })
    .where(eq(products.id, productId));
}

export async function getValentinesProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  
  const valentinesCategory = await db.select()
    .from(categories)
    .where(eq(categories.slug, "valentines-day-2026"))
    .limit(1);
  
  if (!valentinesCategory.length) return [];
  
  return db.select()
    .from(products)
    .where(eq(products.categoryId, valentinesCategory[0].id))
    .orderBy(products.displayOrder);
}

export async function getProductsByType(productType: "standard" | "tier" | "build_your_own_item" | "custom_portrait"): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
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
      }
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
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const result = await db.insert(wishlistItems).values({ userId, productId });
  return { id: Number((result as any)[0].insertId), userId, productId };
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
  
  return true;
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const existing = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
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
