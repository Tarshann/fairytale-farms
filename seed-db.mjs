import { drizzle } from "drizzle-orm/mysql2";
import { categories, products } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const categoriesData = [
  { name: "Customized Cakes", slug: "customized-cakes", description: "Beautiful custom cakes for any occasion", displayOrder: 1 },
  { name: "Customized Sugar Cookies", slug: "customized-sugar-cookies", description: "Delicious decorated sugar cookies", displayOrder: 2 },
  { name: "Cinnamon Buns", slug: "cinnamon-buns", description: "Warm, gooey cinnamon buns", displayOrder: 3 },
  { name: "Cake Pops", slug: "cake-pops", description: "Bite-sized cake treats on a stick", displayOrder: 4 },
  { name: "Brownies", slug: "brownies", description: "Rich, fudgy brownies", displayOrder: 5 },
  { name: "Cheesecake", slug: "cheesecake", description: "Creamy, decadent cheesecake", displayOrder: 6 },
  { name: "Chocolate Covered Strawberries", slug: "chocolate-strawberries", description: "Fresh strawberries dipped in chocolate", displayOrder: 7 },
];

const productsData = [
  // Customized Cakes
  {
    categoryId: 1,
    name: "Custom Birthday Cake",
    slug: "custom-birthday-cake",
    description: "Personalized birthday cake with your choice of flavors, colors, and decorations. Perfect for making any birthday celebration extra special.",
    basePrice: "65.00",
    imageUrl: "/images/481921085_1253005226678831_1341694159329657887_n.jpg",
    isCustomizable: true,
    customizationInstructions: "Please specify: cake size (6\", 8\", 10\"), flavor (vanilla, chocolate, red velvet, etc.), frosting type, color scheme, and any special decorations or messages you'd like.",
    inStock: true,
    featured: true,
    displayOrder: 1
  },
  {
    categoryId: 1,
    name: "Wedding Cake",
    slug: "wedding-cake",
    description: "Elegant multi-tier wedding cake designed to match your special day. We work with you to create the perfect centerpiece for your celebration.",
    basePrice: "250.00",
    imageUrl: "/images/494927964_1303921418253878_1507582454007359767_n.jpg",
    isCustomizable: true,
    customizationInstructions: "Please specify: number of tiers, serving size, flavors for each tier, frosting style, color palette, and decoration preferences. We recommend scheduling a consultation for wedding cakes.",
    inStock: true,
    featured: true,
    displayOrder: 2
  },
  {
    categoryId: 1,
    name: "Themed Celebration Cake",
    slug: "themed-celebration-cake",
    description: "Custom themed cake for any celebration - from baby showers to graduations. We bring your vision to life with creative designs and delicious flavors.",
    basePrice: "75.00",
    imageUrl: "/images/497611705_1312120867433933_6231905264159125170_n.jpg",
    isCustomizable: true,
    customizationInstructions: "Please describe your theme, preferred colors, size needed, flavor preferences, and any specific design elements you'd like incorporated.",
    inStock: true,
    featured: false,
    displayOrder: 3
  },
  
  // Customized Sugar Cookies
  {
    categoryId: 2,
    name: "Decorated Sugar Cookies (Dozen)",
    slug: "decorated-sugar-cookies-dozen",
    description: "One dozen beautifully decorated sugar cookies. Perfect for parties, gifts, or special occasions. Each cookie is hand-decorated with royal icing.",
    basePrice: "36.00",
    imageUrl: "/images/498671317_1317568696889150_4793173008111768826_n.jpg",
    isCustomizable: true,
    customizationInstructions: "Please specify: theme/design, color scheme, and any text or special details. Minimum order: 1 dozen.",
    inStock: true,
    featured: true,
    displayOrder: 1
  },
  {
    categoryId: 2,
    name: "Custom Shaped Sugar Cookies",
    slug: "custom-shaped-sugar-cookies",
    description: "Sugar cookies in custom shapes for your event. We can create cookies in virtually any shape to match your theme.",
    basePrice: "42.00",
    imageUrl: "/images/499252750_1317422376903782_8618992760808385286_n.jpg",
    isCustomizable: true,
    customizationInstructions: "Please describe desired shapes, colors, and design details. Custom cookie cutters may incur additional fees.",
    inStock: true,
    featured: false,
    displayOrder: 2
  },
  
  // Cinnamon Buns
  {
    categoryId: 3,
    name: "Classic Cinnamon Buns (6-pack)",
    slug: "classic-cinnamon-buns-6pack",
    description: "Six warm, gooey cinnamon buns topped with cream cheese frosting. Made fresh daily with our signature recipe.",
    basePrice: "18.00",
    imageUrl: "/images/cinnamon_buns.jpg",
    isCustomizable: false,
    inStock: true,
    featured: true,
    displayOrder: 1
  },
  {
    categoryId: 3,
    name: "Classic Cinnamon Buns (Dozen)",
    slug: "classic-cinnamon-buns-dozen",
    description: "One dozen of our famous cinnamon buns with cream cheese frosting. Perfect for sharing or freezing for later.",
    basePrice: "32.00",
    imageUrl: "/images/cinnamon_buns.jpg",
    isCustomizable: false,
    inStock: true,
    featured: false,
    displayOrder: 2
  },
  
  // Cake Pops
  {
    categoryId: 4,
    name: "Cake Pops (Dozen)",
    slug: "cake-pops-dozen",
    description: "One dozen cake pops in your choice of flavors and decorations. These bite-sized treats are perfect for parties and gifts.",
    basePrice: "24.00",
    imageUrl: "/images/cake_pops.jpg",
    isCustomizable: true,
    customizationInstructions: "Please specify: cake flavor (vanilla, chocolate, red velvet), coating color, and any decorative elements (sprinkles, drizzle, themed decorations).",
    inStock: true,
    featured: false,
    displayOrder: 1
  },
  
  // Brownies
  {
    categoryId: 5,
    name: "Fudge Brownies (Half Dozen)",
    slug: "fudge-brownies-half-dozen",
    description: "Six rich, fudgy brownies made with premium chocolate. Dense, moist, and absolutely delicious.",
    basePrice: "15.00",
    imageUrl: "/images/brownies.jpg",
    isCustomizable: false,
    inStock: true,
    featured: false,
    displayOrder: 1
  },
  {
    categoryId: 5,
    name: "Fudge Brownies (Dozen)",
    slug: "fudge-brownies-dozen",
    description: "One dozen of our signature fudge brownies. Perfect for chocolate lovers!",
    basePrice: "28.00",
    imageUrl: "/images/brownies.jpg",
    isCustomizable: false,
    inStock: true,
    featured: false,
    displayOrder: 2
  },
  
  // Cheesecake
  {
    categoryId: 6,
    name: "Classic New York Cheesecake",
    slug: "classic-ny-cheesecake",
    description: "Rich and creamy New York style cheesecake with graham cracker crust. Serves 8-10.",
    basePrice: "45.00",
    imageUrl: "/images/cheesecake.jpg",
    isCustomizable: false,
    inStock: true,
    featured: false,
    displayOrder: 1
  },
  {
    categoryId: 6,
    name: "Flavored Cheesecake",
    slug: "flavored-cheesecake",
    description: "Creamy cheesecake in your choice of flavor: strawberry, chocolate, caramel, or seasonal special. Serves 8-10.",
    basePrice: "48.00",
    imageUrl: "/images/cheesecake.jpg",
    isCustomizable: true,
    customizationInstructions: "Please specify your preferred flavor: strawberry, chocolate, caramel, or ask about seasonal options.",
    inStock: true,
    featured: false,
    displayOrder: 2
  },
  
  // Chocolate Covered Strawberries
  {
    categoryId: 7,
    name: "Chocolate Covered Strawberries (Half Dozen)",
    slug: "chocolate-strawberries-half-dozen",
    description: "Six fresh strawberries hand-dipped in premium chocolate. Simple, elegant, and delicious.",
    basePrice: "18.00",
    imageUrl: "/images/chocolate_strawberries.jpg",
    isCustomizable: false,
    inStock: true,
    featured: false,
    displayOrder: 1
  },
  {
    categoryId: 7,
    name: "Chocolate Covered Strawberries (Dozen)",
    slug: "chocolate-strawberries-dozen",
    description: "One dozen chocolate covered strawberries. Can be decorated for special occasions.",
    basePrice: "32.00",
    imageUrl: "/images/chocolate_strawberries.jpg",
    isCustomizable: true,
    customizationInstructions: "Specify if you'd like decorative drizzle, sprinkles, or themed decorations.",
    inStock: true,
    featured: true,
    displayOrder: 2
  },
];

async function seed() {
  console.log("Seeding database...");
  
  // Insert categories
  console.log("Inserting categories...");
  for (const category of categoriesData) {
    await db.insert(categories).values(category);
    console.log(`✓ Created category: ${category.name}`);
  }
  
  // Insert products
  console.log("\nInserting products...");
  for (const product of productsData) {
    await db.insert(products).values(product);
    console.log(`✓ Created product: ${product.name}`);
  }
  
  console.log("\n✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
