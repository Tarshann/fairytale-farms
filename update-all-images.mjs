import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Update Build Your Own items with new stock images
const imageUpdates = [
  // Build Your Own items
  { slug: "build-your-own-base", imageUrl: "/images/base-box.jpg" },
  {
    slug: "chocolate-chip-cookie",
    imageUrl: "/images/chocolate-chip-cookie.jpg",
  },
  {
    slug: "chocolate-covered-strawberry",
    imageUrl: "/images/chocolate-covered-strawberry.jpg",
  },
  {
    slug: "freeze-dried-candy-small-",
    imageUrl: "/images/freeze-dried-candy-small.jpg",
  },
  {
    slug: "freeze-dried-candy-large-",
    imageUrl: "/images/freeze-dried-candy-large.jpg",
  },
  { slug: "meringue-cookie", imageUrl: "/images/meringue-cookie.jpg" },
  { slug: "mini-cake", imageUrl: "/images/mini-cake.jpg" },
  { slug: "valentine-oreo-puck", imageUrl: "/images/valentine-oreo-puck.jpg" },

  // Valentine's Day tiers
  {
    slug: "sweet-beginnings-tier",
    imageUrl: "/images/valentine-cookie-box.jpg",
  },
  { slug: "love-story-tier", imageUrl: "/images/valentine-dessert-box.jpg" },
  {
    slug: "fairytale-romance-tier",
    imageUrl: "/images/valentine-treats-box.jpg",
  },

  // Custom Pucks product
  { slug: "custom-pucks", imageUrl: "/images/valentine-oreos-decorated.jpg" },

  // Classic cookie products
  {
    slug: "chocolate-chip-cookies",
    imageUrl: "/images/chocolate-chip-cookie.jpg",
  },
  {
    slug: "chocolate-crinkle-cookies",
    imageUrl: "/images/chocolate-crinkle-cookies.svg",
  },
  { slug: "sprinkle-sugar-cookies", imageUrl: "/images/sprinkle-sugar-cookies.svg" },
  { slug: "pecan-sandies", imageUrl: "/images/pecan-sandies.svg" },

  // Mini tin cakes
  { slug: "chocolate-mini-tin-cake", imageUrl: "/images/mini-cake.jpg" },
  { slug: "vanilla-birthday-mini-tin-cake", imageUrl: "/images/mini-cake.jpg" },
  {
    slug: "strawberry-crunch-mini-tin-cake",
    imageUrl: "/images/mini-cake.jpg",
  },
];

console.log("Updating product images...\n");

for (const update of imageUpdates) {
  try {
    const result = await pool.query(
      'UPDATE products SET "imageUrl" = $1 WHERE slug = $2',
      [update.imageUrl, update.slug]
    );
    if (result.rowCount > 0) {
      console.log(`Updated ${update.slug} -> ${update.imageUrl}`);
    } else {
      console.log(`No product found with slug: ${update.slug}`);
    }
  } catch (error) {
    console.error(`Error updating ${update.slug}:`, error.message);
  }
}

console.log("\nDone!");
await pool.end();
