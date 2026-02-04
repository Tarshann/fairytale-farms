import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("Adding Custom Cake product...\n");

const result = await pool.query(`
  INSERT INTO products (
    "categoryId", name, slug, description, "basePrice", "imageUrl",
    "isCustomizable", "inStock", featured, "displayOrder", "productType",
    "availableFrom", "availableUntil"
  ) VALUES (
    1,
    'Custom Cake',
    'custom-cake',
    'Beautiful custom cakes for birthdays, weddings, baby showers, and special occasions. Contact us to discuss your vision and get a quote.',
    '0.00',
    '/images/481921085_1253005226678831_1341694159329657887_n.jpg',
    true,
    true,
    true,
    1,
    'standard',
    '2026-01-01',
    '2026-12-31'
  )
  RETURNING id, name, slug, "basePrice", "imageUrl"
`);

console.log("Created product:");
console.log(result.rows[0]);

await pool.end();
