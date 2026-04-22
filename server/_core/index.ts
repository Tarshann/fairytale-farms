import "./loadEnv";

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "./authRoutes";
import { appRouter } from "../routers/index";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import { securityHeaders, apiRateLimit, requestLogger, globalErrorHandler, corsMiddleware } from "./security";
import { startCronJobs } from "../cron";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1); // Railway / reverse-proxy: trust first hop for secure cookies & req.protocol
  const server = createServer(app);

  // Stripe webhook MUST come before express.json() for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleStripeWebhook } = await import("../webhook");
      return handleStripeWebhook(req, res);
    }
  );

  // Security headers, CORS, rate limiting, request logging
  app.use(requestLogger);
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(apiRateLimit);

  // SEO: robots.txt
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /my-orders\nDisallow: /cart\nDisallow: /checkout\nSitemap: ${appOrigin}/sitemap.xml`
    );
  });

  // SEO: sitemap.xml (static routes; product slugs injected at runtime)
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { products, categories } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";
      const now = new Date().toISOString().split("T")[0];

      const staticRoutes = [
        { loc: "/", priority: "1.0", changefreq: "weekly" },
        { loc: "/products", priority: "0.9", changefreq: "daily" },
        { loc: "/about", priority: "0.7", changefreq: "monthly" },
        { loc: "/contact", priority: "0.6", changefreq: "monthly" },
      ];

      let productUrls: string[] = [];
      let categoryUrls: string[] = [];

      if (db) {
        const prods = await db.select({ slug: products.slug }).from(products).where(eq(products.inStock, true));
        productUrls = prods.map(
          p => `  <url><loc>${appOrigin}/products/${p.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
        );
        const cats = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.visible, true));
        categoryUrls = cats.map(
          c => `  <url><loc>${appOrigin}/categories/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );
      }

      const staticXml = staticRoutes.map(
        r => `  <url><loc>${appOrigin}${r.loc}</loc><lastmod>${now}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
      );

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...staticXml,
        ...productUrls,
        ...categoryUrls,
        "</urlset>",
      ].join("\n");

      res.type("application/xml").send(xml);
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  registerOAuthRoutes(app);
  registerAuthRoutes(app);

  app.get("/health", (_req, res) => {
    if (ENV.isProduction) {
      res.json({ ok: true });
      return;
    }

    res.json({
      ok: true,
      env: ENV.isProduction ? "production" : "development",
      oauthEnabled: ENV.oauthEnabled,
      allowDevLogin: ENV.allowDevLogin,
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start background AI automation cron jobs
    startCronJobs();
  });
}

startServer().catch(console.error);
