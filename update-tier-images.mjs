import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check current tier box images
const { rows: current } = await pool.query(
  `SELECT id, name, slug, "imageUrl" FROM products WHERE "productType" = 'tier' ORDER BY "basePrice"`
);
console.log("Current tier box images:");
current.forEach(r => console.log(`  ${r.name}: ${r.imageUrl}`));

// Update with stock Valentine's images
console.log("\nUpdating tier boxes with stock images...\n");

await pool.query(`UPDATE products SET "imageUrl" = '/images/valentine-cookie-box.jpg' WHERE slug = 'fairytale-crush-box'`);
await pool.query(`UPDATE products SET "imageUrl" = '/images/valentine-treats-box.jpg' WHERE slug = 'fairytale-sweetheart-box'`);
await pool.query(`UPDATE products SET "imageUrl" = '/images/valentine-dessert-box.jpg' WHERE slug = 'fairytale-romance-box'`);

// Verify
const { rows: updated } = await pool.query(
  `SELECT id, name, slug, "imageUrl" FROM products WHERE "productType" = 'tier' ORDER BY "basePrice"`
);
console.log("Updated tier box images:");
updated.forEach(r => console.log(`  ${r.name}: ${r.imageUrl}`));

await pool.end();
