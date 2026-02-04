import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check categories
const { rows: cats } = await pool.query(`SELECT id, name, slug, visible FROM categories ORDER BY id`);
console.log("Categories:");
cats.forEach(c => console.log(`  ${c.id}: ${c.name} (visible: ${c.visible})`));

// Check mini cakes category
const { rows: minicakes } = await pool.query(
  `SELECT id, name, "categoryId", "productType", "inStock" FROM products WHERE name LIKE 'Mini Cake%'`
);
console.log("\nMini Cakes:");
minicakes.forEach(p => console.log(`  ${p.name}: categoryId=${p.categoryId}, type=${p.productType}, inStock=${p.inStock}`));

await pool.end();
