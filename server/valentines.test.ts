import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock authenticated user context
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Mock public context (no user)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Valentine's Day Features", () => {
  describe("valentines.tiers", () => {
    it("returns tier products for Valentine's collection", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const tiers = await caller.valentines.tiers();
      
      expect(Array.isArray(tiers)).toBe(true);
      // Tiers should be products with productType 'tier'
    });
  });

  describe("valentines.buildYourOwnItems", () => {
    it("returns build-your-own items for Valentine's collection", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const items = await caller.valentines.buildYourOwnItems();
      
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("valentines.deliveryZones", () => {
    it("returns list of delivery zones", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const zones = await caller.valentines.deliveryZones();
      
      expect(Array.isArray(zones)).toBe(true);
    });
  });

  describe("valentines.validateDeliveryZone", () => {
    it("validates a valid ZIP code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      // Test with Nashville ZIP code
      const result = await caller.valentines.validateDeliveryZone({ zipCode: "37201" });
      
      expect(result).toHaveProperty("valid");
      expect(typeof result.valid).toBe("boolean");
    });

    it("rejects invalid ZIP code format", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      // Test with invalid ZIP code
      const result = await caller.valentines.validateDeliveryZone({ zipCode: "00000" });
      
      expect(result.valid).toBe(false);
    });
  });

  describe("valentines.validatePromoCode", () => {
    it("validates ACADEMY2026 promo code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.valentines.validatePromoCode({ code: "ACADEMY2026" });
      
      expect(result).toHaveProperty("valid");
      // Code should be valid if it exists in database
    });

    it("rejects invalid promo code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.valentines.validatePromoCode({ code: "INVALIDCODE" });
      
      expect(result.valid).toBe(false);
    });
  });
});

describe("Products Router", () => {
  describe("products.featured", () => {
    it("returns featured products", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const products = await caller.products.featured();
      
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe("products.list", () => {
    it("returns all products", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const products = await caller.products.list();
      
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe("categories.list", () => {
    it("returns all categories", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const categories = await caller.categories.list();
      
      expect(Array.isArray(categories)).toBe(true);
    });
  });
});

describe("Cart Router", () => {
  describe("cart.get", () => {
    it("returns cart items for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const cartItems = await caller.cart.get();
      
      expect(Array.isArray(cartItems)).toBe(true);
    });
  });
});

describe("Orders Router", () => {
  describe("orders.myOrders", () => {
    it("returns orders for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const orders = await caller.orders.myOrders();
      
      expect(Array.isArray(orders)).toBe(true);
    });
  });
});
