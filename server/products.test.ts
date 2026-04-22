import { describe, expect, it } from "vitest";
import { appRouter } from "./routers/index";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabase ? describe : describe.skip;

function createTestContext(user?: AuthenticatedUser): { ctx: TrpcContext } {
  const testUser: AuthenticatedUser = user || {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: testUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describeDb("Products", () => {
  it("should list all products", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();

    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
  });

  it("should list all categories", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should get product by ID", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First get all products to find a valid ID
    const products = await caller.products.list();
    if (products.length > 0) {
      const product = await caller.products.getById({ id: products[0].id });
      expect(product).toBeDefined();
      expect(product?.id).toBe(products[0].id);
    }
  });

  it("should get products by category", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();
    if (categories.length > 0) {
      const products = await caller.products.listByCategory({
        categoryId: categories[0].id,
      });
      expect(Array.isArray(products)).toBe(true);
    }
  });
});

describeDb("Shopping Cart", () => {
  it("should add item to cart", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Get a product to add to cart
    const products = await caller.products.list();
    if (products.length > 0) {
      const result = await caller.cart.add({
        productId: products[0].id,
        quantity: 2,
        customizationNotes: "Test customization",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should get cart items", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const cartItems = await caller.cart.get();

    expect(Array.isArray(cartItems)).toBe(true);
  });

  it("should update cart item quantity", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Add an item first
    const products = await caller.products.list();
    if (products.length > 0) {
      const addResult = await caller.cart.add({
        productId: products[0].id,
        quantity: 1,
      });

      expect(addResult.success).toBe(true);

      // Get cart to find the item ID
      const cartItems = await caller.cart.get();
      if (cartItems.length > 0) {
        // Update quantity
        const updateResult = await caller.cart.updateQuantity({
          id: cartItems[0].id,
          quantity: 3,
        });

        expect(updateResult.success).toBe(true);
      }
    }
  });

  it("should remove item from cart", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Add an item first
    const products = await caller.products.list();
    if (products.length > 0) {
      const addResult = await caller.cart.add({
        productId: products[0].id,
        quantity: 1,
      });

      expect(addResult.success).toBe(true);

      // Get cart to find the item ID
      const cartItems = await caller.cart.get();
      if (cartItems.length > 0) {
        // Remove it
        const removeResult = await caller.cart.remove({ id: cartItems[0].id });
        expect(removeResult.success).toBe(true);
      }
    }
  });
});
