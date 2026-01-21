type ProductImageSource = {
  slug?: string | null;
  imageUrl?: string | null;
};

const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  "chocolate-chip-cookies": "/images/chocolate-chip-cookie.jpg",
  "chocolate-chip-cookie": "/images/chocolate-chip-cookie.jpg",
  "chocolate-crinkle-cookies": "/images/chocolate-chip-cookie.jpg",
  "pecan-sandies": "/images/meringue-cookie.jpg",
  "vanilla-birthday-mini-tin-cake": "/images/mini-cake.jpg",
  "strawberry-crunch-mini-tin-cake": "/images/mini-cake.jpg",
  "chocolate-mini-tin-cake": "/images/mini-cake.jpg",
};

export const getProductImageUrl = (product?: ProductImageSource | null) => {
  if (!product) return undefined;
  const slug = (product.slug ?? "").toLowerCase();
  if (slug && PRODUCT_IMAGE_OVERRIDES[slug]) {
    return PRODUCT_IMAGE_OVERRIDES[slug];
  }
  return product.imageUrl ?? undefined;
};
