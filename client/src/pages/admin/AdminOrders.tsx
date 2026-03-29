import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Mail,
  StickyNote,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];

export default function AdminOrders() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [sendEmailFlags, setSendEmailFlags] = useState<Record<number, boolean>>({});

  const { data: orders, isLoading } = trpc.admin.allOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Order status changed to "${vars.status}"${vars.sendEmail ? " — customer notified" : ""}.`);
      utils.admin.allOrders.invalidate();
    },
    onError: err => {
      toast.error(err.message || "An error occurred");
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/"><Button>Go Home</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filteredOrders = (orders ?? []).filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      (order.user?.name ?? "").toLowerCase().includes(q) ||
      (order.user?.email ?? "").toLowerCase().includes(q) ||
      (order.customerEmail ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: (orders ?? []).length,
    pending: (orders ?? []).filter(o => o.status === "pending").length,
    processing: (orders ?? []).filter(o => o.status === "processing").length,
    completed: (orders ?? []).filter(o => o.status === "completed").length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <Link href="/admin">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Order <span className="text-gradient-gold">Management</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Update statuses, add notes, and notify customers — all in one place.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Pending", value: stats.pending, color: "text-yellow-600" },
              { label: "Processing", value: stats.processing, color: "text-blue-600" },
              { label: "Completed", value: stats.completed, color: "text-green-600" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, name, or email..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as OrderStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const isExpanded = expandedOrder === order.id;
                const noteValue = noteInputs[order.id] ?? (order.adminNote || "");
                const sendEmail = sendEmailFlags[order.id] ?? true;

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors p-5"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-base font-bold">
                            #{order.orderNumber}
                          </CardTitle>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[order.status as OrderStatus] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {order.status}
                          </span>
                          {order.adminNote && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <StickyNote className="h-3 w-3" /> Note
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              ${parseFloat(order.totalAmount).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.items?.length || 0} item(s)
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          {order.user?.name || order.customerName || "Unknown"}
                        </span>
                        <span>{order.user?.email || order.customerEmail}</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </CardHeader>

                    {/* Expanded Panel */}
                    {isExpanded && (
                      <CardContent className="border-t bg-muted/10 p-5 space-y-5">
                        {/* Items */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Order Items</h4>
                          <div className="space-y-1">
                            {(order.items ?? []).map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm py-1 border-b last:border-0"
                              >
                                <span>
                                  {item.productName}{" "}
                                  <span className="text-muted-foreground">×{item.quantity}</span>
                                  {item.customizationNotes && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({item.customizationNotes})
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium">
                                  ${parseFloat(item.subtotal).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        {(order.deliveryZipCode || order.deliveryAddress) && (
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Delivery</h4>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryAddress || `ZIP: ${order.deliveryZipCode}`}
                              {order.scheduledDeliveryDate && (
                                <> — {new Date(order.scheduledDeliveryDate).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Update Status
                            </Label>
                            <Select
                              value={order.status}
                              onValueChange={newStatus => {
                                updateStatus.mutate({
                                  id: order.id,
                                  status: newStatus as OrderStatus,
                                  adminNote: noteValue || undefined,
                                  sendEmail,
                                });
                              }}
                              disabled={updateStatus.isPending}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(s => (
                                  <SelectItem key={s} value={s} className="capitalize">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3 pt-6">
                            <Switch
                              id={`email-${order.id}`}
                              checked={sendEmail}
                              onCheckedChange={v =>
                                setSendEmailFlags(prev => ({ ...prev, [order.id]: v }))
                              }
                            />
                            <Label
                              htmlFor={`email-${order.id}`}
                              className="text-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Notify customer
                            </Label>
                          </div>
                        </div>

                        {/* Admin Note */}
                        <div>
                          <Label className="text-sm font-semibold mb-2 block flex items-center gap-1">
                            <StickyNote className="h-3.5 w-3.5" />
                            Admin Note (included in customer email)
                          </Label>
                          <Textarea
                            placeholder="Add an internal note or message for the customer..."
                            value={noteValue}
                            onChange={e =>
                              setNoteInputs(prev => ({ ...prev, [order.id]: e.target.value }))
                            }
                            rows={2}
                            className="text-sm"
                          />
                        </div>

                        {/* View Full Order */}
                        <div className="flex justify-between items-center pt-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View Full Order
                            </Button>
                          </Link>
                          {updateStatus.isPending && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                        </div>
                      </CardContent>
                    )}
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
