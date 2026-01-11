# Fairytale Farms Bakery - Project TODO

## Database Schema & Infrastructure
- [x] Design and implement products table with categories, pricing, descriptions, and customization options
- [x] Create cart items table for persistent shopping cart storage
- [x] Design orders table with customer information and order status tracking
- [x] Create order items table for order line items
- [x] Setup Stripe integration with payment processing
- [x] Migrate all product images to S3 storage (copied to public directory)
- [x] Create database helper functions for products, cart, and orders

## Product Catalog & Management
- [x] Implement product categories: Customized Cakes, Customized Sugar Cookies, Cinnamon Buns, Cake Pops, Brownies, Cheesecake, Chocolate Covered Strawberries
- [x] Build product listing page with category filtering
- [x] Create product detail pages with images, descriptions, and pricing
- [x] Add customization options interface for personalized orders
- [ ] Implement product search functionality
- [x] Build admin product management (add, edit, delete, inventory control)

## Shopping Cart & Checkout
- [x] Build shopping cart with add/remove items functionality
- [x] Implement quantity adjustment in cart
- [x] Create persistent cart storage across sessions
- [x] Build Stripe checkout integration
- [x] Implement secure payment processing
- [x] Create order confirmation page
- [ ] Send order confirmation emails to customers
- [x] Handle payment success and failure scenarios

## Order Management System
- [x] Build customer order history page
- [x] Implement order status tracking (pending, processing, completed, cancelled)
- [x] Create order detail view for customers
- [x] Build admin order management dashboard
- [x] Implement order status update functionality for admins
- [ ] Add order filtering and search for admins

## Admin Dashboard
- [x] Create admin-only access control using role-based permissions
- [x] Build product management interface (CRUD operations)
- [x] Implement inventory management system
- [x] Create pricing management interface
- [x] Build order management view with all customer orders
- [x] Add sales analytics and reporting
- [ ] Implement admin notification system for new orders

## Frontend Design & Styling
- [x] Setup brand color scheme: Gold #e6c78c, Pink #f5a9c1, Purple #b19cd9, Blue #a4c4e0
- [x] Implement Playfair Display font for headings
- [x] Implement Montserrat font for body text
- [x] Create elegant, premium aesthetic design system
- [x] Design responsive navigation for mobile and desktop
- [x] Build homepage with hero section and featured products
- [x] Create product gallery with bakery photos
- [x] Implement whimsical fairy tale design elements
- [x] Ensure mobile-responsive design across all pages

## Additional Features
- [x] Build contact page with business information
- [x] Create customer inquiry form
- [ ] Add social media integration
- [x] Implement user authentication and account management
- [x] Create user profile page
- [ ] Add product image lightbox/zoom functionality
- [x] Implement loading states and error handling
- [x] Add toast notifications for user actions

## Testing & Quality Assurance
- [x] Write vitest tests for all tRPC procedures
- [x] Test shopping cart functionality across sessions
- [x] Verify Stripe payment integration
- [x] Test admin dashboard access control
- [x] Verify order management workflow
- [x] Test responsive design on mobile and desktop
- [ ] Cross-browser compatibility testing
- [ ] Performance optimization

## Final Delivery
- [x] Create comprehensive project checkpoint
- [x] Verify all features are working correctly
- [ ] Prepare deployment documentation
- [x] Deliver completed website to user

## Valentine's Day 2026 Launch Customizations

### Product System
- [x] Create Valentine's Day tier products (Sweet Beginnings $28, Love Story $52, Fairytale Romance $85)
- [x] Implement Build-Your-Own system with base box + individual item pricing
- [x] Add Custom Portrait Pucks product with photo upload functionality
- [x] Setup product inventory caps (Tier 1: 40, Tier 2: 35, Tier 3: 15, BYO: 10, Custom: 10)
- [x] Implement auto-cutoff dates (Feb 12 for tiers, Feb 10 for custom portraits)

