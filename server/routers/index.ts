/**
 * Root Application Router
 *
 * Assembles all domain-specific routers into the single appRouter.
 * Each domain module lives in its own file — add new domains here.
 *
 * Domain map:
 *   system        → _core/systemRouter (health checks, session)
 *   settings      → settings.ts
 *   auth          → auth.ts
 *   categories    → categories.ts
 *   products      → products.ts
 *   cart          → cart.ts
 *   orders        → orders.ts
 *   valentines    → valentines.ts
 *   contact       → contact.ts
 *   wishlist      → wishlist.ts
 *   chatbot       → chatbot.ts
 *   reviews       → reviews.ts
 *   search        → search.ts
 *   abandonedCart → abandonedCart.ts
 *   ai            → ai.ts
 *   inquiries     → inquiries.ts
 *   admin         → admin.ts
 */
import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { settingsRouter } from "./settings";
import { authRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { productsRouter } from "./products";
import { cartRouter } from "./cart";
import { ordersRouter } from "./orders";
import { valentinesRouter } from "./valentines";
import { contactRouter } from "./contact";
import { wishlistRouter } from "./wishlist";
import { chatbotRouter } from "./chatbot";
import { reviewsRouter } from "./reviews";
import { searchRouter } from "./search";
import { abandonedCartRouter } from "./abandonedCart";
import { aiRouter } from "./ai";
import { inquiriesRouter } from "./inquiries";
import { adminRouter } from "./admin";

export const appRouter = router({
  system: systemRouter,
  settings: settingsRouter,
  auth: authRouter,
  categories: categoriesRouter,
  products: productsRouter,
  cart: cartRouter,
  orders: ordersRouter,
  valentines: valentinesRouter,
  contact: contactRouter,
  wishlist: wishlistRouter,
  chatbot: chatbotRouter,
  reviews: reviewsRouter,
  search: searchRouter,
  abandonedCart: abandonedCartRouter,
  ai: aiRouter,
  inquiries: inquiriesRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
