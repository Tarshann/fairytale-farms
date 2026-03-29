/**
 * db_extensions.ts
 * Database operations for Reviews, Abandoned Carts, Marketing Campaigns,
 * Pricing Recommendations, Low Stock Alerts, and Product Search.
 *
 * These are imported and re-exported from db.ts.
 */

import { getDb } from "./db";
import {
  reviews,
  Review,
  InsertReview,
  abandonedCarts,
  AbandonedCart,
  InsertAbandonedCart,
  marketingCampaigns,
  MarketingCampaign,
  InsertMarketingCampaign,
  pricingRecommendations,
  PricingRecommendation,
  InsertPricingRecommendation,
  lowStockAlerts,
  LowStockAlert,
  InsertLowStockAlert,
  products,
  users,
  orders,
  orderItems,
} from "../drizzle/schema";
import { eq, and, desc, sql, ilike, or, inArray, lt, isNull } from "drizzle-orm";

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export async function createReview(review: InsertReview): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(review).returning({ id: reviews.id });
  return result[0]?.id ?? 0;
}

export async function getReviewsByProduct(productId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "published")))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewsByProductWithUser(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      status: reviews.status,
      aiSentimentScore: reviews.aiSentimentScore,
      aiFlagged: reviews.aiFlagged,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "published")))
    .orderBy(desc(reviews.createdAt));
}

export async function getProductRatingSummary(productId: number): Promise<{
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}> {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalReviews: 0, distribution: {} };

  const result = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "published")));

  const dist = await db
    .select({
      rating: reviews.rating,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "published")))
    .groupBy(reviews.rating);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of dist) {
    distribution[row.rating] = Number(row.count);
  }

  return {
    averageRating: Math.round((Number(result[0]?.avgRating) || 0) * 10) / 10,
    totalReviews: Number(result[0]?.count) || 0,
    distribution,
  };
}

export async function getUserReviewForProduct(
  userId: number,
  productId: number
): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return result[0];
}

export async function getPendingReviews() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      status: reviews.status,
      aiSentimentScore: reviews.aiSentimentScore,
      aiFlagged: reviews.aiFlagged,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      userEmail: users.email,
      productName: products.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));
}

export async function getAllReviewsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      status: reviews.status,
      aiSentimentScore: reviews.aiSentimentScore,
      aiFlagged: reviews.aiFlagged,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      userEmail: users.email,
      productName: products.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt));
}

export async function updateReviewStatus(
  id: number,
  status: "pending" | "published" | "rejected"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(reviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(reviews.id, id));
}

export async function updateReviewAiData(
  id: number,
  data: { aiSentimentScore?: string; aiFlagged?: boolean; status?: "pending" | "published" | "rejected" }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(reviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reviews.id, id));
}

// ─── ABANDONED CARTS ──────────────────────────────────────────────────────────

export async function upsertAbandonedCart(
  userId: number,
  userEmail: string,
  cartContents: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check for existing pending abandoned cart for this user
  const existing = await db
    .select()
    .from(abandonedCarts)
    .where(and(eq(abandonedCarts.userId, userId), eq(abandonedCarts.status, "pending")))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(abandonedCarts)
      .set({ cartContents, lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(abandonedCarts.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db
    .insert(abandonedCarts)
    .values({ userId, userEmail, cartContents, lastActiveAt: new Date() })
    .returning({ id: abandonedCarts.id });
  return result[0]?.id ?? 0;
}

export async function markAbandonedCartRecovered(userId: number, orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(abandonedCarts)
    .set({ status: "recovered", recoveredOrderId: orderId, updatedAt: new Date() })
    .where(and(eq(abandonedCarts.userId, userId), eq(abandonedCarts.status, "pending")));
}

export async function deleteAbandonedCartForUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(abandonedCarts)
    .where(and(eq(abandonedCarts.userId, userId), eq(abandonedCarts.status, "pending")));
}

export async function getAbandonedCartsForRecovery(cutoffDate: Date): Promise<AbandonedCart[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(abandonedCarts)
    .where(
      and(
        eq(abandonedCarts.status, "pending"),
        lt(abandonedCarts.lastActiveAt, cutoffDate),
        isNull(abandonedCarts.recoveryEmailSentAt)
      )
    )
    .orderBy(abandonedCarts.lastActiveAt);
}

export async function markAbandonedCartEmailSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(abandonedCarts)
    .set({ recoveryEmailSentAt: new Date(), updatedAt: new Date() })
    .where(eq(abandonedCarts.id, id));
}

export async function getAllAbandonedCartsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: abandonedCarts.id,
      userId: abandonedCarts.userId,
      userEmail: abandonedCarts.userEmail,
      cartContents: abandonedCarts.cartContents,
      status: abandonedCarts.status,
      recoveryEmailSentAt: abandonedCarts.recoveryEmailSentAt,
      recoveredOrderId: abandonedCarts.recoveredOrderId,
      lastActiveAt: abandonedCarts.lastActiveAt,
      createdAt: abandonedCarts.createdAt,
      userName: users.name,
    })
    .from(abandonedCarts)
    .leftJoin(users, eq(abandonedCarts.userId, users.id))
    .orderBy(desc(abandonedCarts.createdAt));
}