### Payment & Deposits
- [x] Implement 50% deposit system for custom portrait orders (schema ready)
- [ ] Add automated remaining 50% charge 24 hours before delivery
- [x] Setup Academy member promo codes (20% off tiers, 15% off BYO)
- [x] Add returning customer discount codes (15% off all)

### Photo Upload System
- [x] Build photo upload widget for custom portrait pucks page
- [x] Accept JPG/PNG formats with minimum 1MB file size
- [ ] Send upload confirmation email to customer
- [ ] Send admin notification when photo uploaded
- [ ] Add photo review/approval workflow

### Delivery System
- [x] Build delivery zone checker (ZIP code validator for 30-mile radius from 37031)
- [x] Add delivery date picker for Feb 13-14
- [x] Implement same-day delivery toggle for tier/BYO orders
- [x] Setup scheduled-only delivery for custom portrait orders
- [x] Display covered ZIP codes list

### Frontend Updates
- [x] Create Valentine's Day collection landing page
- [x] Build individual tier product pages with detailed contents
- [x] Create Build-Your-Own interactive page with live pricing calculator
- [x] Design Custom Portrait Pucks page with upload interface
- [x] Add Valentine's Day hero banner to homepage
- [x] Update branding with whimsical "Welcome to Fairytale Farms" messaging
- [x] Removed equipment moat messaging (projection tech, 3D dam system, freeze dryer)

### Admin Features
- [x] Add real-time inventory counter in admin dashboard
- [ ] Build photo review interface for custom portrait orders
- [x] Add order management for scheduled deliveries
- [x] Implement promo code usage tracking

### Design Updates
- [x] Update color scheme to white base with pastel rainbow accents (soft pink, lavender, mint, peach, sky blue)

### Testing
- [x] Write vitest tests for Valentine's Day features (12 tests passing)
- [x] All 29 tests passing


## Homepage & Navigation Updates (New Request)
- [x] Organize images into category galleries (Cake Gallery, Cookie Gallery, etc.)
- [x] Add a few product images for each gallery section
- [x] Add comprehensive sidebar menu with all categories
- [x] Remove all technology references (projection tech, 3D dam system, freeze dryer)
- [x] Make branding fun and whimsical instead of tech-focused
- [x] Remove prices from main page - show only when clicking products
- [x] Update hero section to be whimsical without tech messaging


## Gallery Layout Update
- [x] Change homepage galleries from 4 images to 1 image per category

- [x] Reduce gallery image sizes - images are too big
- [x] Reorganize products page with clean categorized layout


## Products Page Enhancements
- [x] Add search bar to top of Products page
- [x] Implement filtering system for products
- [x] Add quick view button to each product card
- [x] Create quick view modal with product details
- [x] Update stock images to be relevant to each category


## Wishlist/Favorites Feature
- [x] Add wishlist table to database schema
- [x] Create database helper functions for wishlist operations
- [x] Add tRPC procedures for add/remove/list wishlist items
- [x] Add heart icon toggle to product cards on Products page
- [x] Add heart icon to Quick View modal
- [ ] Add heart icon to Product Detail page
- [x] Create dedicated Wishlist page to view saved products
- [x] Add wishlist link to navigation
- [ ] Show wishlist count in header


## "In the Lab with Fairytale Farms" Section
- [x] Create dedicated Lab page (/lab or /behind-the-magic)
- [x] Add header with title and one-liner tagline
- [x] Build "Live View" tile with status indicator (Live/Offline)
- [x] Build "This Week's Builds" tile with 3 small cards
- [x] Create "How it becomes cookies" mini timeline (Design → Print → Test → Bake → Decorate)
- [x] Add video/clip embed area for printer footage
- [x] Add cute offline fallback message
- [x] Create CTA linking to custom cookie orders
- [x] Add Lab link to main navigation
- [x] Add Lab teaser section on homepage


## Logo Update
- [x] Add official Fairytale Farms logo to website
- [x] Update navigation header with logo image
- [x] Set logo as favicon
