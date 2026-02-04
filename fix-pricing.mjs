import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("Updating Mini Cake prices from $12 to $5...\n");

// Update mini cakes to $5
const result = await pool.query(
  `UPDATE products SET "basePrice" = '5.00' WHERE name LIKE 'Mini Cake%' AND "productType" = 'build_your_own_item' RETURNING id, name, "basePrice"`
);

console.log("Updated products:");
result.rows.forEach(row => {
  console.log(`  - ${row.name}: $${row.basePrice}`);
});

console.log("\nDone!");
await pool.end();
