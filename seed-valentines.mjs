import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  products,
  categories,
  promoCodes,
  deliveryZones,
} from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

console.log("🌹 Seeding Valentine's Day 2026 products...");

// Get or create Valentine's Day category
let categoryId;
try {
  const [valentinesCategory] = await db.insert(categories).values({
    name: "Valentine's Day 2026",
    slug: "valentines-day-2026",
    description:
      "Special Valentine's Day collection featuring curated tiers, build-your-own options, and custom portrait pucks",
    displayOrder: 0,
  });
  categoryId = valentinesCategory?.insertId;
} catch (error) {
  // Category already exists, fetch it
  const [existing] = await db
    .select()
    .from(categories)
    .where({ slug: "valentines-day-2026" })
    .limit(1);
  categoryId = existing?.id || 1;
}

console.log(`Using category ID: ${categoryId}`);

// Valentine's Day dates
const launchDate = new Date("2026-01-26T00:00:00");
const tierCutoff = new Date("2026-02-12T23:59:59");
const customCutoff = new Date("2026-02-10T23:59:59");

console.log("Creating Valentine's Day tier products...");

// Tier 1: Sweet Beginnings - $28
try {
  await db.insert(products).values({
    categoryId,
    name: "Sweet Beginnings",
    slug: "sweet-beginnings-tier",
    description: `Perfect for first dates, Galentine's gatherings, or "just because" sweetness. Classic cookies meet modern craft.

**Includes:**
- 6 Chocolate Chip Cookies
- 6 Meringue Cookies
- 3 Valentine Oreo Pucks
- Custom Cricut packaging

**Academy Members: 20% off**`,
    basePrice: "28.00",
    imageUrl: "/images/tier1-sweet-beginnings.jpg",
    isCustomizable: false,
    inStock: true,
    featured: true,
    displayOrder: 1,
    inventoryCap: 40,
    inventorySold: 0,
    availableFrom: launchDate,
    availableUntil: tierCutoff,
    requiresPhotoUpload: false,
    requiresDeposit: false,
    productType: "tier",
  });
  console.log("Created: Sweet Beginnings");
} catch (e) {
  console.log("Sweet Beginnings already exists, skipping");
}

// Tier 2: Love Story - $52
try {
  await db.insert(products).values({
    categoryId,
    name: "Love Story",
    slug: "love-story-tier",
    description: `The complete Fairytale Farms experience. Where our signature dam-system royal icing meets chocolate-dipped decadence.

**Includes:**
- 6 Royal Icing Sugar Cookies (Classic Heart + XOXO designs)
- 4 Valentine Oreo Pucks
- 6 Chocolate-Covered Strawberries
- 3 Mini Brownies with Ganache
- Small freeze-dried candy bag
- Premium Cricut packaging

**Academy Members: 20% off**`,
    basePrice: "52.00",
    imageUrl: "/images/tier2-love-story.jpg",
    isCustomizable: false,
    inStock: true,
    featured: true,
    displayOrder: 2,
    inventoryCap: 35,
    inventorySold: 0,
    availableFrom: launchDate,
    availableUntil: tierCutoff,
    requiresPhotoUpload: false,
    requiresDeposit: false,
    productType: "tier",
  });
  console.log("Created: Love Story");
} catch (e) {
  console.log("Love Story already exists, skipping");
}

// Tier 3: Fairytale Romance - $85
try {
  await db.insert(products).values({
    categoryId,
    name: "Fairytale Romance",
    slug: "fairytale-romance-tier",
    description: `Go all-in with our flagship showcase: mini cake centerpiece, full cookie variety, premium freeze-dried treats, and packaging that says "you're worth it."

**Includes:**
- 1 Mini Cake (vanilla birthday, chocolate, or strawberry crunch)
- 6 Royal Icing Sugar Cookies (2 each: Heart, XOXO, Cupid/Arrow)
- 6 Valentine Oreo Pucks
- 8 Chocolate-Covered Strawberries
- 4 Brownies with Ganache
- Large freeze-dried candy bag
- Deluxe Cricut packaging + message card

**Academy Members: 20% off**`,
    basePrice: "85.00",
    imageUrl: "/images/tier3-fairytale-romance.jpg",
    isCustomizable: true,
    customizationInstructions:
      "Select your mini cake flavor: Vanilla Birthday, Chocolate, or Strawberry Crunch",
    inStock: true,
    featured: true,
    displayOrder: 3,
    inventoryCap: 15,
    inventorySold: 0,
    availableFrom: launchDate,
    availableUntil: tierCutoff,
    requiresPhotoUpload: false,
    requiresDeposit: false,
    productType: "tier",
  });
  console.log("Created: Fairytale Romance");
} catch (e) {
  console.log("Fairytale Romance already exists, skipping");
}

