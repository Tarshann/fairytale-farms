import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { products } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Canonical main-menu pricing (aligns with pricing-reference-final.md / Fairytale_Farms_Menu_Pricing_FINAL.pdf).
// Run this script to sync product basePrice in the DB. Valentine's products use update-valentines-pricing.mjs.
const priceUpdates = [
  // Custom Cakes
  { slug: "custom-birthday-cake", price: "75.00" }, // 6-inch starting at $75
  { slug: "wedding-cake", price: "150.00" }, // Two-tier 6+4 starting at $150
  { slug: "themed-celebration-cake", price: "110.00" }, // 8-inch starting at $110

  // Custom Sugar Cookies - $55 per dozen
  { slug: "decorated-sugar-cookies-dozen", price: "55.00" },
  { slug: "custom-shaped-sugar-cookies", price: "55.00" },

  // Brownies - Simple $4, Turtle/S'mores $5
  { slug: "fudge-brownies-half-dozen", price: "24.00" }, // 6 x $4 = $24
  { slug: "fudge-brownies-dozen", price: "48.00" }, // 12 x $4 = $48

  // Chocolate Covered Strawberries
  { slug: "chocolate-strawberries-half-dozen", price: "18.00" },
  { slug: "chocolate-strawberries-dozen", price: "30.00" },

  // Classic Cookies (Non-Decorated) - per dozen
  { slug: "chocolate-chip-cookies", price: "18.00" },
  { slug: "chocolate-crinkle-cookies", price: "20.00" },
  { slug: "sprinkle-sugar-cookies", price: "18.00" },
  { slug: "pecan-sandies", price: "20.00" },

  // Mini Tin Cakes - $5 each
  { slug: "chocolate-mini-tin-cake", price: "5.00" },
  { slug: "vanilla-birthday-mini-tin-cake", price: "5.00" },
  { slug: "strawberry-crunch-mini-tin-cake", price: "5.00" },

  // Individual Brownies
  { slug: "simple-brownie", price: "4.00" },
  { slug: "turtle-brownie", price: "5.00" },
  { slug: "s-mores-brownie", price: "5.00" },
];

async function updatePrices() {
  console.log("Updating product prices (PostgreSQL/Neon)...\n");

  for (const update of priceUpdates) {
    try {
      await db
        .update(products)
        .set({ basePrice: update.price })
        .where(eq(products.slug, update.slug));

      console.log(`✓ Updated ${update.slug} to $${update.price}`);
    } catch (error) {
      console.log(`⚠ Could not update ${update.slug}: ${error.message}`);
    }
  }

  console.log("\n✅ Price updates complete!");
  await pool.end();
  process.exit(0);
}

updatePrices().catch(async (error) => {
  console.error("Error updating prices:", error);
  await pool.end();
  process.exit(1);
});
