import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { products, categories } from "./drizzle/schema.ts";
import { eq, sql } from "drizzle-orm";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// mysql2 expects ssl to be an object when using TLS; URL with ?ssl=true breaks otherwise
const url = new URL(DATABASE_URL);
const connectionConfig = {
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1).replace(/\?.*$/, "") || undefined,
  ssl: url.searchParams.get("ssl") === "true" ? { rejectUnauthorized: true } : undefined,
};
const connection = await mysql.createConnection(connectionConfig);
const db = drizzle(connection);

console.log("Updating Valentine's Day 2026 products to match flyer pricing...\n");

// Valentine's Day dates
const launchDate = new Date("2026-01-26T00:00:00");
const tierCutoff = new Date("2026-02-12T23:59:59");
const customCutoff = new Date("2026-02-10T23:59:59");

// Get Valentine's category
const [valentinesCategory] = await db
  .select()
  .from(categories)
  .where(eq(categories.slug, "valentines-day-2026"))
  .limit(1);

if (!valentinesCategory) {
  console.error("Valentine's Day 2026 category not found!");
  process.exit(1);
}

const categoryId = valentinesCategory.id;
console.log(`Found Valentine's category ID: ${categoryId}\n`);

// ========================================
// UPDATE TIER BOXES TO MATCH FLYER
// ========================================

console.log("Updating tier boxes...\n");

// Fairytale Crush Box - $50 (was Sweet Beginnings $28)
try {
  await db.execute(sql`
    UPDATE ${products}
    SET
      name = 'Fairytale Crush Box',
      slug = 'fairytale-crush-box',
      description = 'Perfect for showing someone you care! A sweet collection of our signature treats.

**Includes:**
- One Mini Cake (choice of chocolate, vanilla confetti, or strawberry)
- One 5-oz Brownie with chocolate ganache
- Three Chocolate-Covered Strawberries
- Two Valentine''s Oreo Pucks
- Two Chocolate Chip Cookies
- One Mini Bag of Freeze-Dried Candy (Skittles, Nerd Gummies, or Airheads)

**Order by February 12 for Valentine''s delivery**',
      basePrice = '50.00',
      imageUrl = '/images/valentine-treats-box.jpg',
      isCustomizable = true,
      customizationInstructions = 'Select your mini cake flavor: Chocolate, Vanilla Confetti, or Strawberry. Select your freeze-dried candy: Skittles, Nerd Gummies, or Airheads.',
      inventoryCap = 40,
      displayOrder = 1
    WHERE slug = 'sweet-beginnings-tier'
  `);
  console.log("Updated: Sweet Beginnings -> Fairytale Crush Box ($50)");
} catch (e) {
  console.log("Fairytale Crush Box update failed or already exists:", e.message);
}

// Fairytale Sweetheart Box - $75 (was Love Story $52)
try {
  await db.execute(sql`
    UPDATE ${products}
    SET
      name = 'Fairytale Sweetheart Box',
      slug = 'fairytale-sweetheart-box',
      description = 'Our most popular box! The perfect balance of variety and value.

**Includes:**
- Two Mini Cakes (choice of chocolate, vanilla confetti, or strawberry)
- Two 5-oz Brownies with chocolate ganache
- Six Chocolate-Covered Strawberries
- Two Valentine''s Oreo Pucks
- Four Chocolate Chip Cookies
- One Small Bag of Freeze-Dried Candy

**Order by February 12 for Valentine''s delivery**',
      basePrice = '75.00',
      imageUrl = '/images/valentine-dessert-box.jpg',
      isCustomizable = true,
      customizationInstructions = 'Select your mini cake flavors: Chocolate, Vanilla Confetti, or Strawberry',
      inventoryCap = 35,
      displayOrder = 2
    WHERE slug = 'love-story-tier'
  `);
  console.log("Updated: Love Story -> Fairytale Sweetheart Box ($75)");
} catch (e) {
  console.log("Fairytale Sweetheart Box update failed or already exists:", e.message);
}

// Fairytale Romance Box - $100 (was Fairytale Romance $85)
try {
  await db.execute(sql`
    UPDATE ${products}
    SET
      name = 'Fairytale Romance Box',
      slug = 'fairytale-romance-box',
      description = 'Our ultimate Valentine''s experience! Everything you need to make their day unforgettable.

**Includes:**
- Three Mini Cakes (choice of chocolate, vanilla confetti, or strawberry)
- Two 5-oz Brownies with chocolate ganache
- One Dozen Chocolate-Covered Strawberries
- Four Valentine''s Oreo Pucks
- Six Chocolate Chip Cookies
- One Large Bag of Freeze-Dried Candy (Skittles, Nerd Gummies, or Airheads)

**Order by February 12 for Valentine''s delivery**',
      basePrice = '100.00',
      imageUrl = '/images/valentine-cookie-box.jpg',
      isCustomizable = true,
      customizationInstructions = 'Select your mini cake flavors: Chocolate, Vanilla Confetti, or Strawberry. Select your freeze-dried candy: Skittles, Nerd Gummies, or Airheads.',
      inventoryCap = 15,
      displayOrder = 3
    WHERE slug = 'fairytale-romance-tier'
  `);
  console.log("Updated: Fairytale Romance -> Fairytale Romance Box ($100)");
} catch (e) {
  console.log("Fairytale Romance Box update failed or already exists:", e.message);
}

