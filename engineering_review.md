<engineering_review>
Review:
- architecture
The architecture is a monolithic tRPC setup using React, Vite, Express, and Drizzle ORM on Neon PostgreSQL. It relies heavily on a single `routers.ts` file (1,600+ lines) for all API procedures, mixing public, session, and admin logic. While tRPC provides excellent end-to-end type safety, the monolithic router is a bottleneck for maintainability.

- code organization
Code is split into `client`, `server`, and `shared`. However, the server layer suffers from massive files (`routers.ts` at 1,615 lines, `db.ts` at 1,405 lines). Business logic, database queries, and route definitions are tightly coupled. The `client` is better organized with Radix UI components, but pages like `Home.tsx` and `Products.tsx` are very large (600+ lines).

- data flow
Data flows from React Query -> tRPC client -> Express/tRPC server -> Drizzle ORM -> Neon Postgres. The flow is type-safe but lacks a dedicated service layer. The Stripe webhook (`webhook.ts`) directly inserts into the database, bypassing the tRPC router's business logic, which creates a risk of divergent order-handling logic.

- performance
The frontend uses Vite and React lazy loading, which is good. However, the backend has N+1 query risks in `db.ts` (e.g., fetching products and then iterating to fetch categories or reviews). The global rate limiter in `security.ts` uses an in-memory `Map` that will leak memory or reset unexpectedly in a multi-instance deployment (like Vercel or Railway with multiple replicas).

- security
Security headers (CSP, HSTS) are manually set in `security.ts` and look reasonable for production. However, the JWT secret fallback in `env.ts` (`fairytale-farms-fallback-please-set-JWT_SECRET`) is a critical risk if the environment variable is missed. The in-memory rate limiter is easily bypassed in serverless environments.

- testing
Testing is extremely weak. There are only 6 test files (~220 assertions total) using Vitest. The tests in `products.test.ts` are integration tests that require a live database (`DATABASE_URL`) and lack proper mocking or isolated fixtures. They mostly check if arrays are returned, not business logic correctness.

- CI/CD
There is no `.github/workflows` directory or evidence of automated CI/CD pipelines. Deployment relies on manual `pnpm build` and `pnpm start` or platform-specific configs (`vercel.json`, `render.yaml`), but there are no automated tests running on PRs or pushes.

- deployment readiness
The app is partially ready. It supports Vercel, Render, and Railway. However, the reliance on in-memory state (rate limiting, login codes) makes it unsuitable for serverless or multi-instance deployments without a Redis cache. The Stripe webhook is configured but lacks robust error recovery if the DB insert fails.

- technical debt
High technical debt in `routers.ts` and `db.ts` due to lack of modularity. The database seed scripts (`*.mjs`) are outdated (written for MySQL) and will fail on Neon Postgres. The email system in `webhook.ts` logs to the console instead of actually sending the customer confirmation email.

For each major issue provide:
- evidence: `server/routers.ts` is 1,615 lines long, containing all API routes.
- risk: High risk of merge conflicts, difficult to test, and hard to maintain as the product grows.
- recommended fix: Split `routers.ts` into domain-specific routers (e.g., `productsRouter.ts`, `ordersRouter.ts`, `authRouter.ts`) and merge them in a root router.

- evidence: `server/webhook.ts` contains a `sendOrderConfirmationEmail` function that only calls `notifyOwner` and logs the customer email to the console.
- risk: Customers will not receive order confirmation emails, leading to support tickets and loss of trust.
- recommended fix: Implement actual email sending using the existing Nodemailer setup in `email.ts` for customer confirmations.

- evidence: `server/_core/security.ts` uses an in-memory `Map` for global rate limiting.
- risk: In a serverless environment (Vercel) or multi-instance deployment, the rate limiter is ineffective and memory will reset per request/instance.
- recommended fix: Replace the in-memory rate limiter with a Redis-backed solution (e.g., Upstash) or remove it and rely on platform-level rate limiting (e.g., Vercel Edge Middleware or Cloudflare).

- evidence: `server/products.test.ts` requires a live `DATABASE_URL` and has shallow assertions.
- risk: Tests are flaky, environment-dependent, and do not catch business logic regressions.
- recommended fix: Implement a proper test database setup with teardown, or mock the database layer for unit tests. Add GitHub Actions for CI.
</engineering_review>
