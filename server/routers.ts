import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= CATEGORY ROUTES =============
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getCategoryBySlug(input.slug);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);
        return { id, success: true };
      }),
  }),

  // ============= PRODUCT ROUTES =============
  products: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    
    listByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        return product;
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductBySlug(input.slug);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        return product;
      }),
    
    create: adminProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProduct(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateProduct(id, updates);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ============= CART ROUTES =============
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCartItems(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        customizationNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addToCart({
          userId: ctx.user.id,
          ...input,
        });
        return { id, success: true };
      }),
    
    updateQuantity: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updateCartItemQuantity(input.id, input.quantity);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeFromCart(input.id);
        return { success: true };
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============= ORDER ROUTES =============
  orders: router({
    createCheckout: protectedProcedure
      .mutation(async ({ ctx }) => {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2025-12-15.clover',
        });
        
        // Get user's cart items
        const cartItemsList = await db.getCartItems(ctx.user.id);
        
        if (!cartItemsList || cartItemsList.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        }
        
        // Create line items for Stripe
        const lineItems = cartItemsList.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product?.name || 'Product',
              description: item.customizationNotes || undefined,
            },
            unit_amount: Math.round(parseFloat(item.product?.basePrice || '0') * 100),
          },
          quantity: item.quantity,
        }));
        
        // Get origin from request headers
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${origin}/order-confirmation/{CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/cart`,
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
          },
          allow_promotion_codes: true,
        });
        
        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      }),
    
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          customizationNotes: z.string().optional(),
        })),
        totalAmount: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerPhone: z.string().optional(),
        deliveryAddress: z.string().optional(),
        deliveryNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderNumber = `FF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const orderId = await db.createOrder({
          userId: ctx.user.id,
          orderNumber,
          status: "pending",
          totalAmount: input.totalAmount,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          deliveryNotes: input.deliveryNotes,
        });
        
        for (const item of input.items) {
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
          await db.createOrderItem({
            orderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
            customizationNotes: item.customizationNotes,
          });
        }
        
        return { orderId, orderNumber, success: true };
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    
    getByNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByUser(ctx.user.id);
    }),
    
    all: adminProcedure.query(async () => {
      return await db.getAllOrders();
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    
    updatePayment: protectedProcedure
      .input(z.object({
        id: z.number(),
        paymentIntentId: z.string(),
        paymentStatus: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderPayment(input.id, input.paymentIntentId, input.paymentStatus);
        return { success: true };
      }),
  }),

  // ============= ADMIN ROUTES =============
  admin: router({    
    stats: adminProcedure.query(async () => {
      const products = await db.getAllProducts();
      const orders = await db.getAllOrders();
      const contacts = await db.getAllContactSubmissions();
      
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        await db.updateProduct(input.id, { inStock: !product.inStock });
        return { success: true };
      }),
    
    toggleProductFeatured: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
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
        await db.updateContactSubmissionStatus(input.id, 'read');
        return { success: true };
      }),
  }),
  
  // ============= CONTACT ROUTES =============
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createContactSubmission(input);
        return { id, success: true };
      }),
    
    list: adminProcedure.query(async () => {
      return await db.getAllContactSubmissions();
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateContactSubmissionStatus(input.id, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
