import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const sessionId = searchParams.get("session_id");

  const shouldFetchOrder = Boolean(sessionId && isAuthenticated);
  const { data: sessionOrder, isLoading } =
    trpc.orders.getByCheckoutSession.useQuery(
      { sessionId: sessionId ?? "" },
      {
        enabled: shouldFetchOrder,
        refetchInterval: (query) => (query.state.data ? false : 3000),
        retry: true,
      }
    );

  const orderNumber = params?.orderNumber ?? sessionOrder?.orderNumber;
  const showLoading = shouldFetchOrder && isLoading && !sessionOrder;
  const showPending = Boolean(sessionId && !orderNumber && !showLoading);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <Card className="text-center">
            <CardContent className="p-12 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Order Confirmed!</h1>
                <p className="text-lg text-muted-foreground">Thank you for your order</p>
              </div>
              {orderNumber && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-2xl font-bold font-mono">{orderNumber}</p>
                </div>
              )}
              {showLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirming your order details...</span>
                </div>
              )}
              {showPending && (
                <div className="text-sm text-muted-foreground">
                  We are finalizing your order. If it does not appear shortly,
                  check My Orders.
                </div>
              )}
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">What's Next?</p>
                    <p className="text-sm text-muted-foreground">
                      We've received your order and will begin preparing your items.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/my-orders">
                  <Button size="lg">View My Orders<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
