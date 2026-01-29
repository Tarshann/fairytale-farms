import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { hasSession, loading } = useAuth();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: hasSession,
  });

  const utils = trpc.useUtils();

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
    onError: error => {
      toast.error(error.message || "Failed to update quantity");
    },
  });

  const removeItemMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Item removed from cart");
    },
    onError: error => {
      toast.error(error.message || "Failed to remove item");
    },
  });

  if (loading || !hasSession) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 animate-pulse text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const subtotal =
    cartItems?.reduce((sum, item) => {
      if (!item.product) return sum;
      return sum + parseFloat(item.product.basePrice) * item.quantity;
    }, 0) || 0;

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setLocation("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Shopping <span className="text-gradient-gold">Cart</span>
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted animate-pulse rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
                        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !cartItems || cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Your cart is empty
                </h2>
                <p className="text-muted-foreground">
                  Add some delicious treats to get started!
                </p>
              </div>
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map(item => {
                  if (!item.product) return null;

                  return (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {getProductImageUrl(item.product) && (
                              <img
                                src={getProductImageUrl(item.product)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.product.slug}`}>
                              <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                {item.product.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              ${parseFloat(item.product.basePrice).toFixed(2)}{" "}
                              each
                            </p>

                            {item.customizationNotes && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                <p className="font-medium text-xs text-muted-foreground mb-1">
                                  Customization:
                                </p>
                                <p className="text-xs line-clamp-2">
                                  {item.customizationNotes}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantityMutation.mutate({
                                      id: item.id,
                                      quantity: Math.max(1, item.quantity - 1),
                                    })
                                  }
                                  disabled={
                                    item.quantity <= 1 ||
                                    updateQuantityMutation.isPending
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-semibold w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantityMutation.mutate({
                                      id: item.id,
                                      quantity: item.quantity + 1,
                                    })
                                  }
                                  disabled={updateQuantityMutation.isPending}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  removeItemMutation.mutate({ id: item.id })
                                }
                                disabled={removeItemMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-lg">
                              $
                              {(
                                parseFloat(item.product.basePrice) *
                                item.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">Order Summary</h2>

                    <div className="space-y-2 py-4 border-y border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">
                          {cartItems.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Link href="/products">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
