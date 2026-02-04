/**
 * One-off script to set imageUrl for the three mini tin cake products
 * so DB matches the new mini-tin-*.jpg assets. Run with:
 *   DATABASE_URL="postgresql://..." node update-mini-tin-image-urls.mjs
 */
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

const updates = [
  { slug: "chocolate-mini-tin-cake", imageUrl: "/images/mini-tin-chocolate.jpg" },
  { slug: "vanilla-birthday-mini-tin-cake", imageUrl: "/images/mini-tin-vanilla.jpg" },
  { slug: "strawberry-crunch-mini-tin-cake", imageUrl: "/images/mini-tin-strawberry.jpg" },
];

console.log("Updating mini tin product imageUrl to /images/mini-tin-*.jpg ...\n");

for (const { slug, imageUrl } of updates) {
  const result = await pool.query(
    'UPDATE products SET "imageUrl" = $1 WHERE slug = $2',
    [imageUrl, slug]
  );
  if (result.rowCount > 0) {
    console.log(`Updated ${slug} -> ${imageUrl}`);
  } else {
    console.log(`No product found with slug: ${slug}`);
  }
}

console.log("\nDone.");
await pool.end();
