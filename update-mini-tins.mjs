import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("Updating mini tin cakes to standard products...\n");

const result = await pool.query(
  `UPDATE products 
   SET "productType" = 'standard', featured = true 
   WHERE name LIKE 'Mini Cake%' 
   RETURNING id, name, "productType", featured, "basePrice", "imageUrl"`
);

console.log("Updated products:");
result.rows.forEach(r => console.log(`  ${r.name}: $${r.basePrice} - type: ${r.productType}, featured: ${r.featured}`));

await pool.end();
