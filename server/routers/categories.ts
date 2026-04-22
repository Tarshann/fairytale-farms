/**
 * Categories Router — public listing and admin management of product categories
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure, db } from "./_shared";

export const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAllCategories();
  }),

  listAdmin: adminProcedure.query(async () => {
    return await db.getAllCategoriesAdmin();
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(100).trim() }))
    .query(async ({ input }) => {
      return await db.getCategoryBySlug(input.slug);
    }),

  setVisible: adminProcedure
    .input(z.object({ id: z.number(), visible: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.setCategoryVisible(input.id, input.visible);
      return { success: true };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).trim(),
        slug: z.string().min(1).max(100).trim().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        description: z.string().max(2000).trim().optional(),
        displayOrder: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createCategory(input);
      return { id, success: true };
    }),
});
