import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { categories } from "../../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;

const categoriesData = [
  {
    name: "Customized Cakes",
    slug: "customized-cakes",
    description: "Beautiful custom cakes for any occasion",
    displayOrder: 1,
  },
  {
    name: "Customized Sugar Cookies",
    slug: "customized-sugar-cookies",
    description: "Delicious decorated sugar cookies",
    displayOrder: 2,
  },
  {
    name: "Cinnamon Buns",
    slug: "cinnamon-buns",
    description: "Warm, gooey cinnamon buns",
    displayOrder: 3,
  },
  {
    name: "Cake Pops",
    slug: "cake-pops",
    description: "Bite-sized cake treats on a stick",
    displayOrder: 4,
  },
  {
    name: "Brownies",
    slug: "brownies",
    description: "Rich, fudgy brownies",
    displayOrder: 5,
  },
  {
    name: "Cheesecake",
    slug: "cheesecake",
    description: "Creamy, decadent cheesecake",
    displayOrder: 6,
  },
  {
    name: "Chocolate Covered Strawberries",
    slug: "chocolate-strawberries",
    description: "Fresh strawberries dipped in chocolate",
    displayOrder: 7,
  },
];

async function run() {
  if (!databaseUrl) {
    console.warn("[Seed] DATABASE_URL not set. Skipping seed.");
    return;
  }

  const db = drizzle(databaseUrl);

  for (const category of categoriesData) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          description: category.description,
          displayOrder: category.displayOrder,
        },
      });
  }

  console.log(`[Seed] Seeded ${categoriesData.length} categories.`);
}

run().catch(error => {
  console.error("[Seed] Failed to seed database:", error);
  process.exitCode = 1;
});
