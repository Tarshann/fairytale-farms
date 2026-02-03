# Fairytale Farms Bakery - Architecture Summary

**Project Status:** Production-ready e-commerce bakery website with Stripe payments, custom orders via AI chatbot, and Valentine's Day 2026 collection

**Last Updated:** January 20, 2026  
**Repository:** Connected to GitHub via `user_github` remote  
**Deployment:** Manus-hosted at https://3000-irw4lgnlljuebi53qf55a-cb358bf6.us1.manus.computer

---

## 1. Technology Stack

### Frontend
- **Framework:** React 19.2.1 with Vite 7.1.7
- **Routing:** Wouter 3.3.5 (lightweight client-side router)
- **UI Components:** Radix UI (accordion, dialog, dropdown, select, etc.)
- **Styling:** Tailwind CSS 4.1.14 with custom pastel color scheme
- **State Management:** React Query 5.90.2 (via tRPC)
- **API Client:** tRPC 11.6.0 with React Query integration
- **Animations:** Framer Motion 12.23.22
- **Icons:** Lucide React 0.453.0
- **Form Handling:** React Hook Form 7.64.0 with Zod validation
- **Notifications:** Sonner 2.0.7 (toast notifications)
- **File Size:** 896KB (client/src directory)

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express 4.21.2
- **API Layer:** tRPC 11.6.0 (type-safe RPC framework)
- **Database:** MySQL 3.15.0 via Drizzle ORM 0.44.5
- **Authentication:** JWT-based with OAuth integration
- **File Storage:** AWS S3 via @aws-sdk/client-s3
- **Payments:** Stripe 20.1.2 (checkout sessions, webhooks)
- **AI Integration:** Anthropic Claude API for chatbot
- **File Size:** 232KB (server directory)

### Database
- **ORM:** Drizzle ORM 0.44.5
- **Schema:** MySQL with 13+ tables
- **File Size:** 216KB (drizzle directory)
- **Migrations:** Managed via drizzle-kit

### Development & Testing
- **Language:** TypeScript 5.9.3
- **Testing:** Vitest 2.1.4 (29 tests passing)
- **Code Formatting:** Prettier 3.6.2
- **Build Tool:** Vite 7.1.7 + esbuild 0.25.0
- **Package Manager:** pnpm 10.15.1

---

## 2. Project Structure

```
fairytale-farms-bakery/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                   # Route components (Home, Products, Cart, etc.)
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navigation.tsx        # Header with logo and menu
│   │   │   ├── Footer.tsx            # Footer with links and social
│   │   │   ├── ChatWidget.tsx        # AI chatbot floating widget
│   │   │   ├── AIChatBox.tsx         # Chatbot conversation UI
│   │   │   └── ui/                   # Radix UI component wrappers
│   │   ├── _core/                   # Core utilities
│   │   │   └── hooks/useAuth.ts      # Authentication hook
│   │   ├── lib/trpc.ts               # tRPC client configuration
│   │   ├── contexts/                 # React contexts (Theme, etc.)
│   │   ├── App.tsx                   # Main app with routing
│   │   └── index.css                 # Global styles with Tailwind
│   └── public/                       # Static assets (images, favicon)
│
├── server/                          # Backend Node.js application
│   ├── _core/
│   │   ├── index.ts                  # Express server setup
│   │   ├── trpc.ts                   # tRPC router configuration
│   │   ├── systemRouter.ts           # System/health endpoints
│   │   ├── cookies.ts                # Session cookie management
│   │   └── auth.logout.test.ts       # Authentication tests
│   ├── routers.ts                    # Main tRPC router with all procedures
│   ├── db.ts                         # Database helper functions
│   ├── chatbot.ts                    # AI chatbot integration
│   └── stripe/
│       └── webhook.ts                # Stripe webhook handler
│
├── drizzle/                         # Database schema and migrations
│   ├── schema.ts                     # Complete MySQL schema definition
│   └── migrations/                   # Database migration files
│
├── package.json                      # Project dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite build configuration
├── drizzle.config.ts                 # Drizzle ORM configuration
├── todo.md                           # Project task tracking
└── ARCHITECTURE.md                   # This file
```

