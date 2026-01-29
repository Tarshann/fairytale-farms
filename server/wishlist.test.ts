import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-wishlist-user",
    email: "wishlist@example.com",
    name: "Wishlist Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("wishlist", () => {
  describe("wishlist.list", () => {
    it("returns wishlist items for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("wishlist.productIds", () => {
    it("returns array of product IDs in wishlist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.productIds();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("wishlist.count", () => {
    it("returns count of wishlist items", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.count();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("wishlist.isInWishlist", () => {
    it("checks if product is in wishlist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.isInWishlist({ productId: 1 });

      expect(typeof result).toBe("boolean");
    });
  });

  describe("wishlist.toggle", () => {
    it("toggles product in wishlist and returns success", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First toggle - should add
      const addResult = await caller.wishlist.toggle({ productId: 999 });
      expect(addResult.success).toBe(true);

      // Second toggle - should remove
      const removeResult = await caller.wishlist.toggle({ productId: 999 });
      expect(removeResult.success).toBe(true);
    });
  });

  describe("wishlist.add", () => {
    it("adds product to wishlist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.add({ productId: 998 });

      expect(result.success).toBe(true);

      // Cleanup - remove the item
      await caller.wishlist.remove({ productId: 998 });
    });
  });

  describe("wishlist.remove", () => {
    it("removes product from wishlist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First add an item
      await caller.wishlist.add({ productId: 997 });

      // Then remove it
      const result = await caller.wishlist.remove({ productId: 997 });

      expect(result.success).toBe(true);
    });
  });

  describe("authentication required", () => {
    it("throws error when user is not authenticated for list", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.wishlist.list()).rejects.toThrow();
    });

    it("throws error when user is not authenticated for toggle", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.wishlist.toggle({ productId: 1 })).rejects.toThrow();
    });
  });
});
