import { COOKIE_NAME, ONE_YEAR_MS, SESSION_MAX_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  router,
  sessionProcedure,
} from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import { z } from "zod";
import * as db from "./db";
import * as chatbot from "./chatbot";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { sendLoginCode, isEmailConfigured } from "./_core/email";
import crypto from "crypto";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const buildChatRateKey = (req: Request, sessionId: string) =>
  `${getClientIp(req)}:${sessionId}`;

const enforceChatRateLimit = (
  action: "sendMessage" | "uploadImage",
  req: Request,
  sessionId: string
) => {
  const { allowed, retryAfterMs } = chatbot.checkChatRateLimit(
    action,
    buildChatRateKey(req, sessionId)
  );

  if (!allowed) {
    const retryAfterSeconds = retryAfterMs
      ? Math.max(1, Math.ceil(retryAfterMs / 1000))
      : 60;
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${retryAfterSeconds}s.`,
    });
  }
};

const assertValidChatImages = (imageDataList: string[]) => {
  for (const imageData of imageDataList) {
    const validation = chatbot.validateImagePayload(imageData);
    if (!validation.ok) {
      throw new TRPCError({
        code: validation.code,
        message: validation.message,
      });
    }
  }
};

type LoginRateLimitState = { count: number; resetAt: number };
const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const LOGIN_RATE_LIMIT_MAX = 5;
const loginRateLimitState: Map<string, LoginRateLimitState> = new Map();

const getLoginRateKey = (req: Request, email: string) =>
  `${getClientIp(req)}:${email.toLowerCase()}`;

const cleanupLoginRateLimits = () => {
  const now = Date.now();
  for (const [key, state] of loginRateLimitState) {
    if (state.resetAt <= now) {
      loginRateLimitState.delete(key);
    }
  }
};

const enforceLoginRateLimit = (req: Request, email: string) => {
  cleanupLoginRateLimits();
  const now = Date.now();
  const key = getLoginRateKey(req, email);
  const state = loginRateLimitState.get(key);

  if (!state || state.resetAt <= now) {
    loginRateLimitState.set(key, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (state.count >= LOGIN_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((state.resetAt - now) / 1000)
    );
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many login attempts. Try again in ${retryAfterSeconds}s.`,
    });
  }

  state.count += 1;
};

let _stripe: import("stripe").default | null = null;
async function getStripe() {
  if (!_stripe) {
    const Stripe = (await import("stripe")).default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
    });
  }
  return _stripe;
}

