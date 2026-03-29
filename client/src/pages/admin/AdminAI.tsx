import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminAI() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [editingCampaign, setEditingCampaign] = useState<number | null>(null);
  const [campaignEdits, setCampaignEdits] = useState<Record<number, { caption?: string; scheduledFor?: string }>>({});

  const { data: forecastData, isLoading: forecastLoading } = trpc.ai.demandForecast.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: lowStockAlerts, isLoading: alertsLoading } = trpc.ai.lowStockAlerts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: pricingRecs, isLoading: pricingLoading } = trpc.ai.pricingRecommendations.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: campaigns, isLoading: campaignsLoading } = trpc.ai.marketingCampaigns.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const resolveAlert = trpc.ai.resolveLowStockAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved");
      utils.ai.lowStockAlerts.invalidate();
    },
  });

  const applyPricing = trpc.ai.applyPricingRecommendation.useMutation({
    onSuccess: () => {
      toast.success(`Price updated — ` + "Product price has been updated.");
      utils.ai.pricingRecommendations.invalidate();
    },
    onError: err => { toast.error(err.message); },
  });

  const rejectPricing = trpc.ai.rejectPricingRecommendation.useMutation({
    onSuccess: () => {
      toast.success("Recommendation dismissed");
      utils.ai.pricingRecommendations.invalidate();
    },
  });

  const updateCampaignStatus = trpc.ai.updateCampaignStatus.useMutation({
    onSuccess: () => {
      toast.success("Campaign updated");
      utils.ai.marketingCampaigns.invalidate();
    },
  });

  const updateCampaign = trpc.ai.updateCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign saved");
      setEditingCampaign(null);
      utils.ai.marketingCampaigns.invalidate();
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <Link href="/"><Button className="mt-4">Go Home</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const velocity = forecastData?.velocity ?? [];
  const revenue = forecastData?.revenue ?? [];
  const totalRevenue = revenue.reduce((s, r) => s + Number(r.revenue), 0);
  const totalOrders = revenue.reduce((s, r) => s + Number(r.orderCount), 0);

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

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">
              AI <span className="text-gradient-gold">Automation</span>
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            AI-powered insights running automatically in the background — demand forecasting, dynamic pricing, review moderation, and marketing content.
          </p>

          <Tabs defaultValue="forecast">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="forecast" className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Demand
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="marketing" className="flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Alerts
                {(lowStockAlerts?.length ?? 0) > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {lowStockAlerts!.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Demand Forecast ── */}
            <TabsContent value="forecast" className="space-y-6">
              {forecastLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">30-Day Revenue</p>
                        <p className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">30-Day Orders</p>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
                        <p className="text-2xl font-bold">
                          ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Top Products by Velocity (30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {velocity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sales data available yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {velocity.slice(0, 10).map((item, i) => {
                            const maxQty = Number(velocity[0]?.totalQuantity) || 1;
                            const pct = (Number(item.totalQuantity) / maxQty) * 100;
                            return (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium truncate max-w-[60%]">{item.productName}</span>
                                  <span className="text-muted-foreground">
                                    {item.totalQuantity} units · {item.orderCount} orders
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ── Pricing Recommendations ── */}
            <TabsContent value="pricing" className="space-y-4">
              {pricingLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (pricingRecs ?? []).length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pricing recommendations at this time.</p>
                  <p className="text-xs text-muted-foreground mt-1">AI analyzes sales velocity daily to suggest optimal prices.</p>
                </div>
              ) : (
                (pricingRecs ?? []).map(rec => {
                  const current = parseFloat(String(rec.currentPrice));
                  const suggested = parseFloat(String(rec.suggestedPrice));
                  const diff = suggested - current;
                  const pct = ((diff / current) * 100).toFixed(1);
                  const isIncrease = diff > 0;

                  return (
                    <Card key={rec.id}>
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{rec.productName}</h3>
                              {isIncrease ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Current: <strong>${current.toFixed(2)}</strong>
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className={isIncrease ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                                ${suggested.toFixed(2)}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${isIncrease ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                                {isIncrease ? "+" : ""}{pct}%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() =>
                                applyPricing.mutate({
                                  id: rec.id,
                                  productId: rec.productId!,
                                  newPrice: suggested.toFixed(2),
                                })
                              }
                              disabled={applyPricing.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectPricing.mutate({ id: rec.id })}
                              disabled={rejectPricing.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ── Marketing Campaigns ── */}
            <TabsContent value="marketing" className="space-y-4">
              {campaignsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (campaigns ?? []).length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No campaign drafts yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">AI generates social media posts Mon/Wed/Fri.</p>
                </div>
              ) : (
                (campaigns ?? []).map(campaign => {
                  const isEditing = editingCampaign === campaign.id;
                  const edits = campaignEdits[campaign.id] ?? {};

                  const statusColors: Record<string, string> = {
                    draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    approved: "bg-blue-100 text-blue-800 border-blue-200",
                    published: "bg-green-100 text-green-800 border-green-200",
                    rejected: "bg-red-100 text-red-800 border-red-200",
                  };

                  return (
                    <Card key={campaign.id}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="capitalize font-semibold text-sm">{campaign.platform}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors[campaign.status] ?? ""}`}>
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs mb-1 block">Caption</Label>
                              <Textarea
                                value={edits.caption ?? campaign.caption}
                                onChange={e =>
                                  setCampaignEdits(prev => ({
                                    ...prev,
                                    [campaign.id]: { ...prev[campaign.id], caption: e.target.value },
                                  }))
                                }
                                rows={4}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Schedule (optional)</Label>
                              <Input
                                type="datetime-local"
                                value={edits.scheduledFor ?? ""}
                                onChange={e =>
                                  setCampaignEdits(prev => ({
                                    ...prev,
                                    [campaign.id]: { ...prev[campaign.id], scheduledFor: e.target.value },
                                  }))
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateCampaign.mutate({
                                    id: campaign.id,
                                    caption: edits.caption,
                                    scheduledFor: edits.scheduledFor || null,
                                  })
                                }
                                disabled={updateCampaign.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCampaign(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed">{campaign.caption}</p>
                            {campaign.suggestedImagePrompt && (
                              <div className="bg-muted/50 rounded p-3">
                                <p className="text-xs text-muted-foreground font-medium mb-1">📸 Suggested Image Prompt</p>
                                <p className="text-xs text-muted-foreground">{campaign.suggestedImagePrompt}</p>
                              </div>
                            )}
                            {campaign.scheduledFor && (
                              <p className="text-xs text-muted-foreground">
                                Scheduled: {new Date(campaign.scheduledFor).toLocaleString()}
                              </p>
                            )}
                          </>
                        )}

                        {!isEditing && (
                          <div className="flex gap-2 flex-wrap pt-1">
                            {campaign.status === "draft" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateCampaignStatus.mutate({ id: campaign.id, status: "approved" })
                                  }
                                  disabled={updateCampaignStatus.isPending}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCampaign(campaign.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() =>
                                    updateCampaignStatus.mutate({ id: campaign.id, status: "rejected" })
                                  }
                                  disabled={updateCampaignStatus.isPending}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {campaign.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateCampaignStatus.mutate({ id: campaign.id, status: "published" })
                                }
                                disabled={updateCampaignStatus.isPending}
                              >
                                Mark Published
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ── Low Stock Alerts ── */}
            <TabsContent value="alerts" className="space-y-4">
              {alertsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (lowStockAlerts ?? []).length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">All stock levels are healthy.</p>
                  <p className="text-xs text-muted-foreground mt-1">AI monitors inventory velocity every 6 hours.</p>
                </div>
              ) : (
                (lowStockAlerts ?? []).map(alert => (
                  <Card key={alert.id} className="border-red-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <h3 className="font-semibold">{alert.productName}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Current stock: <strong>{alert.currentStock}</strong> units
                            {alert.forecastedDemand && (
                              <> · Forecasted demand (14 days): <strong>{alert.forecastedDemand}</strong> units</>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Detected {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert.mutate({ id: alert.id })}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