// ========================================
// UPDATE/CREATE BUILD-YOUR-OWN ITEMS
// ========================================

console.log("\nUpdating Build-Your-Own items...\n");

// Update existing items or create new ones
const byoItems = [
  {
    name: "Mini Cake (Chocolate)",
    slug: "mini-cake-chocolate",
    price: "12.00",
    description: "Rich chocolate cake with chocolate frosting in a mini tin"
  },
  {
    name: "Mini Cake (Vanilla Confetti)",
    slug: "mini-cake-vanilla-confetti",
    price: "12.00",
    description: "Classic vanilla cake with sprinkles and vanilla frosting in a mini tin"
  },
  {
    name: "Mini Cake (Strawberry)",
    slug: "mini-cake-strawberry",
    price: "12.00",
    description: "Strawberry cake with strawberry crunch topping in a mini tin"
  },
  {
    name: "5-oz Brownie with Ganache",
    slug: "brownie-with-ganache",
    price: "6.00",
    description: "Rich, fudgy brownie topped with chocolate ganache"
  },
  {
    name: "Chocolate-Covered Strawberries (Half Dozen)",
    slug: "chocolate-strawberries-half-dozen",
    price: "20.00",
    description: "Six hand-dipped strawberries in milk or white chocolate with Valentine's decorations"
  },
  {
    name: "Chocolate-Covered Strawberries (Dozen)",
    slug: "chocolate-strawberries-dozen",
    price: "35.00",
    description: "Twelve hand-dipped strawberries in milk or white chocolate with Valentine's decorations"
  },
  {
    name: "Valentine's Oreo Pucks (2-pack)",
    slug: "valentine-oreo-pucks-2",
    price: "5.50",
    description: "Two chocolate-covered Oreos with Valentine's decorations"
  },
  {
    name: "Valentine's Oreo Pucks (4-pack)",
    slug: "valentine-oreo-pucks-4",
    price: "10.00",
    description: "Four chocolate-covered Oreos with Valentine's decorations"
  },
  {
    name: "Chocolate Chip Cookies (2-pack)",
    slug: "chocolate-chip-cookies-2",
    price: "4.00",
    description: "Two classic chocolate chip cookies"
  },
  {
    name: "Chocolate Chip Cookies (6-pack)",
    slug: "chocolate-chip-cookies-6",
    price: "10.00",
    description: "Six classic chocolate chip cookies"
  },
  {
    name: "Freeze-Dried Candy (Mini Bag)",
    slug: "freeze-dried-candy-mini",
    price: "5.00",
    description: "Mini bag - choice of Skittles, Nerd Gummies, or Airheads"
  },
  {
    name: "Freeze-Dried Candy (Small Bag)",
    slug: "freeze-dried-candy-small",
    price: "8.00",
    description: "Small bag - choice of Skittles, Nerd Gummies, or Airheads"
  },
  {
    name: "Freeze-Dried Candy (Large Bag)",
    slug: "freeze-dried-candy-large",
    price: "12.00",
    description: "Large bag - choice of Skittles, Nerd Gummies, or Airheads"
  },
];

// First, delete old BYO items that don't match
await db.execute(sql`
  DELETE FROM ${products}
  WHERE productType = 'build_your_own_item'
  AND categoryId = ${categoryId}
`);
console.log("Cleared old Build-Your-Own items");

// Insert new BYO items
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
    console.log(`  - ${item.name} error:`, error.message);
  }
}

// ========================================
// SUMMARY
// ========================================

console.log("\n========================================");
console.log("Valentine's Day 2026 Update Complete!");
console.log("========================================\n");

console.log("TIER BOXES:");
console.log("  - Fairytale Crush Box: $50");
console.log("  - Fairytale Sweetheart Box: $75");
console.log("  - Fairytale Romance Box: $100");
console.log("\nBUILD-YOUR-OWN ITEMS:");
byoItems.forEach(item => {
  console.log(`  - ${item.name}: $${item.price}`);
});

console.log("\nSTRAWBERRIES ADD-ON:");
console.log("  - Half Dozen (6): $20");
console.log("  - Dozen (12): $35");

console.log("\nIMPORTANT: Order by February 12 for Valentine's delivery!");

await connection.end();
