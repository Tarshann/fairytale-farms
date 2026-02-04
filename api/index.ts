import "../server/_core/loadEnv";

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerAuthRoutes } from "../server/_core/authRoutes";

const app = express();

// Stripe webhook MUST come before express.json() for signature verification
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const { handleStripeWebhook } = await import("../server/webhook");
    return handleStripeWebhook(req, res);
  }
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);
registerAuthRoutes(app);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
