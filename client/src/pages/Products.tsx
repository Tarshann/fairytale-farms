import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ChevronRight } from "lucide-react";

// Product card component - compact and clean
function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
        <div className="aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pastel-pink/30 to-pastel-lavender/30">
              <span className="text-4xl">🧁</span>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {product.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Category section with products
function CategorySection({ 
  category, 
  products,
  bgColor
}: { 
  category: { id: number; name: string; slug: string; description?: string | null };
  products: any[];
  bgColor: string;
}) {
  if (products.length === 0) return null;
  
  return (
    <div className={`py-8 ${bgColor}`}>
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display">{category.name}</h2>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
          <Link href={`/products?category=${category.id}`}>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryParam ? parseInt(categoryParam) : null
  );
  
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: allProducts, isLoading } = trpc.products.list.useQuery();
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    } else {
      setSelectedCategory(null);
    }
  }, [categoryParam]);

  // Group products by category
  const productsByCategory = categories?.reduce((acc, category) => {
    acc[category.id] = allProducts?.filter(p => p.categoryId === category.id) || [];
    return acc;
  }, {} as Record<number, any[]>) || {};

  // Background colors for alternating sections
  const bgColors = [
    "bg-white",
    "bg-pastel-pink/5",
    "bg-white",
    "bg-pastel-lavender/5",
    "bg-white",
    "bg-pastel-mint/5",
    "bg-white",
    "bg-pastel-peach/5",
  ];

  // If a specific category is selected, show only that category's products
  const filteredProducts = selectedCategory
    ? allProducts?.filter(p => p.categoryId === selectedCategory)
    : null;

  const selectedCategoryData = selectedCategory 
    ? categories?.find(c => c.id === selectedCategory)
    : null;
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-rainbow-soft py-10">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 font-display">
              Our <span className="text-gradient-rainbow">Treats</span>
            </h1>
            <p className="text-muted-foreground text-center max-w-xl mx-auto">
              Handcrafted with love, each treat tells its own delicious story
            </p>
          </div>
        </section>
        
        {/* Category Filter Pills */}
        <section className="py-4 border-b border-border bg-white sticky top-16 z-10">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/products">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  All Treats
                </Button>
              </Link>
              {categories?.map((category) => (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  <Button
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {isLoading ? (
          /* Loading State */
          <section className="py-12">
            <div className="container">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-3 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : selectedCategory !== null ? (
          /* Single Category View */
          <section className="py-8">
            <div className="container">
              <div className="mb-6">
                <h2 className="text-2xl font-bold font-display">{selectedCategoryData?.name}</h2>
                {selectedCategoryData?.description && (
                  <p className="text-muted-foreground mt-1">{selectedCategoryData.description}</p>
                )}
              </div>
              {filteredProducts && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* All Categories View - Organized by Category */
          <>
            {categories?.map((category, index) => (
              <CategorySection
                key={category.id}
                category={category}
                products={productsByCategory[category.id] || []}
                bgColor={bgColors[index % bgColors.length]}
              />
            ))}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