// ─── MARKETING CAMPAIGNS ──────────────────────────────────────────────────────

export async function createMarketingCampaign(
  campaign: InsertMarketingCampaign
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(marketingCampaigns)
    .values(campaign)
    .returning({ id: marketingCampaigns.id });
  return result[0]?.id ?? 0;
}

export async function getAllMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(marketingCampaigns)
    .orderBy(desc(marketingCampaigns.createdAt));
}

export async function updateMarketingCampaignStatus(
  id: number,
  status: "draft" | "approved" | "published" | "rejected"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(marketingCampaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(marketingCampaigns.id, id));
}

export async function updateMarketingCampaign(
  id: number,
  updates: Partial<InsertMarketingCampaign>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(marketingCampaigns)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(marketingCampaigns.id, id));
}

// ─── PRICING RECOMMENDATIONS ──────────────────────────────────────────────────

export async function createPricingRecommendation(
  rec: InsertPricingRecommendation
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(pricingRecommendations)
    .values(rec)
    .returning({ id: pricingRecommendations.id });
  return result[0]?.id ?? 0;
}

export async function getPendingPricingRecommendations() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: pricingRecommendations.id,
      productId: pricingRecommendations.productId,
      currentPrice: pricingRecommendations.currentPrice,
      suggestedPrice: pricingRecommendations.suggestedPrice,
      reasoning: pricingRecommendations.reasoning,
      status: pricingRecommendations.status,
      createdAt: pricingRecommendations.createdAt,
      updatedAt: pricingRecommendations.updatedAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(pricingRecommendations)
    .leftJoin(products, eq(pricingRecommendations.productId, products.id))
    .where(eq(pricingRecommendations.status, "pending"))
    .orderBy(desc(pricingRecommendations.createdAt));
}

export async function getAllPricingRecommendations() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: pricingRecommendations.id,
      productId: pricingRecommendations.productId,
      currentPrice: pricingRecommendations.currentPrice,
      suggestedPrice: pricingRecommendations.suggestedPrice,
      reasoning: pricingRecommendations.reasoning,
      status: pricingRecommendations.status,
      createdAt: pricingRecommendations.createdAt,
      updatedAt: pricingRecommendations.updatedAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(pricingRecommendations)
    .leftJoin(products, eq(pricingRecommendations.productId, products.id))
    .orderBy(desc(pricingRecommendations.createdAt));
}

export async function updatePricingRecommendationStatus(
  id: number,
  status: "pending" | "applied" | "rejected"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(pricingRecommendations)
    .set({ status, updatedAt: new Date() })
    .where(eq(pricingRecommendations.id, id));
}

// ─── LOW STOCK ALERTS ─────────────────────────────────────────────────────────

export async function createLowStockAlert(
  alert: InsertLowStockAlert
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(lowStockAlerts)
    .values(alert)
    .returning({ id: lowStockAlerts.id });
  return result[0]?.id ?? 0;
}

export async function getActiveLowStockAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: lowStockAlerts.id,
      productId: lowStockAlerts.productId,
      currentStock: lowStockAlerts.currentStock,
      forecastedDemand: lowStockAlerts.forecastedDemand,
      resolved: lowStockAlerts.resolved,
      createdAt: lowStockAlerts.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(lowStockAlerts)
    .leftJoin(products, eq(lowStockAlerts.productId, products.id))
    .where(eq(lowStockAlerts.resolved, false))
    .orderBy(desc(lowStockAlerts.createdAt));
}

export async function resolveLowStockAlert(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(lowStockAlerts)
    .set({ resolved: true, updatedAt: new Date() })
    .where(eq(lowStockAlerts.id, id));
}

export async function hasUnresolvedAlertForProduct(productId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: lowStockAlerts.id })
    .from(lowStockAlerts)
    .where(and(eq(lowStockAlerts.productId, productId), eq(lowStockAlerts.resolved, false)))
    .limit(1);
  return result.length > 0;
}

// ─── PRODUCT SEARCH ───────────────────────────────────────────────────────────

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];

  const term = `%${query.trim()}%`;

  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      basePrice: products.basePrice,
      imageUrl: products.imageUrl,
      inStock: products.inStock,
      featured: products.featured,
      categoryId: products.categoryId,
      displayOrder: products.displayOrder,
    })
    .from(products)
    .where(
      and(
        eq(products.inStock, true),
        or(
          ilike(products.name, term),
          ilike(products.description, term)
        )
      )
    )
    .orderBy(products.displayOrder)
    .limit(20);
}

// ─── DEMAND FORECAST DATA ─────────────────────────────────────────────────────

export async function getOrderVelocityByProduct(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.createdAt} >= ${since}`)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`);

  return result;
}

export async function getRevenueByDay(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`SUM(CAST(${orders.totalAmount} AS DECIMAL))`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "completed"),
        sql`${orders.createdAt} >= ${since}`
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);
}
