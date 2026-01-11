import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Map products to available images
const imageUpdates = [
  // Brownies - use the brownies.jpg for all brownie products
  { slug: 'simple-brownie', imageUrl: '/images/brownies.jpg' },
  { slug: 'turtle-brownie', imageUrl: '/images/brownies.jpg' },
  { slug: 'smores-brownie', imageUrl: '/images/brownies.jpg' },
  
  // Chocolate Strawberries - use chocolate_strawberries.jpg
  { slug: 'chocolate-strawberries-dozen', imageUrl: '/images/chocolate_strawberries.jpg' },
  { slug: 'chocolate-strawberries-half-dozen', imageUrl: '/images/chocolate_strawberries.jpg' },
  
  // Cookies - use sugar cookie gallery images
  { slug: 'sprinkle-sugar-cookies', imageUrl: '/images/gallery/sugar-cookies-mickey-rainbow.jpeg' },
  { slug: 'pecan-sandies', imageUrl: '/images/gallery/sugar-cookies-70th-birthday.jpeg' },
  { slug: 'chocolate-crinkle-cookies', imageUrl: '/images/gallery/sugar-cookies-christmas-santa-baby.jpeg' },
  
  // Mini Tin Cakes - use cake gallery images
  { slug: 'vanilla-birthday-mini-tin-cake', imageUrl: '/images/gallery/cake-pink-heart-birthday.jpeg' },
  { slug: 'strawberry-crunch-mini-tin-cake', imageUrl: '/images/gallery/cake-strawberry-one-birthday.jpeg' },
  { slug: 'chocolate-mini-tin-cake', imageUrl: '/images/gallery/cake-golden-oreo.jpeg' },
  
  // Build your own items that may be missing images
  { slug: 'meringue-cookie', imageUrl: '/images/gallery/sugar-cookies-wedding-bridal.jpeg' },
  { slug: 'royal-icing-sugar-cookie', imageUrl: '/images/gallery/sugar-cookies-baby-girl-caroline.jpeg' },
  { slug: 'mini-brownie-with-ganache', imageUrl: '/images/brownies.jpg' },
  { slug: 'mini-cake', imageUrl: '/images/gallery/cake-minnie-pink-rosettes.jpeg' },
];

console.log('Updating product images...\n');

for (const update of imageUpdates) {
  try {
    const [result] = await connection.execute(
      'UPDATE products SET imageUrl = ? WHERE slug = ?',
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

console.log('\nDone!');
await connection.end();
