import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("Creating new categories...\n");

// Create Mini Tins category
const miniTins = await pool.query(`
  INSERT INTO categories (name, slug, description, visible, "displayOrder")
  VALUES ('Mini Tin Cakes', 'mini-tin-cakes', 'Delicious mini cakes in adorable tins - perfect for individual treats', true, 2)
  RETURNING id, name, slug
`);
console.log("Created:", miniTins.rows[0]);

// Create Custom Cakes category
const customCakes = await pool.query(`
  INSERT INTO categories (name, slug, description, visible, "displayOrder")
  VALUES ('Custom Cakes', 'custom-cakes', 'Beautiful custom cakes for any occasion - contact us for details', true, 3)
  RETURNING id, name, slug
`);
console.log("Created:", customCakes.rows[0]);

// Update Mini Tin products to new category
const miniTinCategoryId = miniTins.rows[0].id;
const updateMiniTins = await pool.query(`
  UPDATE products SET "categoryId" = $1 WHERE name LIKE 'Mini Cake%'
  RETURNING id, name
`, [miniTinCategoryId]);
console.log("\nUpdated Mini Tins to category", miniTinCategoryId + ":");
updateMiniTins.rows.forEach(r => console.log("  -", r.name));

// Update Custom Cake to new category
const customCakeCategoryId = customCakes.rows[0].id;
const updateCustomCake = await pool.query(`
  UPDATE products SET "categoryId" = $1 WHERE slug = 'custom-cake'
  RETURNING id, name
`, [customCakeCategoryId]);
console.log("\nUpdated Custom Cake to category", customCakeCategoryId + ":");
updateCustomCake.rows.forEach(r => console.log("  -", r.name));

// Show all categories
const { rows: allCats } = await pool.query(`SELECT id, name, slug, "displayOrder" FROM categories ORDER BY "displayOrder"`);
console.log("\nAll categories:");
allCats.forEach(c => console.log(`  ${c.id}: ${c.name} (order: ${c.displayOrder})`));

await pool.end();
