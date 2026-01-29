import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, ArrowLeft, Package } from "lucide-react";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const { isAuthenticated } = useAuth();

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: parseInt(params?.id || "0") },
    { enabled: isAuthenticated && !!params?.id }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <Package className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Sign In Required</h1>
            <p className="text-muted-foreground">
              Please sign in to view order details
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg">Sign In</Button>
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
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

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <Link href="/account/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Link href="/account/orders">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-muted-foreground">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge
                variant={order.status === "completed" ? "default" : "secondary"}
                className="text-lg px-4 py-2"
              >
                {order.status}
              </Badge>
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items?.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {/* Product image would need to be fetched separately or stored in order items */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × $
                          {parseFloat(item.unitPrice).toFixed(2)}
                        </p>
                        {item.customizationNotes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            <p className="font-medium text-xs text-muted-foreground mb-1">
                              Customization:
                            </p>
                            <p className="text-xs">{item.customizationNotes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          $
                          {(parseFloat(item.unitPrice) * item.quantity).toFixed(
                            2
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.stripePaymentIntentId && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Payment Information
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-xs">
                        {order.stripePaymentIntentId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">Paid</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