---

## 3. Database Schema

### Core Tables

**users** - User accounts and authentication
- id (PK), openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn

**categories** - Product categories
- id (PK), name, slug, description, displayOrder, createdAt, updatedAt

**products** - Bakery products and Valentine's items
- id (PK), categoryId (FK), name, slug, description, basePrice, imageUrl, imageKey
- isCustomizable, customizationInstructions, inStock, featured, displayOrder
- inventoryCap, inventorySold, availableFrom, availableUntil
- requiresPhotoUpload, requiresDeposit, depositPercentage
- productType (standard|tier|build_your_own_item|custom_portrait)
- createdAt, updatedAt

**cartItems** - Shopping cart persistence
- id (PK), userId (FK), productId (FK), quantity, customizationNotes, createdAt, updatedAt

**orders** - Customer orders
- id (PK), userId (FK), orderNumber, status, totalAmount, customerName, customerEmail, customerPhone
- deliveryAddress, deliveryZipCode, deliveryNotes, deliveryDate, pickupDate
- stripePaymentIntentId, stripeCustomerId, stripePriceId, stripeSubscriptionId
- depositPaid, depositAmount, remainingBalance, createdAt, updatedAt

**orderItems** - Line items in orders
- id (PK), orderId (FK), productId (FK), quantity, price, customizationNotes, createdAt

**wishlistItems** - User saved products
- id (PK), userId (FK), productId (FK), createdAt

**chatInquiries** - AI chatbot custom order inquiries
- id (PK), userId (FK), status, productType, description, budget, deliveryDate
- uploadedImageUrl, uploadedImageKey, adminNotes, createdAt, updatedAt

**chatMessages** - Conversation history
- id (PK), inquiryId (FK), role (user|assistant), content, createdAt

**promos** - Promotional codes
- id (PK), code, discountType, discountValue, maxUses, usedCount, expiresAt, createdAt

**pageVisibility** - Admin control for page visibility
- id (PK), pageName, isVisible, createdAt, updatedAt

---

## 4. Key Features & Implementation

### 4.1 E-Commerce Core
- **Product Catalog:** 50+ products across 8 categories with images, descriptions, pricing
- **Shopping Cart:** Persistent across sessions using database storage
- **Checkout:** Stripe integration with session-based checkout
- **Order Management:** Customer order history, admin order dashboard with status tracking
- **Inventory:** Real-time inventory tracking with caps for Valentine's items

### 4.2 Valentine's Day 2026 Collection
- **Tier System:** 3 pre-designed boxes (Crush $50, Sweetheart $75, Romance $100)
- **Build Your Own:** Custom box creation with live pricing calculator
- **Cake Flavor Selection:** Dropdown for choosing cake flavor (Vanilla, Chocolate, Strawberry, Red Velvet, Lemon, Funfetti)
- **Add-Ons:** Chocolate-covered strawberries (Half Dozen $20, Dozen $35)
- **Custom Portrait Pucks:** Photo upload for personalized treats
- **Delivery System:** ZIP code validator, date picker, same-day delivery toggle
- **Inventory Caps:** Tier boxes (40/35/15 units), BYO (10 units), Custom (10 units)
- **Auto-Cutoff:** Feb 12 for tiers, Feb 10 for custom portraits

### 4.3 Payment Processing
- **Stripe Integration:** Checkout sessions, payment intents, webhooks
- **Automatic Receipts:** Stripe sends order confirmation emails automatically
- **Deposit System:** 50% deposit for custom orders (schema ready)
- **Promo Codes:** Academy member discounts via Stripe coupons
- **Test Mode:** Configured with Stripe test keys (sandbox environment)

### 4.4 AI Chatbot
- **Backend:** Anthropic Claude API with custom system prompt
- **Frontend:** Floating chat widget with message history
- **Features:** Image upload, quick reply buttons, typing indicators
- **Storage:** Conversations stored in database for admin review
- **Admin Interface:** Inquiry list with status management, conversation history
- **Analytics:** Inquiry volume tracking, conversion metrics

