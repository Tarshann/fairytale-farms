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
    .input(z.object({ slug: z.string() }))
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
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createCategory(input);
      return { id, success: true };
    }),
});