console.log("Creating Build-Your-Own items (Vday Flyer)...");

// Build-Your-Own items per Valentine's flyer (HANDOFF.md / update-valentines-pricing.mjs)
const byoItems = [
  { name: "Mini Cake (Chocolate)", slug: "mini-cake-chocolate", price: "12.00", description: "Rich chocolate cake with chocolate frosting in a mini tin" },
  { name: "Mini Cake (Vanilla Confetti)", slug: "mini-cake-vanilla-confetti", price: "12.00", description: "Classic vanilla cake with sprinkles and vanilla frosting in a mini tin" },
  { name: "Mini Cake (Strawberry)", slug: "mini-cake-strawberry", price: "12.00", description: "Strawberry cake with strawberry crunch topping in a mini tin" },
  { name: "5-oz Brownie with Ganache", slug: "brownie-with-ganache", price: "6.00", description: "Rich, fudgy brownie topped with chocolate ganache" },
  { name: "Chocolate-Covered Strawberries (Half Dozen)", slug: "chocolate-strawberries-half-dozen", price: "20.00", description: "Six hand-dipped strawberries in milk or white chocolate with Valentine's decorations" },
  { name: "Chocolate-Covered Strawberries (Dozen)", slug: "chocolate-strawberries-dozen", price: "35.00", description: "Twelve hand-dipped strawberries in milk or white chocolate with Valentine's decorations" },
  { name: "Valentine's Oreo Pucks (2-pack)", slug: "valentine-oreo-pucks-2", price: "5.50", description: "Two chocolate-covered Oreos with Valentine's decorations" },
  { name: "Valentine's Oreo Pucks (4-pack)", slug: "valentine-oreo-pucks-4", price: "10.00", description: "Four chocolate-covered Oreos with Valentine's decorations" },
  { name: "Chocolate Chip Cookies (2-pack)", slug: "chocolate-chip-cookies-2", price: "4.00", description: "Two classic chocolate chip cookies" },
  { name: "Chocolate Chip Cookies (6-pack)", slug: "chocolate-chip-cookies-6", price: "10.00", description: "Six classic chocolate chip cookies" },
  { name: "Freeze-Dried Candy (Mini Bag)", slug: "freeze-dried-candy-mini", price: "5.00", description: "Mini bag - choice of Skittles, Nerd Gummies, or Airheads" },
  { name: "Freeze-Dried Candy (Small Bag)", slug: "freeze-dried-candy-small", price: "8.00", description: "Small bag - choice of Skittles, Nerd Gummies, or Airheads" },
  { name: "Freeze-Dried Candy (Large Bag)", slug: "freeze-dried-candy-large", price: "12.00", description: "Large bag - choice of Skittles, Nerd Gummies, or Airheads" },
];

let displayOrder = 10;
for (const item of byoItems) {
  try {
    await db.insert(products).values({
      categoryId,
      name: item.name,
      slug: item.slug,
      description: item.description,
      basePrice: item.price,
      imageUrl: `/images/${item.slug}.jpg`,
      isCustomizable: false,
      inStock: true,
      featured: false,
      displayOrder: displayOrder++,
      availableFrom: launchDate,
      availableUntil: tierCutoff,
      requiresPhotoUpload: false,
      requiresDeposit: false,
      productType: "build_your_own_item",
    });
    console.log(`Created: ${item.name} - $${item.price}`);
  } catch (error) {
    console.log(`  - ${item.name} already exists, skipping`);
  }
}

console.log("Creating Custom Portrait Pucks product...");