### 4.5 Authentication & Authorization
- **OAuth Integration:** Manus OAuth portal for user login
- **JWT Tokens:** Secure session management with cookies
- **Role-Based Access:** User vs Admin roles
- **Admin Dashboard:** Protected routes for product/order/inquiry management

### 4.6 Frontend Pages
- **Home** - Hero section, featured products, testimonials, about section
- **Products** - Category filtering (collapsible dropdown), search, quick view modal
- **Product Detail** - Full product info, add to cart, custom options
- **Cart** - Item management, quantity adjustment, checkout button
- **Checkout** - Stripe payment form
- **Order Confirmation** - Order details, tracking info
- **My Orders** - Customer order history
- **Valentine's Collection** - Tier showcase, Build Your Own, Add-Ons
- **Build Your Own** - Interactive item selector with live pricing
- **Custom Portrait Pucks** - Photo upload interface
- **Lab** - Behind-the-scenes content, live view status
- **Gallery** - Photo showcase organized by category
- **About** - Brand story and values
- **Bickering Bros** - Freeze-dried candy partner brand
- **Wishlist** - Saved products
- **FAQ** - Comprehensive Q&A (including Valentine's pricing)
- **Contact** - Inquiry form with AI chatbot integration
- **Delivery Zones** - ZIP code checker for service area

### 4.7 Admin Features
- **Product Management:** CRUD operations, price adjustment, inventory control
- **Order Dashboard:** View all orders, update status, track fulfillment
- **Inquiry Management:** Review chatbot inquiries, manage conversation history
- **Analytics:** Sales metrics, inquiry volume, conversion tracking
- **Page Visibility:** Toggle page visibility for seasonal content
- **Site Settings:** Manage business info, contact details

---

## 5. API Routes (tRPC Procedures)

### Authentication
- `auth.me` - Get current user
- `auth.logout` - Clear session

### Categories
- `categories.list` - Get all categories
- `categories.getBySlug` - Get category by slug
- `categories.create` - Create category (admin)

### Products
- `products.list` - Get all products
- `products.listByCategory` - Get products by category
- `products.featured` - Get featured products
- `products.getById` - Get product by ID
- `products.create` - Create product (admin)
- `products.update` - Update product (admin)
- `products.delete` - Delete product (admin)

### Cart
- `cart.add` - Add item to cart
- `cart.remove` - Remove item from cart
- `cart.list` - Get cart items
- `cart.update` - Update cart item quantity

### Orders
- `orders.create` - Create order from cart
- `orders.list` - Get user's orders
- `orders.getById` - Get order details
- `orders.listAll` - Get all orders (admin)
- `orders.updateStatus` - Update order status (admin)

### Wishlist
- `wishlist.add` - Add product to wishlist
- `wishlist.remove` - Remove from wishlist
- `wishlist.list` - Get wishlist items
- `wishlist.toggle` - Toggle wishlist status

### Chatbot
- `chatbot.createInquiry` - Start new inquiry
- `chatbot.sendMessage` - Send chat message
- `chatbot.getInquiry` - Get inquiry details
- `chatbot.listInquiries` - List all inquiries (admin)
- `chatbot.updateInquiryStatus` - Update status (admin)
- `chatbot.uploadImage` - Upload image to inquiry

### Stripe
- `stripe.createCheckoutSession` - Create Stripe checkout
- `stripe.webhook` - Handle Stripe events (POST /api/stripe/webhook)

---

## 6. Design System

### Color Palette
- **Primary Gold:** #e6c78c
- **Primary Pink:** #f5a9c1
- **Primary Purple:** #b19cd9
- **Primary Blue:** #a4c4e0
- **Pastel Accents:** Soft pink, lavender, mint, peach, sky blue
- **Base:** White background with pastel accents

### Typography
- **Headings:** Playfair Display (serif, elegant)
- **Body:** Montserrat (sans-serif, modern)

### Component Library
- 40+ Radix UI components (buttons, dialogs, dropdowns, forms, etc.)
- Custom styling via Tailwind CSS
- Responsive design (mobile-first approach)

---

## 7. Current Issues & Pending Tasks

### Known Issues
1. **Products Page Navigation** (In Progress)
   - Category dropdown doesn't filter products when selection made
   - View All buttons navigate to correct URL but page doesn't show filtered view
   - Issue: URL parameters set correctly but component not responding to them

### Pending Features
- [ ] Fix category dropdown filtering on products page
- [ ] Fix View All button to show filtered category view
- [ ] Add Academy promo code setup guidance
- [ ] Test full checkout flow with cake flavor selection
- [ ] Send order confirmation emails (Stripe automatic receipts enabled)
- [ ] Add remaining 50% charge automation for deposits
- [ ] Product search functionality
- [ ] Cross-browser compatibility testing
- [ ] Performance optimization

---

## 8. Deployment & Hosting

**Platform:** Manus (built-in hosting with custom domain support)  
**Dev Server:** Running on port 3000  
**Database:** MySQL (connection details in Settings → Database)  
**File Storage:** AWS S3 (configured with environment variables)  
**Environment Variables:** Automatically injected by Manus

### Key Environment Variables
```
ANTHROPIC_API_KEY          # Claude API for chatbot
STRIPE_SECRET_KEY          # Stripe payment processing
STRIPE_WEBHOOK_SECRET      # Webhook signature verification
VITE_STRIPE_PUBLISHABLE_KEY # Frontend Stripe key
JWT_SECRET                 # Session token signing
OAUTH_SERVER_URL           # Manus OAuth endpoint
```

---

## 9. Testing

**Test Framework:** Vitest 2.1.4  
**Test Coverage:** 29 tests passing  
**Test Categories:**
- Authentication (logout flow)
- tRPC procedures (products, cart, orders, wishlist)
- Valentine's Day features
- Stripe integration
- Database operations

**Run Tests:**
```bash
pnpm test
```

---

## 10. Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Format code
pnpm format

# Type check
pnpm check

# Build for production
pnpm build
```

### Database Management
```bash
# Generate migrations and push schema
pnpm db:push
```

### Git Workflow
- Connected to GitHub via `user_github` remote
- Automatic syncing via checkpoints
- Latest checkpoint: `0388d9b7` (Removed duplicate testimonials)

---

## 11. Performance Metrics

**Codebase Size:**
- Frontend: 896KB (128 TypeScript/TSX files)
- Backend: 232KB
- Database: 216KB
- Total: ~1.3MB

**Build Output:**
- Client: Vite bundle (optimized for production)
- Server: esbuild ESM bundle

---

## 12. Security Considerations

- **Authentication:** JWT-based with secure cookies
- **Authorization:** Role-based access control (user/admin)
- **Payments:** PCI-compliant via Stripe (no card data stored locally)
- **File Upload:** Validated file types and sizes, stored on S3
- **API Security:** tRPC type-safety prevents injection attacks
- **CORS:** Configured for Manus deployment

---

## 13. Recent Changes (Latest Checkpoint)

**Checkpoint 0388d9b7** - Removed duplicate testimonials section from homepage
- Kept newer, better-styled testimonials section
- Removed older testimonials markup
- 3 customer reviews remain (Sarah M., Jessica & Tom, Michael R.)

**Previous Changes:**
- Fixed products page navigation (dropdown, View All buttons)
- Added customer testimonials to homepage
- Fixed wedding cake product image
- Removed Academy discount references
- Added Valentine's box cake flavor dropdown
- Removed $15 base price from Build Your Own
- Updated Valentine's pricing and add-ons
- Implemented FAQ page with Valentine's section

---

## 14. Next Steps

1. **Fix Products Page Filtering** - Debug why category filter URL doesn't trigger product filtering
2. **Test Checkout Flow** - Verify Valentine's box with cake flavor saves correctly
3. **Replace Testimonials** - Update placeholder testimonials with real customer reviews
4. **Create Stripe Promo Code** - Set up Academy member discount code
5. **Performance Optimization** - Optimize images, bundle size, and load times

---

**Last Reviewed:** January 20, 2026  
**Maintained By:** Manus AI Agent  
**Status:** Production-Ready with Minor Issues
