import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, hasSession, loading } = useAuth();

  const { data: cartItems, isLoading: cartLoading } = trpc.cart.get.useQuery(
    undefined,
    {
      enabled: hasSession,
    }
  );

  const { data: checkoutStatus } = trpc.settings.checkoutEnabled.useQuery();
  const checkoutDisabled = checkoutStatus?.enabled === false;

  const createCheckoutMutation = trpc.orders.createCheckout.useMutation({
    onSuccess: data => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to Stripe checkout...");
        window.location.href = data.checkoutUrl;
      }
    },
    onError: error => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  useEffect(() => {
    if (!hasSession || cartLoading) return;
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      setLocation("/cart");
    }
  }, [hasSession, cartItems, cartLoading, setLocation]);

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + parseFloat(item.product.basePrice) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (user?.email && typeof window !== "undefined") {
      localStorage.setItem(
        "lastCheckoutEmail",
        user.email.trim().toLowerCase()
      );
    }
    createCheckoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="text-gradient-gold">Checkout</span>
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    {cartItems.map(item => {
                      if (!item.product) return null;

                      return (
                        <div
                          key={item.id}
                          className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {getProductImageUrl(item.product) && (
                              <img
                                src={getProductImageUrl(item.product)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × $
                              {parseFloat(item.product.basePrice).toFixed(2)}
                            </p>
                            {item.customizationNotes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                Custom: {item.customizationNotes}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">
                              $
                              {(
                                parseFloat(item.product.basePrice) *
                                item.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Customer Information
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {user?.name || "Guest checkout"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">
                        {user?.email || "Collected at Stripe"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    You'll be able to add shipping address and payment details
                    on the next page.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Total</h2>

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
                    <p className="text-xs text-muted-foreground pt-2">
                      Shipping and taxes calculated at checkout
                    </p>
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${subtotal.toFixed(2)}</span>
                  </div>

                  {checkoutDisabled ? (
                    <div className="space-y-3">
                      <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Ordering is currently closed</p>
                          <p className="text-sm mt-1">
                            Please contact us for any inquiries.
                          </p>
                        </div>
                      </div>
                      <Link href="/contact">
                        <Button size="lg" className="w-full">
                          Contact Us
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={createCheckoutMutation.isPending}
                      >
                        {createCheckoutMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay with Stripe
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                        Secure checkout powered by Stripe
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
