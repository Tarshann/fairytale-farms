import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  `SELECT id, name, slug, "imageUrl" FROM products WHERE name LIKE 'Mini Cake%' ORDER BY name`
);
console.log("Mini Cake products:");
rows.forEach(r => console.log(`  ${r.name} (slug: ${r.slug}): ${r.imageUrl}`));

await pool.end();
