import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Sparkles, Heart, Award } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading } = trpc.products.featured.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#f5a9c1]/20 via-[#b19cd9]/20 to-[#a4c4e0]/20 py-20 md:py-32">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Artisanal Bakery</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Where Every Treat Tells a{" "}
                <span className="text-gradient-gold">Fairytale</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Handcrafted custom cakes, decorated cookies, and artisanal baked goods made with love and the finest ingredients.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products">
                  <Button size="lg" className="shadow-premium">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Custom Orders
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features */}
        <section className="py-16 bg-background">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-premium">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Made with Love</h3>
                  <p className="text-muted-foreground">
                    Every item is handcrafted with care using premium ingredients and traditional techniques.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-premium">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10">
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold">Custom Creations</h3>
                  <p className="text-muted-foreground">
                    Bring your vision to life with fully customizable cakes, cookies, and treats for any occasion.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-premium">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    We use only the finest ingredients to ensure every bite is a delightful experience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Treats</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our most popular creations, perfect for any celebration or sweet craving.
              </p>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-6 space-y-2">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts?.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer group">
                      <div className="aspect-square overflow-hidden bg-muted">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <CardContent className="p-6 space-y-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-2xl font-bold text-primary">
                            ${parseFloat(product.basePrice).toFixed(2)}
                          </span>
                          {product.isCustomizable && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                              Customizable
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="text-center mt-12">
              <Link href="/products">
                <Button size="lg" variant="outline">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Categories */}
        <section className="py-16 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Shop by Category</h2>
              <p className="text-lg text-muted-foreground">
                Explore our full range of delicious offerings
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories?.map((category) => (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  <Card className="hover:shadow-premium transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-fairy">
          <div className="container text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Create Something Magical?
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Whether you need a custom cake for a special occasion or just want to treat yourself, we're here to make it happen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" variant="secondary">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
