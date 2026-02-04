import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check current images
const { rows: current } = await pool.query(
  `SELECT id, name, "imageUrl" FROM products WHERE name LIKE 'Freeze-Dried%' ORDER BY name`
);
console.log("Current freeze-dried candy images:");
current.forEach(r => console.log(`  ${r.name}: ${r.imageUrl}`));

// Update to use real images
console.log("\nUpdating to use real images...\n");

await pool.query(`UPDATE products SET "imageUrl" = '/images/freeze-dried-candy-large.jpg' WHERE name = 'Freeze-Dried Candy (Large)'`);
await pool.query(`UPDATE products SET "imageUrl" = '/images/freeze-dried-skittles.png' WHERE name = 'Freeze-Dried Candy (Mini)'`);
await pool.query(`UPDATE products SET "imageUrl" = '/images/freeze-dried-candy-small.jpg' WHERE name = 'Freeze-Dried Candy (Small)'`);

// Verify
const { rows: updated } = await pool.query(
  `SELECT id, name, "imageUrl" FROM products WHERE name LIKE 'Freeze-Dried%' ORDER BY name`
);
console.log("Updated freeze-dried candy images:");
updated.forEach(r => console.log(`  ${r.name}: ${r.imageUrl}`));

await pool.end();