// Custom Portrait Pucks
try {
  await db.insert(products).values({
    categoryId,
    name: "Custom Portrait Pucks",
    slug: "custom-portrait-pucks",
    description: `Turn your favorite photo into an edible keepsake.

Using projection technology exclusive to Fairytale Farms, we transform your memories into hand-traced Oreo masterpieces.

**Perfect for:**
- Anniversary photos
- Family portraits
- Pet tributes
- Engagement announcements

**Pricing:** $8 per puck | 6-puck minimum ($48)

**Requirements:**
- 72-hour advance order required
- 50% deposit at booking
- High-resolution photo (minimum 1MB)
- Order cutoff: February 10, 2026
- Photo submission within 24 hours of order

**Delivery:** Scheduled delivery only (Feb 13-14)`,
    basePrice: "8.00",
    imageUrl: "/images/custom-portrait-pucks.jpg",
    isCustomizable: true,
    customizationInstructions:
      "Upload your high-resolution photo (JPG or PNG, minimum 1MB). Photo must show clear faces and good lighting.",
    inStock: true,
    featured: true,
    displayOrder: 4,
    inventoryCap: 10, // 10 orders max
    inventorySold: 0,
    availableFrom: launchDate,
    availableUntil: customCutoff,
    requiresPhotoUpload: true,
    requiresDeposit: true,
    depositPercentage: 50,
    productType: "custom_portrait",
  });
  console.log("Created: Custom Portrait Pucks");
} catch (e) {
  console.log("Custom Portrait Pucks already exists, skipping");
}

console.log("Creating promo codes...");

// Academy Member Promo Code
try {
  await db.insert(promoCodes).values({
    code: "ACADEMY2026",
    description:
      "Academy member exclusive: 20% off tier boxes, 15% off build-your-own",
    discountType: "percentage",
    discountValue: "20.00",
    validFrom: launchDate,
    validUntil: new Date("2026-02-14T23:59:59"),
    applicableProductTypes: JSON.stringify(["tier", "build_your_own_item"]),
    isActive: true,
  });
} catch (e) {
  console.log("ACADEMY2026 promo code already exists");
}

// Returning Customer Promo Code
try {
  await db.insert(promoCodes).values({
    code: "FAIRYTALEFAM15",
    description: "Returning customer discount: 15% off all products",
    discountType: "percentage",
    discountValue: "15.00",
    validFrom: launchDate,
    validUntil: new Date("2026-02-14T23:59:59"),
    applicableProductTypes: JSON.stringify([
      "tier",
      "build_your_own_item",
      "custom_portrait",
    ]),
    isActive: true,
  });
} catch (e) {
  console.log("FAIRYTALEFAM15 promo code already exists");
}

// General Valentine's Promo
try {
  await db.insert(promoCodes).values({
    code: "LOVE2026",
    description: "Valentine's Day special: 10% off",
    discountType: "percentage",
    discountValue: "10.00",
    validFrom: launchDate,
    validUntil: new Date("2026-02-14T23:59:59"),
    applicableProductTypes: JSON.stringify(["tier", "build_your_own_item"]),
    isActive: true,
  });
} catch (e) {
  console.log("LOVE2026 promo code already exists");
}

console.log("Creating delivery zones...");

// Delivery zones (30-mile radius from 37031 Goodlettsville, TN)
const zipCodes = [
  { zip: "37031", city: "Goodlettsville", state: "TN" },
  { zip: "37072", city: "Goodlettsville", state: "TN" },
  { zip: "37073", city: "Greenbrier", state: "TN" },
  { zip: "37115", city: "Madison", state: "TN" },
  { zip: "37138", city: "Old Hickory", state: "TN" },
  { zip: "37186", city: "Springfield", state: "TN" },
  { zip: "37189", city: "White House", state: "TN" },
  { zip: "37027", city: "Brentwood", state: "TN" },
  { zip: "37067", city: "Franklin", state: "TN" },
  { zip: "37068", city: "Franklin", state: "TN" },
  { zip: "37069", city: "Franklin", state: "TN" },
  { zip: "37122", city: "Mount Juliet", state: "TN" },
  { zip: "37127", city: "Murfreesboro", state: "TN" },
  { zip: "37135", city: "Nolensville", state: "TN" },
  { zip: "37143", city: "Spring Hill", state: "TN" },
];

// Nashville core ZIP codes (37201-37250)
for (let i = 201; i <= 250; i++) {
  zipCodes.push({
    zip: `372${i.toString().padStart(2, "0")}`,
    city: "Nashville",
    state: "TN",
  });
}

for (const zone of zipCodes) {
  try {
    await db.insert(deliveryZones).values({
      zipCode: zone.zip,
      city: zone.city,
      state: zone.state,
      isActive: true,
      deliveryFee: "0.00", // Free delivery
    });
  } catch (e) {
    /* Zone already exists */
  }
}

console.log("✅ Valentine's Day 2026 seed completed!");
console.log(`- Created 3 tier products`);
console.log(`- Created ${byoItems.length} build-your-own items (Vday flyer)`);
console.log(`- Created custom portrait pucks product`);
console.log(`- Created 3 promo codes`);
console.log(`- Created ${zipCodes.length} delivery zones`);

await pool.end();
