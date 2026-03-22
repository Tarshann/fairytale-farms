# Fairytale Farms Bakery — Architecture Overview

**Project Status:** Production-ready e-commerce bakery website with Stripe payments, AI chatbot for custom orders, and Valentine's Day 2026 collection
**Last Updated:** March 22, 2026
**Database:** PostgreSQL (Neon serverless)
**Deployment:** Vercel / Render / Docker / Railway (multi-target)

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Database Design](#4-database-design)
5. [API Layer](#5-api-layer)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Payments & Stripe Integration](#8-payments--stripe-integration)
9. [AI Chatbot](#9-ai-chatbot)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Design System](#12-design-system)
13. [Security](#13-security)
14. [Current State & Roadmap](#14-current-state--roadmap)

---

## 1. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.1 | UI framework |
| Vite | 7.1.7 | Build tool & dev server |
| Wouter | 3.3.5 | Client-side routing (lightweight) |
| Tailwind CSS | 4.1.14 | Utility-first styling |
| Radix UI | 40+ components | Accessible component primitives |
| TanStack React Query | 5.90.2 | Server state management |
| tRPC (client) | 11.6.0 | Type-safe API consumption |
| React Hook Form | 7.64.0 | Form state management |
| Zod | (via tRPC) | Runtime validation |
| Framer Motion | 12.23.22 | Animations |
| Lucide React | 0.453.0 | Icons |
| Sonner | 2.0.7 | Toast notifications |
| PostHog | 1.342.1 | Analytics (optional) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22 | Runtime |
| Express | 4.21.2 | HTTP server |
| tRPC | 11.6.0 | Type-safe RPC framework |
| Drizzle ORM | 0.44.5 | Database ORM (schema-first) |
| PostgreSQL | (Neon serverless) | Database |
| Stripe | 20.1.2 | Payment processing |
| Anthropic SDK | 0.71.2 | AI chatbot (Claude API) |
| AWS S3 | SDK v3 | File/image storage |
| Nodemailer | 8.0.1 | Email (passwordless login) |
| jose | (JWT) | Session management |

### Development & Build

| Tool | Purpose |
|---|---|
| pnpm 10.15.1 | Package manager |
| TypeScript 5.9.3 | Type safety (strict mode) |
| esbuild 0.25.0 | Server bundling |
| Vitest 2.1.4 | Test runner |
| Prettier 3.6.2 | Code formatting |

**Total dependencies:** 140 (97 production + 28 dev + patches)

---

## 2. Project Structure

```
fairytale-farms/
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── pages/                  # 22 page components
│   │   ├── components/             # Reusable components
│   │   │   ├── Navigation.tsx      # Header with logo, menu, cart badge
│   │   │   ├── Footer.tsx          # Site footer with links
│   │   │   ├── ChatWidget.tsx      # Floating AI chatbot (14KB)
│   │   │   ├── AIChatBox.tsx       # Chat UI with message history (10KB)
│   │   │   ├── DashboardLayout.tsx # Admin layout wrapper
│   │   │   ├── Map.tsx             # Google Maps integration
│   │   │   └── ui/                 # 40+ Radix-based UI primitives
│   │   ├── lib/trpc.ts             # tRPC client configuration
│   │   ├── contexts/               # React contexts (Theme)
│   │   ├── hooks/                  # Custom hooks (auth)
│   │   ├── _core/                  # Core utilities
│   │   ├── App.tsx                 # Router with 21 routes
│   │   ├── main.tsx                # Entry point with providers
│   │   └── index.css               # Tailwind global styles
│   └── public/                     # Static assets
│
├── server/                         # Node.js backend
│   ├── _core/                      # Core infrastructure
│   │   ├── index.ts                # Express server setup, middleware, security headers
│   │   ├── trpc.ts                 # tRPC initialization & auth middleware
│   │   ├── context.ts              # Request context creation (JWT parsing)
│   │   ├── oauth.ts                # OAuth helpers
│   │   ├── authRoutes.ts           # Auth endpoints (login, email codes)
│   │   └── env.ts                  # Environment variable config
│   ├── routers.ts                  # Main tRPC router — all procedures (1,360 lines)
│   ├── db.ts                       # Database helper functions (1,282 lines)
│   ├── chatbot.ts                  # AI chatbot logic (753 lines)
│   ├── webhook.ts                  # Stripe webhook handler (327 lines)
│   ├── storage.ts                  # S3 file operations
│   ├── scripts/seed.ts             # Database seeding
│   └── *.test.ts                   # 6 test files (~766 lines)
│
├── drizzle/                        # Database layer
│   ├── schema.ts                   # PostgreSQL table definitions (15 tables)
│   ├── migrations/                 # Drizzle-generated migrations
│   └── drop-all-neon.sql           # Neon database reset script
│
├── shared/                         # Code shared between client & server
│   ├── const.ts                    # Constants (cookie names, error messages)
│   ├── types.ts                    # Shared type exports
│   └── _core/errors/               # Error definitions
│
├── api/                            # Vercel serverless entry point
│   └── index.ts                    # tRPC handler for Vercel
│
├── *.mjs                           # 10+ utility scripts (seeding, data updates)
│
├── package.json                    # Dependencies & 28 scripts
├── tsconfig.json                   # TypeScript (ES2017, ESNext modules, strict)
├── vite.config.ts                  # Vite + Tailwind + React + manual chunks
├── drizzle.config.ts               # Drizzle ORM → PostgreSQL config
├── vitest.config.ts                # Test runner config
├── Dockerfile                      # Multi-stage Docker build
├── vercel.json                     # Vercel deployment config
└── render.yaml                     # Render.com deployment config
```

### Key File Sizes

| File | Lines | Responsibility |
|---|---|---|
| `server/routers.ts` | 1,360 | All tRPC procedures (the API surface) |
| `server/db.ts` | 1,282 | Database queries and business logic |
| `server/chatbot.ts` | 753 | AI chatbot conversation logic |
| `client/src/pages/Home.tsx` | ~600 | Landing page (hero, products, testimonials) |
| `client/src/pages/Products.tsx` | 693 | Product listing with category filters |
| `client/src/pages/BuildYourOwn.tsx` | ~450 | Interactive Valentine's box builder |
| `server/webhook.ts` | 327 | Stripe event handling |

---

## 3. Architecture Patterns

### End-to-End Type Safety (tRPC)

The defining architectural choice: **tRPC** provides full type inference from database schema to React components with zero code generation.

```
[Drizzle Schema] → [DB helpers] → [tRPC Router] → [tRPC Client] → [React Component]
     types            types          types            types            types
```

A change to a procedure's input/output in `routers.ts` immediately surfaces type errors in consuming client components.

### Monorepo with Shared Code

The `shared/` directory contains constants, types, and error definitions used by both client and server. Path aliases keep imports clean:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `client/public/`

### Middleware-Based Authorization

tRPC middleware provides layered access control on every procedure:

| Procedure | Access Level | Use Case |
|---|---|---|
| `publicProcedure` | No auth required | Product listings, categories |
| `sessionProcedure` | Guest or authenticated | Cart operations, checkout |
| `protectedProcedure` | Authenticated accounts only | Order history, wishlist |
| `adminProcedure` | Admin role only | Product CRUD, order management |

### Code Splitting & Lazy Loading

React `lazy()` + `Suspense` for route-level splitting:
- **Eager:** Home, Products (critical path)
- **Lazy:** All other 19 routes

Vite manual chunk configuration splits vendor code into separate bundles: `react`, `ui` (Radix), `motion` (Framer), `query` (TanStack).

---

## 4. Database Design

**Engine:** PostgreSQL via Neon (serverless)
**ORM:** Drizzle ORM (schema-first TypeScript)
**Schema:** `drizzle/schema.ts`

### Entity Relationships

```
users ──┬── cartItems ────── products ──── categories
        ├── orders ──────── orderItems ─── products
        ├── wishlistItems ── products
        ├── chatInquiries ── chatMessages
        ├── photoUploads
        └── contactSubmissions

promoCodes       (standalone)
deliveryZones    (standalone)
loginCodes       (standalone)
siteSettings     (standalone)
```

### Tables (15)

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Accounts | openId, name, email, role (user/admin), loginMethod |
| `categories` | Product groupings | name, slug, displayOrder, visible |
| `products` | Bakery items | categoryId, name, basePrice, productType, inventory fields |
| `cartItems` | Cart persistence | userId, productId, quantity, customizationNotes |
| `orders` | Orders | orderNumber, status, totalAmount, delivery fields, Stripe IDs |
| `orderItems` | Line items | orderId, productId, quantity, price |
| `wishlistItems` | Favorites | userId, productId |
| `chatInquiries` | Custom order requests | status, productType, budget, deliveryDate |
| `chatMessages` | Chat history | inquiryId, role (user/assistant), content |
| `promoCodes` | Discounts | code, discountType, discountValue, maxUses, expiresAt |
| `deliveryZones` | Service areas | zipCode, zoneName |
| `photoUploads` | Portrait images | userId, s3Key, s3Url |
| `contactSubmissions` | Contact form | name, email, message |
| `loginCodes` | Passwordless auth | email, code, expiresAt |
| `siteSettings` | Global config | key, value |

### PostgreSQL Enums

- **userRole:** `user`, `admin`
- **orderStatus:** `pending`, `processing`, `completed`, `cancelled`
- **productType:** `standard`, `tier`, `build_your_own_item`, `custom_portrait`
- **loginMethod:** `oauth`, `email_code`

---

## 5. API Layer

All procedures defined in `server/routers.ts`, organized by domain.

### Procedures Summary

| Domain | Count | Key Procedures |
|---|---|---|
| **Categories** | 6 | `list`, `listAdmin`, `getBySlug`, `setVisible` |
| **Products** | 10+ | `list`, `listByCategory`, `featured`, `getById`, `getBySlug`, `create`, `update`, `delete`, `listAll`, `updatePrice`, `updateInventory` |
| **Cart** | 5 | `add`, `remove`, `get`, `updateQuantity`, `clear` |
| **Orders** | 5 | `create`, `list`, `getById`, `listAll`, `updateStatus` |
| **Wishlist** | 4 | `add`, `remove`, `list`, `toggle` |
| **Chatbot** | 7 | `createInquiry`, `sendMessage`, `getInquiry`, `getMessages`, `listInquiries`, `updateInquiryStatus`, `uploadImage` |
| **Stripe** | 1+webhook | `createCheckoutSession` + `POST /api/stripe/webhook` |
| **Auth** | 2 | `me`, `logout` |
| **System** | 1 | `GET /health` |

### Request Flow

```
Client Request
  → Express middleware (CORS, security headers, cookie parser)
  → tRPC adapter
  → Context creation (parse JWT → resolve user/guest)
  → Procedure middleware (auth level check)
  → Procedure handler (business logic)
  → Database (Drizzle ORM → Neon PostgreSQL)
  → Response (auto-serialized, fully typed)
```

---

## 6. Frontend Architecture

### Routing (Wouter — 21 routes)

| Route | Page | Loading |
|---|---|---|
| `/` | Home | Eager |
| `/products` | Products | Eager |
| `/products/:slug` | ProductDetail | Lazy |
| `/valentines` | ValentinesCollection | Lazy |
| `/build-your-own` | BuildYourOwn | Lazy |
| `/custom-portrait-pucks` | CustomPortraitPucks | Lazy |
| `/cart` | Cart | Lazy |
| `/checkout` | Checkout | Lazy |
| `/order-confirmation/:id` | OrderConfirmation | Lazy |
| `/my-orders` | MyOrders | Lazy |
| `/orders/:id` | OrderDetail | Lazy |
| `/wishlist` | Wishlist | Lazy |
| `/contact` | Contact | Lazy |
| `/login` | Login | Lazy |
| `/delivery-zones` | DeliveryZones | Lazy |
| `/lab` | Lab | Lazy |
| `/about` | About | Lazy |
| `/bickering-bros` | BickeringBros | Lazy |
| `/gallery` | Gallery | Lazy |
| `/faq` | FAQ | Lazy |
| `/admin/*` | Admin pages (6) | Lazy |

### Provider Hierarchy

```tsx
<QueryClientProvider>
  <trpc.Provider>
    <ThemeProvider>
      <TooltipProvider>
        <App />          // Router + pages
        <Toaster />      // Toast notifications
        <ChatWidget />   // Floating AI chatbot
      </TooltipProvider>
    </ThemeProvider>
  </trpc.Provider>
</QueryClientProvider>
```

### Data Fetching Pattern

All server communication via tRPC hooks (React Query under the hood):

```tsx
// Query
const { data: products } = trpc.products.list.useQuery();

// Mutation with cache invalidation
const addToCart = trpc.cart.add.useMutation({
  onSuccess: () => utils.cart.get.invalidate(),
});
```

### Admin Pages (6)

- `AdminDashboard` — Sales metrics and summary
- `AdminProducts` — Product CRUD operations
- `AdminOrders` — Order management and status updates
- `AdminInquiries` (34KB) — Chatbot inquiry review with conversation history
- `AdminContacts` — Contact form submissions
- `AdminSettings` (15KB) — Category visibility, checkout toggle, site settings

---

## 7. Authentication & Authorization

### Three Authentication Methods

1. **Guest Sessions** — Auto-created on first cart interaction. JWT stored in HTTP-only cookie. No login required for browsing or purchasing.

2. **OAuth** — Integration with Manus OAuth portal. Returns an `openId` that links to the user account.

3. **Email Codes** — Passwordless login via SMTP. 6-digit code sent to email, stored in `loginCodes` table with expiry.

### Session Management

- **Token:** JWT signed with `JWT_SECRET`
- **Storage:** Secure HTTP-only cookie (`ff_session`)
- **Expiry:** 1 year
- **Context Resolution:** Every request extracts JWT → looks up or creates user → attaches to tRPC context

### Roles

- **user** — Browse, cart, checkout, wishlist, order history
- **admin** — All user capabilities + product CRUD, order management, inquiry review, site settings. Assigned by email match against configured admin emails.

---

## 8. Payments & Stripe Integration

### Checkout Flow

```
Cart Page
  → Checkout Page (delivery info, promo code)
  → stripe.createCheckoutSession (server)
  → Stripe Hosted Checkout (external)
  → Webhook: checkout.session.completed
  → Order created, cart cleared, inventory updated
  → Confirmation Page
```

### Key Details

- **Deposit Support:** Custom orders accept partial deposits (configurable percentage per product)
- **Promo Codes:** Percentage or fixed-amount discounts via `promoCodes` table
- **Admin Toggle:** Checkout can be globally enabled/disabled via `siteSettings`
- **Webhook Handler:** `server/webhook.ts` processes `checkout.session.completed` and `payment_intent.succeeded`

---

## 9. AI Chatbot

### Architecture (`server/chatbot.ts` — 753 lines)

1. User opens the floating chat widget → creates a `chatInquiry` record
2. Messages exchanged via `chatbot.sendMessage`:
   - Stores user message in `chatMessages`
   - Sends full conversation history + system prompt to Claude API
   - Stores and returns assistant response
3. Optional image upload for custom portrait orders (→ S3)
4. Admin reviews inquiries via `AdminInquiries` dashboard

### System Prompt

The chatbot acts as a bakery consultant, helping customers describe custom cake/cookie orders — gathering details about flavor, design, size, budget, and delivery date.

### Rate Limiting

Chat messages are rate-limited to prevent abuse of the Claude API.

---

## 10. Testing

**Framework:** Vitest 2.1.4
**Test Files:** 6 files in `server/` (~766 lines, ~29 tests)

| Test File | Coverage |
|---|---|
| `products.test.ts` | Product listing, category filtering, cart operations |
| `valentine.test.ts` | Valentine's tiers, BYO pricing, custom portraits, delivery validation |
| `wishlist.test.ts` | Add/remove/toggle/list wishlist items |
| `admin.test.ts` | Admin access control, product CRUD, order management |
| `auth.logout.test.ts` | Logout, session clearing |
| `chatbot.test.ts` | Inquiry creation, message sending |

### Commands

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests only
```

---

## 11. Deployment

### Four Deployment Targets

| Target | Config | Type |
|---|---|---|
| **Vercel** | `vercel.json` + `api/index.ts` | Serverless + static |
| **Render** | `render.yaml` | Single Node.js service |
| **Docker** | `Dockerfile` (multi-stage) | Container (node:22-alpine) |
| **Railway** | Standard Node.js | PaaS |

### Build Pipeline

```bash
pnpm build
  → vite build          # Client → dist/public/
  → esbuild             # Server → dist/index.js

pnpm start
  → node dist/index.js  # Serves both API and static files
```

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Session token signing |
| `APP_ORIGIN` | Application URL (Stripe redirects) |
| `STRIPE_SECRET_KEY` | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature validation |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `ANTHROPIC_API_KEY` | Claude API for chatbot |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email (passwordless login) |
| `VITE_PUBLIC_POSTHOG_KEY` | PostHog analytics (optional) |
| `VITE_UMAMI_WEBSITE_ID` | Umami analytics (optional) |
| `OAUTH_SERVER_URL` | OAuth portal URL (optional) |
| `VITE_APP_ID` | OAuth app ID (optional) |

### No CI/CD Pipeline

No GitHub Actions workflows are configured. Deployment is manual via the targets above.

---

## 12. Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary Gold | `#e6c78c` | Headings, accents |
| Primary Pink | `#f5a9c1` | Buttons, highlights |
| Primary Purple | `#b19cd9` | Secondary accents |
| Primary Blue | `#a4c4e0` | Links, info elements |
| Pastels | Soft pink, lavender, mint, peach, sky blue | Backgrounds, cards |

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Montserrat (sans-serif)

### Component Library

40+ Radix UI primitives restyled with Tailwind CSS, covering:
- **Form controls:** button, input, checkbox, radio, select, switch, textarea
- **Layout:** card, accordion, tabs, collapsible, drawer
- **Dialogs:** dialog, alert-dialog, hover-card, popover
- **Navigation:** dropdown-menu, context-menu, navigation-menu, command
- **Data display:** table, carousel, progress, slider, badge
- **Date/time:** calendar, date-picker, time-picker, input-otp
- **Feedback:** toast (sonner), alert
- **Charts:** recharts integration

---

## 13. Security

| Area | Implementation |
|---|---|
| **Authentication** | JWT in secure HTTP-only cookies |
| **Authorization** | Role-based middleware on every tRPC procedure |
| **Payments** | PCI-compliant via Stripe (no card data stored) |
| **File Uploads** | Type/size validation, stored on AWS S3 |
| **API Security** | tRPC type-safety prevents injection attacks |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS (production) |
| **CORS** | Configured for allowed domains |
| **Rate Limiting** | Chat message rate limiting |
| **Database** | PostgreSQL with connection pooling via Neon |

---

## 14. Current State & Roadmap

### Completed Features

- Full product catalog: 50+ items across 8 categories
- Shopping cart with persistent storage (guest + authenticated)
- Stripe checkout with webhook-based order creation
- Valentine's Day 2026 collection (tier boxes, Build Your Own, custom portrait pucks)
- AI chatbot for custom order consultations (Claude API)
- Admin dashboard (products, orders, inquiries, contacts, settings)
- Wishlist / favorites
- Gallery page with categorized photos
- FAQ page with Valentine's section
- Passwordless email login + OAuth
- Guest checkout (no login required)
- Security headers and rate limiting
- PostgreSQL migration (from MySQL to Neon)
- Admin checkout toggle
- All 29 tests passing

### Pending / Incomplete

- Product search functionality
- Cross-browser compatibility testing
- Performance optimization
- Real customer testimonials (placeholders in place)
- Order confirmation emails (Stripe receipts are active)
- Academy promo code setup
- Photo review/approval workflow for custom portraits
- Upload confirmation + admin notification emails
- Admin order filtering/search
- Wishlist count in navigation header
- Heart icon on Product Detail page

### Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (Vite + Node)
pnpm build            # Build for production
pnpm start            # Run production build
pnpm test             # Run tests
pnpm format           # Format with Prettier
pnpm check            # Lint + typecheck
pnpm typecheck        # TypeScript validation only
pnpm db:push          # Push schema to PostgreSQL
```

---

**Codebase:** ~14,000+ lines of TypeScript/TSX
**Status:** Production-ready with minor pending features
**Last Updated:** March 22, 2026
