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


## Logo, Footer & About Page Improvements
- [x] Create transparent PNG version of the logo (remove white background)
- [x] Add logo to footer section with contact information
- [x] Create "About Fairytale Farms" page with brand story
- [x] Add About page link to navigation


## Bickering Bros Candy Co Section
- [x] Save Bickering Bros logo to project assets
- [x] Create transparent PNG version of logo (remove black background)
- [x] Create dedicated Bickering Bros page with logo and products
- [x] Add freeze-dried candy category to database
- [x] Add sample freeze-dried candy products
- [x] Add Bickering Bros link to navigation
- [x] Add Bickering Bros teaser section on homepage

- [x] Update Fairytale Farms logo to new castle design


## Gallery Page with Categories
- [x] Analyze and categorize uploaded photos
- [x] Copy photos to project assets with proper naming
- [x] Create Gallery page with category sections (cakes, cupcakes, cake pops, cookies, etc.)
- [x] Update main page with best featured images
- [x] Link "View All" to the gallery page


## Custom Pucks & Main Page Updates- [x] Change 'Custom Portrait Pucks' to 'Custom Pucks' at $4wer Custom Pucks price to $4
- [x] Add option to select custom portrait pucks (higher price)ain page with best gallery images
- [x] Show only Cakes, Cookies, Sugar Cookies, and Brownies on main page

- [x] Add admin page visibility toggle feature (show/hide pages)

- [x] Update location from Goodlettsville/Nashville to Castalian Springs, Sumner County
- [x] Add DoorDash and Uber Eats delivery info


## Pricing, Admin Toggle & Links Update
- [x] Update Custom Cakes pricing (6-inch $75, 8-inch $110, Two-tier $150-$210)
- [x] Update Sugar Cookies pricing ($55/dozen)
- [x] Update Chocolate Strawberries pricing ($30/dozen)
- [x] Add brownie varieties (Simple, Turtle, S'mores)
- [x] Add cookie varieties (Chocolate Chip, Crinkle, Sprinkle Sugar, Pecan Sandies, Meringue)
- [x] Add admin page visibility toggle feature
- [x] Check and fix all navigation links
- [x] Fix any broken redirects

- [x] Admin: Add price adjustment feature for products
- [x] Admin: Add quantity/inventory adjustment feature

## Final Pricing Update (Jan 2026)
- [x] Update all product prices from Fairytale_Farms_Menu_Pricing_FINAL.pdf
- [x] Custom Cakes: 6-inch $75, 8-inch $110, Two-tier 6+4 $150, Two-tier 8+6 $210
- [x] Custom Sugar Cookies: $55/dozen
- [x] Mini Tin Cakes: $5 each (Chocolate, Vanilla, Strawberry Crunch)
- [x] Brownies: Simple $4, Turtle $5, S'mores $5
- [x] Classic Cookies: Chocolate Chip $18/doz, Crinkle $20/doz, Sprinkle Sugar $18/doz, Pecan Sandies $20/doz
- [x] Chocolate Strawberries: Half dozen $18, Dozen $30
- [x] Verify admin Site Settings page has price adjustment controls
- [x] Verify admin Site Settings page has page visibility toggles
- [x] Test all navigation links throughout site


## Stripe Checkout Verification
- [x] Test product add to cart functionality
- [x] Test checkout button goes to Stripe
- [x] Verify Stripe checkout is functional
- [x] Test order completion flow

## Link Fixes (Jan 2026)
- [x] Fixed product detail route mismatch (/product/:slug → /products/:slug)
- [x] Fixed Valentine's tier product links to use correct route
- [x] Verified all product links go to detail pages
- [x] Verified checkout flow goes directly to Stripe


## Product Images Update
- [x] Audit all products for missing images
- [x] Match available uploaded images to products
- [x] Update product images in database
- [x] Verify all non-Valentine's products have images


## Contact Information Update
- [x] Update email to fairytalefarms.net@gmail.com
- [x] Remove phone number (online only business)

- [x] Add stock images for Valentine's Day boxes and treats
- [x] Add stock puck photo for custom puck section
- [x] Add stock images for Build Your Own box items

## Price Update
- [x] Update freeze-dried candy (small) price from $7 to $5
- [x] Update freeze-dried candy (large) price from $8 to $5
- [x] Update all freeze-dried candy varieties to $5


## AI Custom Order Chatbot

### Phase 1 (Essential)
- [x] Design chatbot database schema for storing custom order inquiries
- [x] Create backend API endpoint for chatbot using Anthropic Claude
- [x] Build frontend chatbot UI component (floating chat widget)
- [x] Add system prompt with product catalog and ordering rules
- [x] Store chat conversations and order details in database
- [x] Admin inquiry list with status management
- [x] Test chatbot functionality

### Phase 1.5 (Image Upload)
- [x] Add image upload button to chatbot UI
- [x] Create backend endpoint for image uploads
- [x] Store uploaded images with inquiry in database
- [x] Display uploaded images in admin inquiry view
- [x] Test image upload functionality


### Phase 2 (Enhanced UX)
- [x] Add quick reply buttons for common responses (Custom Cake, Cookies, Other Treats)
- [x] Add conversation history view to admin inquiries page
- [x] Add typing indicator while AI responds
- [x] Add message timestamps
- [x] Improve chat styling and animations
- [x] Test Phase 2 features


### Phase 3 (Advanced)
- [x] Add analytics dashboard (inquiry volume by day/week, conversion rates, popular products)
- [x] Add quick response templates for admin
- [x] Add bulk status updates functionality
- [x] Add overdue follow-up reminders (24hr SLA warning)
- [x] Test Phase 3 features


## Gallery Updates
- [x] Remove "Strawberry ONE First Birthday Cake" from gallery
- [x] Remove "John Deere Tractor Birthday - Henry" from gallery
- [x] Move "Happily Ever After Wedding Cake" to first position in gallery


## Bug Fixes
- [x] Fix out-of-stock products still appearing on products page
- [x] Replace Custom Shaped Sugar Cookie image (shows cake instead of cookie)
- [x] Fix brownie section showing 4 duplicate images - show only one
