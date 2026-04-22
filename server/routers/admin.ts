/**
 * Admin Router — dashboard stats, product stock toggles, order/contact management, user roles
 */
import { z } from "zod";
import { TRPCError, router, adminProcedure, db } from "./_shared";

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const products = await db.getAllProductsAdmin();
    const orders = await db.getAllOrders();
    const contacts = await db.getAllContactSubmissions();
    const totalRevenue = orders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      totalContacts: contacts.length,
    };
  }),

  toggleProductStock: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      await db.updateProduct(input.id, { inStock: !product.inStock });
      return { success: true };
    }),

  toggleProductFeatured: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      await db.updateProduct(input.id, { featured: !product.featured });
      return { success: true };
    }),

  allOrders: adminProcedure.query(async () => {
    return await db.getAllOrders();
  }),

  allContacts: adminProcedure.query(async () => {
    return await db.getAllContactSubmissions();
  }),

  markContactRead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateContactSubmissionStatus(input.id, "read");
      return { success: true };
    }),

  allUsers: adminProcedure.query(async () => {
    return await db.getAllUsers();
  }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove your own admin role.",
        });
      }
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),
});
