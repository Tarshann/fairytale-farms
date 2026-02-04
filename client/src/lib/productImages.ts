type ProductImageSource = {
  slug?: string | null;
  imageUrl?: string | null;
};

const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  // Cookies
  "chocolate-chip-cookies": "/images/chocolate-chip-cookie.jpg",
  "chocolate-chip-cookie": "/images/chocolate-chip-cookie.jpg",
  "chocolate-crinkle-cookies": "/images/chocolate-crinkle-cookies.jpg",
  "pecan-sandies": "/images/pecan-sandies.jpg",
  "sprinkle-sugar-cookies": "/images/sprinkle-sugar-cookies.jpg",

  // Mini Tin Cakes - each flavor has its own image
  "vanilla-birthday-mini-tin-cake": "/images/mini-tin-vanilla.jpg",
  "vanilla-confetti-mini-cake": "/images/mini-tin-vanilla.jpg",
  "mini-cake-vanilla": "/images/mini-tin-vanilla.jpg",
  "mini-cake-vanilla-confetti": "/images/mini-tin-vanilla.jpg",
  "strawberry-crunch-mini-tin-cake": "/images/mini-tin-strawberry.jpg",
  "strawberry-mini-cake": "/images/mini-tin-strawberry.jpg",
  "mini-cake-strawberry": "/images/mini-tin-strawberry.jpg",
  "chocolate-mini-tin-cake": "/images/mini-tin-chocolate.jpg",
  "chocolate-mini-cake": "/images/mini-tin-chocolate.jpg",
  "mini-cake-chocolate": "/images/mini-tin-chocolate.jpg",
  "mini-cake-red-velvet": "/images/mini-tin-chocolate.jpg",
  "mini-cake": "/images/mini-tin-vanilla.jpg",

  // Valentine's items
  "valentine-oreo-puck": "/images/valentine-oreo-pucks.jpg",
  "valentine-oreo-pucks": "/images/valentine-oreo-pucks.jpg",
  "valentine-oreo-pucks-2": "/images/valentine-oreo-pucks.jpg",
  "valentines-oreo-puck": "/images/valentine-oreo-pucks.jpg",
  "chocolate-covered-strawberry": "/images/chocolate-covered-strawberry.jpg",
  "chocolate-covered-strawberries": "/images/chocolate-covered-strawberry.jpg",
  "valentine-chocolate-strawberry": "/images/chocolate-covered-strawberry.jpg",
  "valentine-cookie": "/images/chocolate-chip-cookie.jpg",

  // Brownies
  "mini-brownie-with-ganache": "/images/brownies.jpg",
  "brownie-with-ganache": "/images/brownies.jpg",
  "5-oz-brownie": "/images/brownies.jpg",
  "valentine-brownie": "/images/brownies.jpg",
  "valentine-brownie-turtle": "/images/brownies.jpg",
  "valentine-brownie-smores": "/images/brownies.jpg",

  // Freeze-dried candy
  "freeze-dried-candy-small": "/images/freeze-dried-candy-small.jpg",
  "freeze-dried-candy-large": "/images/freeze-dried-candy-large.jpg",
  "freeze-dried-candy-mini": "/images/freeze-dried-candy-small.jpg",
};

export const getProductImageUrl = (product?: ProductImageSource | null) => {
  if (!product) return undefined;
  const slug = (product.slug ?? "").toLowerCase();
  if (slug && PRODUCT_IMAGE_OVERRIDES[slug]) {
    return PRODUCT_IMAGE_OVERRIDES[slug];
  }
  return product.imageUrl ?? undefined;
};
