import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryParam ? parseInt(categoryParam) : null
  );
  
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: allProducts, isLoading } = trpc.products.list.useQuery();
  
  const filteredProducts = selectedCategory
    ? allProducts?.filter(p => p.categoryId === selectedCategory)
    : allProducts;
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    }
  }, [categoryParam]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#f5a9c1]/10 via-[#b19cd9]/10 to-[#a4c4e0]/10 py-12">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Our <span className="text-gradient-gold">Products</span>
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              Browse our selection of handcrafted treats, from custom cakes to artisanal cookies
            </p>
          </div>
        </section>
        
        <section className="py-8 border-b border-border">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                All Products
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-5 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group h-full flex flex-col">
                      <div className="aspect-square overflow-hidden bg-muted">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xl font-bold text-primary">
                            ${parseFloat(product.basePrice).toFixed(2)}
                          </span>
                          {product.isCustomizable && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                              Custom
                            </span>
                          )}
                        </div>
                        {!product.inStock && (
                          <div className="text-xs text-destructive font-medium">
                            Out of Stock
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No products found in this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
