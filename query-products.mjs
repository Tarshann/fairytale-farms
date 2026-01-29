import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute(
  "SELECT id, name, slug, imageUrl, productType FROM products ORDER BY name"
);
console.log(JSON.stringify(rows, null, 2));
await connection.end();
