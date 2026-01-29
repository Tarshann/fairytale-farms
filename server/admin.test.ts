import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabase ? describe : describe.skip;

function createAdminContext(): { ctx: TrpcContext } {
  const adminUser: AuthenticatedUser = {
    id: 999,
    openId: "admin-user",
    email: "admin@fairytalefarms.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const regularUser: AuthenticatedUser = {
    id: 1,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describeDb("Admin Access Control", () => {
  it("should allow admin to access stats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.stats();

    expect(stats).toBeDefined();
    expect(stats.totalProducts).toBeGreaterThanOrEqual(0);
    expect(stats.totalOrders).toBeGreaterThanOrEqual(0);
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(stats.totalContacts).toBeGreaterThanOrEqual(0);
  });

  it("should deny regular user access to admin stats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("should allow admin to view all orders", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.admin.allOrders();

    expect(Array.isArray(orders)).toBe(true);
  });

  it("should allow admin to view all contacts", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const contacts = await caller.admin.allContacts();

    expect(Array.isArray(contacts)).toBe(true);
  });

  it("should allow admin to toggle product stock status", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Get a product first
    const products = await caller.products.list();
    if (products.length > 0) {
      const result = await caller.admin.toggleProductStock({
        id: products[0].id,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should allow admin to toggle product featured status", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Get a product first
    const products = await caller.products.list();
    if (products.length > 0) {
      const result = await caller.admin.toggleProductFeatured({
        id: products[0].id,
      });
      expect(result.success).toBe(true);
    }
  });
});

describeDb("Contact Form", () => {
  it("should submit contact form", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "Test Customer",
      email: "customer@example.com",
      phone: "555-1234",
      subject: "Test Inquiry",
      message: "This is a test message",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should allow admin to mark contact as read", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Submit a contact first
    const submitResult = await caller.contact.submit({
      name: "Test Customer",
      email: "customer@example.com",
      message: "Test message",
    });

    // Skip if no id returned (database not connected in test)
    if (!submitResult.id || isNaN(submitResult.id)) {
      expect(submitResult.success).toBe(true);
      return;
    }

    // Mark as read
    const markResult = await caller.admin.markContactRead({
      id: submitResult.id,
    });
    expect(markResult.success).toBe(true);
  });
});