const assertCheckoutEnabled = async () => {
  const enabled = await db.isCheckoutEnabled();
  if (!enabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Ordering is currently closed. Please contact us for inquiries.",
    });
  }
};

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  // ============= SITE SETTINGS ROUTES =============
  settings: router({
    checkoutEnabled: publicProcedure.query(async () => {
      return { enabled: await db.isCheckoutEnabled() };
    }),

    setCheckoutEnabled: adminProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.setSiteSetting("checkout_enabled", input.enabled.toString());
        return { success: true, enabled: input.enabled };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    requestLoginCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        enforceLoginRateLimit(ctx.req, input.email);
        const code = crypto.randomInt(100000, 1000000).toString();
        const normalizedEmail = input.email.trim().toLowerCase();
        const hash = crypto
          .createHash("sha256")
          .update(`${normalizedEmail}:${code}`)
          .digest("hex");
        const expiresAt = new Date(Date.now() + 10 * 60_000);

        // Invalidate any previous unused codes for this email before creating new one
        await db.invalidateLoginCodesForEmail(normalizedEmail);

        await db.createLoginCode({
          email: normalizedEmail,
          codeHash: hash,
          expiresAt,
        });

        const emailSent = await sendLoginCode(normalizedEmail, code);

        // Only expose devCode when email delivery is not configured (dev environments)
        const showDevCode = !emailSent && !ENV.isProduction;

        return {
          success: true,
          expiresAt: expiresAt.toISOString(),
          devCode: showDevCode ? code : undefined,
          emailSent,
        };
      }),
    verifyLoginCode: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().min(6).max(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceLoginRateLimit(ctx.req, input.email);
        const normalizedEmail = input.email.trim().toLowerCase();
        const record = await db.getLatestActiveLoginCode(normalizedEmail);
        if (!record) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired code.",
          });
        }

        const hash = crypto
          .createHash("sha256")
          .update(`${normalizedEmail}:${input.code}`)
          .digest("hex");

        if (hash !== record.codeHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired code.",
          });
        }

        await db.markLoginCodeUsed(record.id);

        const openId = `email:${normalizedEmail}`;
        await db.upsertUser({
          openId,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        const accountUser = await db.getUserByOpenId(openId);
        if (!accountUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to sign in.",
          });
        }

        if (ctx.user?.loginMethod === "guest") {
          await db.transferCartItems(ctx.user.id, accountUser.id);
        }

        const sessionToken = await sdk.createSessionToken(openId, {
          name: accountUser.name ?? "",
          expiresInMs: SESSION_MAX_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: SESSION_MAX_MS,
        });

        return { success: true };
      }),
  }),

  // ============= CATEGORY ROUTES =============
  categories: router({
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
      .input(
        z.object({ id: z.number(), visible: z.boolean() })
      )
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
  }),

  // ============= PRODUCT ROUTES =============
  products: router({
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
        return product;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductBySlug(input.slug);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
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
          resolvedUpdates.availableFrom = availableFrom
            ? new Date(availableFrom)
            : null;
        }
        if (availableUntil !== undefined) {
          resolvedUpdates.availableUntil = availableUntil
            ? new Date(availableUntil)
            : null;
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
  }),

  // ============= CART ROUTES =============
  cart: router({
    get: sessionProcedure.query(async ({ ctx }) => {
      return await db.getCartItems(ctx.user.id);
    }),

    add: sessionProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1).default(1),
          customizationNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertCheckoutEnabled();
        try {
          const id = await db.addToCart({
            userId: ctx.user.id,
            ...input,
          });
          return { id, success: true };
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to add item to cart. Please try again.",
          });
        }
      }),

    updateQuantity: sessionProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.number().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await db.getCartItemById(input.id);
        if (!item || item.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
        }
        await db.updateCartItemQuantity(input.id, input.quantity);
        return { success: true };
      }),

    remove: sessionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const item = await db.getCartItemById(input.id);
        if (!item || item.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
        }
        await db.removeFromCart(input.id);
        return { success: true };
      }),

    clear: sessionProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============= ORDER ROUTES =============
  orders: router({
    createCheckout: sessionProcedure.mutation(async ({ ctx }) => {
      await assertCheckoutEnabled();
      const stripe = await getStripe();

      // Get user's cart items
      const cartItemsList = await db.getCartItems(ctx.user.id);

      if (!cartItemsList || cartItemsList.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      // Create line items for Stripe
      const lineItems = cartItemsList.map(item => {
        const metadata: Record<string, string> = {};
        if (item.product?.id) {
          metadata.productId = item.product.id.toString();
        }
        if (item.customizationNotes) {
          metadata.customizationNotes = item.customizationNotes;
        }

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.product?.name || "Product",
              description: item.customizationNotes || undefined,
              ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
            },
            unit_amount: Math.round(
              parseFloat(item.product?.basePrice || "0") * 100
            ),
          },
          quantity: item.quantity,
        };
      });

      // Use request origin, or APP_ORIGIN / OAUTH_SERVER_URL (e.g. https://fairytalefarms.net), or localhost for dev
      const origin =
        ctx.req.headers.origin ||
        ENV.appOrigin ||
        "http://localhost:3000";

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        allow_promotion_codes: true,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

    create: sessionProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number(),
              unitPrice: z.string(),
              customizationNotes: z.string().optional(),
            })
          ),
          totalAmount: z.string(),
          customerName: z.string(),
          customerEmail: z.string(),
          customerPhone: z.string().optional(),
          deliveryAddress: z.string().optional(),
          deliveryNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertCheckoutEnabled();
        const orderNumber = `FF-${Date.now()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

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
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(
            2
          );
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        const sameCustomerEmail =
          ctx.user.email && order.customerEmail
            ? ctx.user.email.toLowerCase() === order.customerEmail.toLowerCase()
            : false;
        if (
          order.userId !== ctx.user.id &&
          !sameCustomerEmail &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),

    getByNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        const sameCustomerEmail =
          ctx.user.email && order.customerEmail
            ? ctx.user.email.toLowerCase() === order.customerEmail.toLowerCase()
            : false;
        if (
          order.userId !== ctx.user.id &&
          !sameCustomerEmail &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),

    getByCheckoutSession: sessionProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        const stripe = await getStripe();

        const session = await stripe.checkout.sessions.retrieve(
          input.sessionId
        );

        const sessionUserId = session.client_reference_id
          ? parseInt(session.client_reference_id)
          : session.metadata?.user_id
            ? parseInt(session.metadata.user_id)
            : null;

        if (
          sessionUserId &&
          sessionUserId !== ctx.user.id &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        const order = await db.getOrderByPaymentIntentId(paymentIntentId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersForAccount(ctx.user.id, ctx.user.email);
    }),

    reorder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCheckoutEnabled();
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        const sameCustomerEmail =
          ctx.user.email && order.customerEmail
            ? ctx.user.email.toLowerCase() === order.customerEmail.toLowerCase()
            : false;
        if (order.userId !== ctx.user.id && !sameCustomerEmail) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        const items = await db.getOrderItems(order.id);
        await db.clearCart(ctx.user.id);
        for (const item of items) {
          await db.addToCart({
            userId: ctx.user.id,
            productId: item.productId,
            quantity: item.quantity,
            customizationNotes: item.customizationNotes ?? undefined,
          });
        }
        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "processing", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),

    updatePayment: adminProcedure
      .input(
        z.object({
          id: z.number(),
          paymentIntentId: z.string(),
          paymentStatus: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderPayment(
          input.id,
          input.paymentIntentId,
          input.paymentStatus
        );
        return { success: true };
      }),
  }),

  // ============= ADMIN ROUTES =============
  admin: router({
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
        await db.updateProduct(input.id, { inStock: !product.inStock });
        return { success: true };
      }),

    toggleProductFeatured: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
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

    // ---- User Management (admin only) ----
    allUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Prevent admins from removing their own admin role
        if (input.userId === ctx.user.id && input.role !== "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot remove your own admin role.",
          });
        }
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ============= VALENTINE'S DAY ROUTES =============
  valentines: router({
    // Get all Valentine's products
    products: publicProcedure.query(async () => {
      return await db.getValentinesProducts();
    }),

    // Get tier products only
    tiers: publicProcedure.query(async () => {
      return await db.getProductsByType("tier");
    }),

    // Get build-your-own items
    buildYourOwnItems: publicProcedure.query(async () => {
      return await db.getProductsByType("build_your_own_item");
    }),

    // Get custom portrait product
    customPortrait: publicProcedure.query(async () => {
      const products = await db.getProductsByType("custom_portrait");
      return products[0] || null;
    }),

    // Validate delivery zone
    validateDeliveryZone: publicProcedure
      .input(z.object({ zipCode: z.string() }))
      .query(async ({ input }) => {
        return await db.validateDeliveryZone(input.zipCode);
      }),

    // Get all delivery zones
    deliveryZones: publicProcedure.query(async () => {
      return await db.getAllDeliveryZones();
    }),

    // Validate promo code
    validatePromoCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return await db.validatePromoCode(input.code);
      }),

    // Check product availability
    checkAvailability: publicProcedure
      .input(z.object({ productId: z.number(), quantity: z.number() }))
      .query(async ({ input }) => {
        return await db.checkProductAvailability(
          input.productId,
          input.quantity
        );
      }),

    // Upload photo for custom portrait
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          fileUrl: z.string(),
          fileKey: z.string(),
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate file size (minimum 1MB)
        if (input.fileSize < 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Photo must be at least 1MB for high resolution",
          });
        }

        // Validate mime type
        if (!["image/jpeg", "image/png"].includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only JPG and PNG formats are accepted",
          });
        }

        const id = await db.createPhotoUpload({
          orderId: input.orderId,
          userId: ctx.user.id,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        });

        return { id, success: true };
      }),

    // Get photos for an order
    getPhotos: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPhotoUploadsByOrder(input.orderId);
      }),

    // Admin: Get pending photo reviews
    pendingPhotos: adminProcedure.query(async () => {
      return await db.getPendingPhotoUploads();
    }),

    // Admin: Update photo status
    updatePhotoStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending_review", "approved", "rejected"]),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updatePhotoUploadStatus(
          input.id,
          input.status,
          input.reviewNotes
        );
        return { success: true };
      }),

    // Create checkout with Valentine's Day features (promo codes, deposits, delivery scheduling)
    createValentinesCheckout: protectedProcedure
      .input(
        z.object({
          promoCode: z.string().optional(),
          deliveryZipCode: z.string(),
          scheduledDeliveryDate: z.string().optional(),
          deliveryType: z.enum(["same_day", "scheduled"]).default("same_day"),
          deliveryAddress: z.string(),
          deliveryNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertCheckoutEnabled();
        const stripe = await getStripe();

        // Validate delivery zone
        const zoneValidation = await db.validateDeliveryZone(
          input.deliveryZipCode
        );
        if (!zoneValidation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: zoneValidation.reason || "Invalid delivery zone",
          });
        }

        // Get cart items
        const cartItems = await db.getCartItems(ctx.user.id);
        if (!cartItems || cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        // Check if any item requires deposit (custom portrait)
        const hasDepositItem = cartItems.some(
          item => item.product?.requiresDeposit
        );

        // Calculate subtotal
        let subtotal = cartItems.reduce((sum, item) => {
          return (
            sum + parseFloat(item.product?.basePrice || "0") * item.quantity
          );
        }, 0);

        // Apply promo code if provided
        let discountAmount = 0;
        let promoCodeData = null;
        if (input.promoCode) {
          const promoValidation = await db.validatePromoCode(input.promoCode);
          if (promoValidation.valid && promoValidation.promoCode) {
            promoCodeData = promoValidation.promoCode;
            const productTypes = cartItems.map(
              item => item.product?.productType || "standard"
            );
            discountAmount = await db.calculateDiscount(
              promoCodeData,
              subtotal,
              productTypes
            );
          }
        }

        const totalAfterDiscount = subtotal - discountAmount;

        // For deposit items, only charge 50%
        const chargeAmount = hasDepositItem
          ? totalAfterDiscount * 0.5
          : totalAfterDiscount;

        // Create line items
        const lineItems = cartItems.map(item => {
          const metadata: Record<string, string> = {};
          if (item.product?.id) {
            metadata.productId = item.product.id.toString();
          }
          if (item.customizationNotes) {
            metadata.customizationNotes = item.customizationNotes;
          }

          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.product?.name || "Product",
                description: item.customizationNotes || undefined,
                ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
              },
              unit_amount: Math.round(
                parseFloat(item.product?.basePrice || "0") *
                  100 *
                  (hasDepositItem ? 0.5 : 1)
              ),
            },
            quantity: item.quantity,
          };
        });

        // Add discount line if applicable
        if (discountAmount > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Discount (${input.promoCode})`,
                description: undefined,
              },
              unit_amount: -Math.round(
                discountAmount * 100 * (hasDepositItem ? 0.5 : 1)
              ),
            },
            quantity: 1,
          });
        }

        // Use request origin, or APP_ORIGIN / OAUTH_SERVER_URL (e.g. https://fairytalefarms.net), or localhost for dev
        const origin =
          ctx.req.headers.origin ||
          ENV.appOrigin ||
          "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/cart`,
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            promo_code: input.promoCode || "",
            discount_amount: discountAmount.toString(),
            delivery_zip: input.deliveryZipCode,
            delivery_type: input.deliveryType,
            scheduled_date: input.scheduledDeliveryDate || "",
            is_deposit: hasDepositItem ? "true" : "false",
            remaining_amount: hasDepositItem
              ? (totalAfterDiscount * 0.5).toFixed(2)
              : "0",
          },
          allow_promotion_codes: false, // We handle our own promo codes
        });

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
          isDeposit: hasDepositItem,
          depositAmount: hasDepositItem ? chargeAmount : null,
          remainingAmount: hasDepositItem ? totalAfterDiscount * 0.5 : null,
          discountApplied: discountAmount,
        };
      }),
  }),

  // ============= CONTACT ROUTES =============
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          subject: z.string().optional(),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createContactSubmission(input);
        return { id, success: true };
      }),

    list: adminProcedure.query(async () => {
      return await db.getAllContactSubmissions();
    }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "read", "replied"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateContactSubmissionStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============= WISHLIST ROUTES =============
  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWishlistItems(ctx.user.id);
    }),

    productIds: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWishlistProductIds(ctx.user.id);
    }),

    count: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWishlistCount(ctx.user.id);
    }),

    isInWishlist: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isInWishlist(ctx.user.id, input.productId);
      }),

    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.addToWishlist(ctx.user.id, input.productId);
        return { success: true, item: result };
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromWishlist(ctx.user.id, input.productId);
        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isInList = await db.isInWishlist(ctx.user.id, input.productId);
        if (isInList) {
          await db.removeFromWishlist(ctx.user.id, input.productId);
          return { success: true, added: false };
        } else {
          await db.addToWishlist(ctx.user.id, input.productId);
          return { success: true, added: true };
        }
      }),
  }),

  // ============= CHATBOT ROUTES =============
  chatbot: router({
    sendMessage: publicProcedure
      .input(
        z.object({
          sessionId: z
            .string()
            .min(1)
            .max(chatbot.CHAT_LIMITS.maxSessionIdLength),
          message: z.string().min(1).max(chatbot.CHAT_LIMITS.maxMessageLength),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z
                  .string()
                  .min(1)
                  .max(chatbot.CHAT_LIMITS.maxMessageLength),
              })
            )
            .max(chatbot.CHAT_LIMITS.maxHistoryMessages)
            .optional(),
          imageUrls: z
            .array(z.string())
            .max(chatbot.CHAT_LIMITS.maxImagesPerMessage)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforceChatRateLimit("sendMessage", ctx.req, input.sessionId);
        if (input.imageUrls && input.imageUrls.length > 0) {
          assertValidChatImages(input.imageUrls);
          const existingImages = chatbot.getSessionImages(input.sessionId);
          const combinedImages = new Set([
            ...existingImages,
            ...input.imageUrls,
          ]);
          if (combinedImages.size > chatbot.CHAT_LIMITS.maxImagesPerSession) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `You can attach up to ${chatbot.CHAT_LIMITS.maxImagesPerSession} images per session.`,
            });
          }
        }
        return await chatbot.processChat(input);
      }),

    uploadImage: publicProcedure
      .input(
        z.object({
          sessionId: z
            .string()
            .min(1)
            .max(chatbot.CHAT_LIMITS.maxSessionIdLength),
          imageData: z.string().min(1),
          fileName: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforceChatRateLimit("uploadImage", ctx.req, input.sessionId);
        const validation = chatbot.validateImagePayload(input.imageData);
        if (!validation.ok) {
          throw new TRPCError({
            code: validation.code,
            message: validation.message,
          });
        }
        const existingImages = chatbot.getSessionImages(input.sessionId);
        if (existingImages.length >= chatbot.CHAT_LIMITS.maxImagesPerSession) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You can upload up to ${chatbot.CHAT_LIMITS.maxImagesPerSession} images per session.`,
          });
        }
        return await chatbot.uploadImage(
          input.sessionId,
          input.imageData,
          input.fileName
        );
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await chatbot.getConversationHistory(input.sessionId);
      }),
  }),

  // ============= ADMIN INQUIRY ROUTES =============
  inquiries: router({
    list: adminProcedure.query(async () => {
      return await chatbot.getAllInquiries();
    }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "new",
            "contacted",
            "quoted",
            "confirmed",
            "completed",
            "cancelled",
          ]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await chatbot.updateInquiryStatus(
          input.id,
          input.status,
          input.adminNotes
        );
        return { success: true };
      }),

    getConversation: adminProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input }) => {
        return await chatbot.getInquiryConversation(input.inquiryId);
      }),

    analytics: adminProcedure.query(async () => {
      return await chatbot.getInquiryAnalytics();
    }),

    bulkUpdateStatus: adminProcedure
      .input(
        z.object({
          ids: z.array(z.number()),
          status: z.enum([
            "new",
            "contacted",
            "quoted",
            "confirmed",
            "completed",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        return await chatbot.bulkUpdateInquiryStatus(input.ids, input.status);
      }),

    overdue: adminProcedure.query(async () => {
      return await chatbot.getOverdueInquiries();
    }),
  }),
});

export type AppRouter = typeof appRouter;
