/**
 * Products Router — public browsing and admin CRUD for products
 */
import { z } from "zod";
import { TRPCError, publicProcedure, router, adminProcedure, db } from "./_shared";

export const productsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAllProducts();
  }),

  listAdmin: adminProcedure.query(async () => {
    return await db.getAllProductsAdmin();
  }),

  listByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      const category = await db.getCategoryById(input.categoryId);
      if (!category?.visible) return [];
      return await db.getProductsByCategory(input.categoryId);
    }),

  featured: publicProcedure.query(async () => {
    return await db.getFeaturedProducts();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      return product;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await db.getProductBySlug(input.slug);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      return product;
    }),

  create: adminProcedure
    .input(
      z.object({
        categoryId: z.number(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        basePrice: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        isCustomizable: z.boolean().default(false),
        customizationInstructions: z.string().optional(),
        inStock: z.boolean().default(true),
        featured: z.boolean().default(false),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createProduct(input);
      return { id, success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        isCustomizable: z.boolean().optional(),
        customizationInstructions: z.string().optional(),
        inStock: z.boolean().optional(),
        featured: z.boolean().optional(),
        displayOrder: z.number().optional(),
        inventoryCap: z.number().nullable().optional(),
        inventorySold: z.number().optional(),
        availableFrom: z.string().nullable().optional(),
        availableUntil: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, availableFrom, availableUntil, ...updates } = input;
      const resolvedUpdates = { ...updates } as typeof updates & {
        availableFrom?: Date | null;
        availableUntil?: Date | null;
      };
      if (availableFrom !== undefined) {
        resolvedUpdates.availableFrom = availableFrom ? new Date(availableFrom) : null;
      }
      if (availableUntil !== undefined) {
        resolvedUpdates.availableUntil = availableUntil ? new Date(availableUntil) : null;
      }
      await db.updateProduct(id, resolvedUpdates);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true };
    }),
});
