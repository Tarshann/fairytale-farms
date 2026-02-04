import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check current custom cakes
const { rows: current } = await pool.query(
  `SELECT id, name FROM products WHERE "categoryId" = 3 ORDER BY "displayOrder"`
);
console.log("Current Custom Cakes:");
current.forEach(c => console.log(`  ${c.id}: ${c.name}`));

// Keep: Custom Cake, Happily Ever After, Royal Crown, Character Birthday (first 4)
// Remove: Elegant Two-Tier, Themed Birthday, Graduation
const toDelete = ['elegant-two-tier-cake', 'themed-birthday-cake', 'graduation-celebration-cake'];

console.log("\nDeleting extra cakes...");
const result = await pool.query(
  `DELETE FROM products WHERE slug = ANY($1) RETURNING name`,
  [toDelete]
);
result.rows.forEach(r => console.log("  Deleted:", r.name));

// Show remaining
const { rows: remaining } = await pool.query(
  `SELECT id, name FROM products WHERE "categoryId" = 3 ORDER BY "displayOrder"`
);
console.log("\nRemaining Custom Cakes (4):");
remaining.forEach(c => console.log(`  ${c.id}: ${c.name}`));

await pool.end();
