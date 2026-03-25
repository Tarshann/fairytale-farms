import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

const STATUS_OPTIONS = ["pending", "processing", "completed", "cancelled"] as const;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const { user, isAuthenticated } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: orders, isLoading } = trpc.admin.allOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.allOrders.invalidate();
      toast.success("Order status updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update status"),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/">
              <Button>Go Home</Button>
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
        <div className="container">
          <Link href="/admin">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            All <span className="text-gradient-gold">Orders</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {orders.length} total order{orders.length !== 1 ? "s" : ""}
              </p>
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                return (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold">
                              Order #{order.orderNumber}
                            </h3>
                            <select
                              className={`rounded-md border px-2 py-1 text-xs font-medium ${statusColors[order.status] || ""}`}
                              value={order.status}
                              disabled={updateStatusMutation.isPending}
                              onChange={(e) =>
                                updateStatusMutation.mutate({
                                  id: order.id,
                                  status: e.target.value as (typeof STATUS_OPTIONS)[number],
                                })
                              }
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                            {order.stripePaymentStatus && (
                              <Badge
                                variant={
                                  order.stripePaymentStatus === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                Payment: {order.stripePaymentStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Customer:{" "}
                              {(order as any).user?.name ||
                                order.customerName ||
                                "Unknown"}{" "}
                              ({(order as any).user?.email ||
                                order.customerEmail ||
                                "N/A"}
                              )
                            </p>
                            <p>
                              Date:{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                            {order.deliveryAddress && (
                              <p>Delivery: {order.deliveryAddress}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ${parseFloat(order.totalAmount).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(order as any).items?.length || 0} item(s)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedOrder(isExpanded ? null : order.id)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (order as any).items && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Package className="h-4 w-4" /> Order Items
                          </h4>
                          {((order as any).items as any[]).map(
                            (item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {item.product?.name ||
                                      `Product #${item.productId}`}
                                  </p>
                                  {item.customizationNotes && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Note: {item.customizationNotes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm flex-shrink-0 ml-4">
                                  <span>Qty: {item.quantity}</span>
                                  {item.product?.basePrice && (
                                    <span className="ml-4">
                                      $
                                      {(
                                        parseFloat(item.product.basePrice) *
                                        item.quantity
                                      ).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                          {order.promoCode && (
                            <p className="text-xs text-muted-foreground">
                              Promo code used: <code>{order.promoCode}</code>
                            </p>
                          )}
                          {order.deliveryNotes && (
                            <p className="text-xs text-muted-foreground">
                              Delivery notes: {order.deliveryNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
