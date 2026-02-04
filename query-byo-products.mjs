import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  `SELECT id, name, slug, "basePrice", "productType" FROM products WHERE "productType" = 'build_your_own_item' ORDER BY name`
);
console.log("Build Your Own Items:");
console.log(JSON.stringify(rows, null, 2));
await pool.end();
