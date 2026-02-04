import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Get the Custom Cakes category ID
const { rows: cats } = await pool.query(`SELECT id FROM categories WHERE slug = 'custom-cakes'`);
const categoryId = cats[0].id;

console.log("Adding more custom cake products to category", categoryId, "...\n");

const cakes = [
  {
    name: "Happily Ever After Wedding Cake",
    slug: "happily-ever-after-wedding-cake",
    description: "Elegant multi-tier wedding cake perfect for your special day. Contact us to customize colors, flavors, and decorations.",
    imageUrl: "/images/gallery/cake-happily-ever-after-wedding.jpeg",
    displayOrder: 2
  },
  {
    name: "Royal Crown Celebration Cake",
    slug: "royal-crown-celebration-cake",
    description: "Stunning gold crown cake fit for royalty. Perfect for milestone birthdays and special celebrations.",
    imageUrl: "/images/gallery/cake-royal-crown-gold.jpeg",
    displayOrder: 3
  },
  {
    name: "Elegant Two-Tier Cake",
    slug: "elegant-two-tier-cake",
    description: "Beautiful two-tier cake with elegant decorations. Customize colors and design for your event.",
    imageUrl: "/images/gallery/cake-elegant-blue-two-tier.jpeg",
    displayOrder: 4
  },
  {
    name: "Character Birthday Cake",
    slug: "character-birthday-cake",
    description: "Fun character-themed cakes for kids and adults! From Mickey to Frozen to sports teams - we can create it.",
    imageUrl: "/images/gallery/cake-mickey-clubhouse-birthday.jpeg",
    displayOrder: 5
  },
  {
    name: "Themed Birthday Cake",
    slug: "themed-birthday-cake",
    description: "Custom themed cakes for any interest - sports, anime, movies, and more. Tell us your vision!",
    imageUrl: "/images/gallery/cake-ufc-boxing-birthday.jpeg",
    displayOrder: 6
  },
  {
    name: "Graduation Celebration Cake",
    slug: "graduation-celebration-cake",
    description: "Celebrate academic achievements with a custom graduation cake featuring school colors and mascots.",
    imageUrl: "/images/gallery/cake-graduation-julian-wku.jpeg",
    displayOrder: 7
  }
];

for (const cake of cakes) {
  const result = await pool.query(`
    INSERT INTO products (
      "categoryId", name, slug, description, "basePrice", "imageUrl",
      "isCustomizable", "inStock", featured, "displayOrder", "productType",
      "availableFrom", "availableUntil"
    ) VALUES (
      $1, $2, $3, $4, '0.00', $5,
      true, true, true, $6, 'standard',
      '2026-01-01', '2026-12-31'
    )
    RETURNING id, name
  `, [categoryId, cake.name, cake.slug, cake.description, cake.imageUrl, cake.displayOrder]);
  
  console.log("Created:", result.rows[0].name);
}

console.log("\nDone! Added", cakes.length, "new custom cake products.");

await pool.end();
