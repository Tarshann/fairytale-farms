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
        categoryId: z.number().int().positive(),
        name: z.string().min(1).max(200).trim(),
        slug: z.string().min(1).max(100).trim().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        description: z.string().max(5000).trim().optional(),
        basePrice: z.string().max(20).trim(),
        imageUrl: z.string().url().max(2000).optional(),
        imageKey: z.string().max(500).trim().optional(),
        isCustomizable: z.boolean().default(false),
        customizationInstructions: z.string().max(2000).trim().optional(),
        inStock: z.boolean().default(true),
        featured: z.boolean().default(false),
        displayOrder: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createProduct(input);
      return { id, success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        categoryId: z.number().int().positive().optional(),
        name: z.string().min(1).max(200).trim().optional(),
        slug: z.string().min(1).max(100).trim().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
        description: z.string().max(5000).trim().optional(),
        basePrice: z.string().max(20).trim().optional(),
        imageUrl: z.string().url().max(2000).optional(),
        imageKey: z.string().max(500).trim().optional(),
        isCustomizable: z.boolean().optional(),
        customizationInstructions: z.string().max(2000).trim().optional(),
        inStock: z.boolean().optional(),
        featured: z.boolean().optional(),
        displayOrder: z.number().int().min(0).optional(),
        inventoryCap: z.number().int().min(0).nullable().optional(),
        inventorySold: z.number().int().min(0).optional(),
        availableFrom: z.string().max(50).nullable().optional(),
        availableUntil: z.string().max(50).nullable().optional(),
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
