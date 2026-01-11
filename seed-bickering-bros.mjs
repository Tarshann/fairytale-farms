import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';

// Connect to the database
const sqlite = new Database('./data/sqlite.db');
const db = drizzle(sqlite);

async function seedBickeringBros() {
  console.log('🍬 Seeding Bickering Bros Candy Co data...');
  
  // First, check if the category already exists
  const existingCategory = db.all(sql`SELECT * FROM categories WHERE slug = 'freeze-dried-candy'`);
  
  let categoryId;
  
  if (existingCategory.length === 0) {
    // Create the freeze-dried candy category
    db.run(sql`
      INSERT INTO categories (name, slug, description, displayOrder, createdAt, updatedAt)
      VALUES (
        'Bickering Bros Freeze-Dried Candy',
        'freeze-dried-candy',
        'Crunchy, airy, and bursting with flavor! Our freeze-dried candies are transformed into light, melt-in-your-mouth treats with intensified flavors.',
        8,
        datetime('now'),
        datetime('now')
      )
    `);
    
    // Get the new category ID
    const newCategory = db.all(sql`SELECT id FROM categories WHERE slug = 'freeze-dried-candy'`);
    categoryId = newCategory[0].id;
    console.log('✅ Created freeze-dried candy category with ID:', categoryId);
  } else {
    categoryId = existingCategory[0].id;
    console.log('📦 Freeze-dried candy category already exists with ID:', categoryId);
  }
  
  // Sample freeze-dried candy products
  const products = [
    {
      name: 'Freeze-Dried Skittles',
      slug: 'freeze-dried-skittles',
      description: 'Classic Skittles transformed into crunchy, airy bites with intensified fruity flavors. Taste the rainbow like never before!',
      basePrice: '8.00',
      featured: true,
    },
    {
      name: 'Freeze-Dried Jolly Ranchers',
      slug: 'freeze-dried-jolly-ranchers',
      description: 'Hard candies become light and puffy with an amazing crunch. The flavors are even more intense!',
      basePrice: '8.00',
      featured: true,
    },
    {
      name: 'Freeze-Dried Gummy Bears',
      slug: 'freeze-dried-gummy-bears',
      description: 'Chewy gummy bears transformed into crunchy, melt-in-your-mouth treats. A whole new texture experience!',
      basePrice: '7.00',
      featured: false,
    },
    {
      name: 'Freeze-Dried Taffy',
      slug: 'freeze-dried-taffy',
      description: 'Soft taffy becomes light and crispy while keeping all that delicious flavor. Simply addictive!',
      basePrice: '7.00',
      featured: false,
    },
    {
      name: 'Freeze-Dried Sour Worms',
      slug: 'freeze-dried-sour-worms',
      description: 'Sour gummy worms with an extra tangy punch! The freeze-drying process intensifies the sour coating.',
      basePrice: '8.00',
      featured: true,
    },
    {
      name: 'Bickering Bros Variety Pack',
      slug: 'bickering-bros-variety-pack',
      description: 'Can\'t decide? Try them all! A mix of our most popular freeze-dried candies in one pack.',
      basePrice: '15.00',
      featured: true,
    },
  ];
  
  for (const product of products) {
    // Check if product already exists
    const existing = db.all(sql`SELECT * FROM products WHERE slug = ${product.slug}`);
    
    if (existing.length === 0) {
      db.run(sql`
        INSERT INTO products (
          categoryId, name, slug, description, basePrice, 
          isCustomizable, inStock, featured, displayOrder,
          productType, createdAt, updatedAt
        )
        VALUES (
          ${categoryId},
          ${product.name},
          ${product.slug},
          ${product.description},
          ${product.basePrice},
          0,
          1,
          ${product.featured ? 1 : 0},
          0,
          'standard',
          datetime('now'),
          datetime('now')
        )
      `);
      console.log('✅ Created product:', product.name);
    } else {
      console.log('📦 Product already exists:', product.name);
    }
  }
  
  console.log('🎉 Bickering Bros seeding complete!');
}

seedBickeringBros().catch(console.error);
