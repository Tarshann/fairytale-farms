import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(`SELECT id FROM categories WHERE slug = 'custom-cakes'`);
console.log("Custom Cakes category ID:", rows[0].id);
await pool.end();
