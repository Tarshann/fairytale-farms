import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

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
  { slug: "pecan-sandies", imageUrl: "/images/meringue-cookie.jpg" },
  {
    slug: "chocolate-crinkle-cookies",
    imageUrl: "/images/chocolate-chip-cookie.jpg",
  },

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
    const [result] = await connection.execute(
      "UPDATE products SET imageUrl = ? WHERE slug = ?",
      [update.imageUrl, update.slug]
    );
    if (result.affectedRows > 0) {
      console.log(`✅ Updated ${update.slug} -> ${update.imageUrl}`);
    } else {
      console.log(`⚠️  No product found with slug: ${update.slug}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${update.slug}:`, error.message);
  }
}

console.log("\nDone!");
await connection.end();
