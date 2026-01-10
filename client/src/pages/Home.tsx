import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Sparkles, Heart, Award, Gift, Camera, Package, Clock, MapPin, Star } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading } = trpc.products.featured.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1">
        {/* Valentine's Day Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-rainbow-soft">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-40 h-40 bg-pastel-pink rounded-full blur-3xl opacity-50" />
            <div className="absolute top-20 right-20 w-48 h-48 bg-pastel-lavender rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-pastel-mint rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-20 right-1/4 w-36 h-36 bg-pastel-peach rounded-full blur-3xl opacity-50" />
          </div>
          
          <div className="container relative py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge className="bg-white/80 text-pink-600 border-pink-200 px-4 py-2 text-sm animate-pulse">
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Valentine's Day 2026 Collection Now Available!
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Where Technology Meets{" "}
                <span className="text-gradient-rainbow">Fairytale Magic</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Handcrafted treats featuring projection technology, freeze-dried candy, and artisanal baked goods. 
                Limited Valentine's collection available for February 13-14 delivery.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/valentines">
                  <Button size="lg" className="shadow-pastel bg-primary hover:bg-primary/90">
                    <Heart className="mr-2 h-5 w-5 fill-current" />
                    Shop Valentine's Collection
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="border-2">
                    Browse All Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Quick Info */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium">Order by Feb 12</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Nashville Area Delivery</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Limited Quantities</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Valentine's Day Quick Links */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/valentines">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-pink-200 hover:shadow-pastel transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-pastel-pink flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Gift className="w-7 h-7 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">Curated Tiers</h3>
                        <p className="text-sm text-muted-foreground">Three perfectly crafted Valentine's collections starting at $35</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/build-your-own">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-purple-200 hover:shadow-pastel transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-pastel-lavender flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Package className="w-7 h-7 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">Build Your Own</h3>
                        <p className="text-sm text-muted-foreground">Create a custom box with your favorite treats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/custom-portrait-pucks">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-green-200 hover:shadow-pastel transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-pastel-mint flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">Portrait Pucks</h3>
                        <p className="text-sm text-muted-foreground">Turn your photo into edible art with projection technology</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Makes Us Special</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Combining traditional baking artistry with modern technology for treats that are truly magical
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-pink">
                    <Heart className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Made with Love</h3>
                  <p className="text-muted-foreground">
                    Every item is handcrafted with care using premium ingredients and traditional techniques.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-lavender">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Tech-Enhanced</h3>
                  <p className="text-muted-foreground">
                    Projection technology, 3D-printed dam systems, and freeze-dried treats for unique creations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-mint">
                    <Award className="h-8 w-8 text-green-600" />
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
        <section className="py-16 bg-white">
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
                  <Link key={product.id} href={`/product/${product.slug}`}>
                    <Card className="overflow-hidden hover:shadow-pastel-hover transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/20">
                      <div className="aspect-square overflow-hidden bg-gradient-rainbow-soft">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-primary/30" />
                          </div>
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
                            <Badge variant="secondary" className="bg-pastel-lavender text-purple-700 border-0">
                              Customizable
                            </Badge>
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
                <Button size="lg" variant="outline" className="border-2">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Categories */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Shop by Category</h2>
              <p className="text-lg text-muted-foreground">
                Explore our full range of delicious offerings
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories?.map((category, index) => {
                const colors = [
                  "bg-pastel-pink hover:border-pink-300",
                  "bg-pastel-lavender hover:border-purple-300",
                  "bg-pastel-mint hover:border-green-300",
                  "bg-pastel-peach hover:border-orange-300",
                  "bg-pastel-sky hover:border-blue-300",
                  "bg-pastel-yellow hover:border-yellow-300",
                ];
                return (
                  <Link key={category.id} href={`/products?category=${category.id}`}>
                    <Card className={`${colors[index % colors.length]} border-2 border-transparent hover:shadow-pastel transition-all duration-300 cursor-pointer group`}>
                      <CardContent className="p-6 text-center">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Valentine's CTA */}
        <section className="py-20 bg-gradient-rainbow">
          <div className="container text-center space-y-6">
            <Badge className="bg-white/90 text-pink-600 border-0 px-4 py-2">
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Limited Time Collection
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Don't Miss Our Valentine's Day Collection
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Order by February 12 for guaranteed delivery on February 13-14. 
              Only 100 boxes available!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/valentines">
                <Button size="lg" className="bg-white text-pink-600 hover:bg-white/90">
                  <Heart className="mr-2 h-5 w-5 fill-current" />
                  Shop Valentine's Collection
                </Button>
              </Link>
              <Link href="/delivery-zones">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10">
                  <MapPin className="mr-2 h-5 w-5" />
                  Check Delivery Area
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
