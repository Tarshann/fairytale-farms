import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ShoppingCart,
  Sparkles,
  Zap,
  Heart,
  Star,
  Snowflake,
} from "lucide-react";
import { toast } from "sonner";

export default function BickeringBros() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Fetch categories to get the freeze-dried candy category ID
  const { data: categories } = trpc.categories.list.useQuery();
  const freezeDriedCategory = categories?.find(
    c => c.slug === "freeze-dried-candy"
  );

  // Fetch products by category
  const { data: products, isLoading } = trpc.products.listByCategory.useQuery(
    { categoryId: freezeDriedCategory?.id || 0 },
    { enabled: !!freezeDriedCategory?.id }
  );

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Added to cart!");
    },
    onError: error => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      return;
    }
    addToCart.mutate({ productId, quantity: 1 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section with Dark Theme */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Colorful splash effects */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="container relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Logo */}
              <img
                src="/images/bickering-bros-logo.png"
                alt="Bickering Bros Candy Co"
                className="h-64 md:h-80 w-auto object-contain mb-8"
              />

              <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-2xl">
                Freeze-dried candy that's out of this world! Crunchy, airy, and
                bursting with flavor.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Badge className="bg-yellow-500 text-black font-bold px-4 py-2 text-sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Crunchy
                </Badge>
                <Badge className="bg-red-500 text-white font-bold px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Flavor Explosion
                </Badge>
                <Badge className="bg-blue-500 text-white font-bold px-4 py-2 text-sm">
                  <Snowflake className="w-4 h-4 mr-1" />
                  Freeze-Dried
                </Badge>
              </div>

              <p className="text-gray-400 text-sm italic">
                Made with love by two brothers using our Harvest Right Freeze
                Dryer
              </p>
            </div>
          </div>
        </section>

        {/* What is Freeze-Dried Candy Section */}
        <section className="py-16 bg-gray-800/50">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                What is Freeze-Dried Candy?
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Freeze-drying removes all the moisture from candy, transforming
                it into a light, crunchy, melt-in-your-mouth treat. The flavors
                become more intense and the texture is unlike anything you've
                ever tried! It's the same candy you love, but with a whole new
                experience.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="bg-gray-900/50 border-yellow-500/30 text-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Super Crunchy</h3>
                    <p className="text-gray-400 text-sm">
                      Light and airy with an amazing crunch that melts in your
                      mouth
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-red-500/30 text-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Intense Flavor</h3>
                    <p className="text-gray-400 text-sm">
                      Concentrated taste that's even more flavorful than the
                      original
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-blue-500/30 text-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Star className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Long Lasting</h3>
                    <p className="text-gray-400 text-sm">
                      Shelf-stable for months - if you can resist eating them
                      all!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-gray-900">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Freeze-Dried Treats
              </h2>
              <p className="text-gray-400">
                Handcrafted in small batches for maximum crunch and flavor
              </p>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-400">
                Loading delicious treats...
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <Card
                    key={product.id}
                    className="bg-gray-800 border-gray-700 overflow-hidden group hover:border-yellow-500/50 transition-all"
                  >
                    <div className="aspect-square relative overflow-hidden bg-gray-700">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive">Sold Out</Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-yellow-500">
                          ${parseFloat(product.basePrice).toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!product.inStock || addToCart.isPending}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Coming Soon!
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  The Bickering Bros are hard at work creating amazing
                  freeze-dried treats. Check back soon for our first batch of
                  crunchy goodness!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Meet the Bros Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-blue-500/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Meet the Bickering Bros
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Two brothers with a passion for candy and a dream to share the
                most amazing freeze-dried treats with the world. Sure, we might
                bicker about which candy to make next, but we always agree on
                one thing: it has to be delicious!
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span>A Fairytale Farms Family Business</span>
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-800">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Want to Try Something Sweet?
              </h2>
              <p className="text-gray-400 mb-8">
                Check out our other delicious treats from Fairytale Farms!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900"
                  >
                    Browse All Treats
                  </Button>
                </Link>
                <Link href="/valentines">
                  <Button
                    size="lg"
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Valentine's Collection
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
