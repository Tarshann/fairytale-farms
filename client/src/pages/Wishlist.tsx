import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Wishlist() {
  const { isAuthenticated, loading } = useAuth();
  const { data: wishlistItems, isLoading, refetch } = trpc.wishlist.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const removeFromWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    }
  });
  
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: () => {
      toast.error("Failed to add to cart");
    }
  });
  
  const handleRemove = (productId: number) => {
    removeFromWishlist.mutate({ productId });
  };
  
  const handleAddToCart = (productId: number) => {
    addToCart.mutate({ productId, quantity: 1 });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">💝</div>
            <h1 className="text-2xl font-display font-bold mb-2">Your Wishlist</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to save your favorite treats and access them anytime!
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-gradient-to-r from-pastel-pink to-pastel-lavender hover:opacity-90">
                Sign In to View Wishlist
              </Button>
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-pastel-pink/5 to-white">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-8 bg-gradient-to-r from-pastel-pink/20 via-pastel-lavender/20 to-pastel-mint/20">
          <div className="container">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-display font-bold">My Wishlist</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              {wishlistItems?.length || 0} saved {wishlistItems?.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </section>

        {/* Wishlist Content */}
        <section className="py-8">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : wishlistItems && wishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <Link href={`/products/${item.product.slug}`}>
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        {getProductImageUrl(item.product) ? (
                          <img
                            src={getProductImageUrl(item.product)}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pastel-pink/30 to-pastel-lavender/30">
                            <span className="text-5xl">🧁</span>
                          </div>
                        )}
                        {!item.product.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-3">
                        {item.product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          ${parseFloat(item.product.basePrice).toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => handleRemove(item.productId)}
                            disabled={removeFromWishlist.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddToCart(item.productId)}
                            disabled={!item.product.inStock || addToCart.isPending}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💝</div>
                <h2 className="text-xl font-display font-semibold mb-2">Your wishlist is empty</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start adding your favorite treats by clicking the heart icon on any product!
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-gradient-to-r from-pastel-pink to-pastel-lavender hover:opacity-90">
                    Browse Treats
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
