import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("Updating Valentine's Day products availability...\n");

// Update Valentine's category products (tier boxes and BYO items)
// Available from now until Feb 12 (order cutoff), pickup Feb 13-14
const result = await pool.query(`
  UPDATE products 
  SET "availableFrom" = '2026-01-26',
      "availableUntil" = '2026-02-12'
  WHERE "categoryId" = 1 OR "productType" = 'build_your_own_item'
  RETURNING id, name, "availableFrom", "availableUntil"
`);

console.log("Updated products:");
result.rows.forEach(r => console.log(`  ${r.name}: ${r.availableFrom} to ${r.availableUntil}`));

await pool.end();
