import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  "SELECT id, name, slug, \"imageUrl\", \"productType\" FROM products ORDER BY name"
);
console.log(JSON.stringify(rows, null, 2));
await pool.end();
