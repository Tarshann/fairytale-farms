import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  `SELECT id, name, slug, "productType", "categoryId", "basePrice" FROM products WHERE "productType" = 'custom_portrait' OR name ILIKE '%custom%'`
);
console.log("Custom products:");
rows.forEach(r => console.log(`  ${r.name} (type: ${r.productType}, category: ${r.categoryId})`));

await pool.end();
