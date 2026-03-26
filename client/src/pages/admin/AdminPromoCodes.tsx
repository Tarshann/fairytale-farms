import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Tag,
  Percent,
  DollarSign,
} from "lucide-react";

export default function AdminPromoCodes() {
  const { user, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newValidFrom, setNewValidFrom] = useState("");
  const [newValidUntil, setNewValidUntil] = useState("");

  const { data: codes, isLoading } = trpc.promoCodes.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      toast.success("Promo code created");
      setShowCreate(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to create promo code"),
  });

  const updateMutation = trpc.promoCodes.update.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      toast.success("Promo code updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update"),
  });

  const deleteMutation = trpc.promoCodes.delete.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      toast.success("Promo code deleted");
    },
    onError: (e) => toast.error(e.message || "Failed to delete"),
  });

  const resetForm = () => {
    setNewCode("");
    setNewDescription("");
    setNewDiscountType("percentage");
    setNewDiscountValue("");
    setNewMinOrder("");
    setNewMaxUses("");
    setNewValidFrom("");
    setNewValidUntil("");
  };

  const handleCreate = () => {
    if (!newCode || !newDiscountValue || !newValidFrom || !newValidUntil) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      code: newCode.toUpperCase().trim(),
      description: newDescription || undefined,
      discountType: newDiscountType,
      discountValue: newDiscountValue,
      minOrderAmount: newMinOrder || null,
      maxUses: newMaxUses ? parseInt(newMaxUses, 10) : null,
      validFrom: new Date(newValidFrom).toISOString(),
      validUntil: new Date(newValidUntil).toISOString(),
      isActive: true,
    });
  };

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

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Promo <span className="text-gradient-gold">Codes</span>
            </h1>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-2 h-4 w-4" />
              New Promo Code
            </Button>
          </div>

          {showCreate && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle>Create New Promo Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      placeholder="SAVE20"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="20% off all orders"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={newDiscountType}
                      onChange={(e) =>
                        setNewDiscountType(
                          e.target.value as "percentage" | "fixed_amount"
                        )
                      }
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Discount Value *{" "}
                      {newDiscountType === "percentage" ? "(%)" : "($)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={
                        newDiscountType === "percentage" ? "20" : "5.00"
                      }
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Order Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newMinOrder}
                      onChange={(e) => setNewMinOrder(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid From *</Label>
                    <Input
                      type="datetime-local"
                      value={newValidFrom}
                      onChange={(e) => setNewValidFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until *</Label>
                    <Input
                      type="datetime-local"
                      value={newValidUntil}
                      onChange={(e) => setNewValidUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreate(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !codes || codes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No promo codes yet. Create your first one above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {codes.map((pc) => {
                const now = new Date();
                const isExpired =
                  pc.validUntil && new Date(pc.validUntil) < now;
                const isNotYetValid =
                  pc.validFrom && new Date(pc.validFrom) > now;
                const isMaxed =
                  pc.maxUses !== null && pc.usedCount >= (pc.maxUses ?? 0);

                return (
                  <Card
                    key={pc.id}
                    className={!pc.isActive || isExpired ? "opacity-60" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="text-lg font-bold bg-muted px-2 py-1 rounded">
                              {pc.code}
                            </code>
                            {pc.discountType === "percentage" ? (
                              <Badge variant="secondary">
                                <Percent className="h-3 w-3 mr-1" />
                                {pc.discountValue}% off
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <DollarSign className="h-3 w-3 mr-1" />$
                                {parseFloat(pc.discountValue).toFixed(2)} off
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {isNotYetValid && (
                              <Badge variant="outline">Not Yet Active</Badge>
                            )}
                            {isMaxed && (
                              <Badge variant="destructive">Max Uses Reached</Badge>
                            )}
                          </div>
                          {pc.description && (
                            <p className="text-sm text-muted-foreground">
                              {pc.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              Used: {pc.usedCount}
                              {pc.maxUses ? ` / ${pc.maxUses}` : ""}
                            </span>
                            {pc.minOrderAmount && (
                              <span>
                                Min order: $
                                {parseFloat(pc.minOrderAmount).toFixed(2)}
                              </span>
                            )}
                            <span>
                              Valid:{" "}
                              {new Date(pc.validFrom).toLocaleDateString()} -{" "}
                              {new Date(pc.validUntil).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={pc.isActive}
                              disabled={updateMutation.isPending}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({
                                  id: pc.id,
                                  isActive: checked,
                                })
                              }
                            />
                            <span className="text-sm">Active</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete promo code "${pc.code}"? This cannot be undone.`
                                )
                              ) {
                                deleteMutation.mutate({ id: pc.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
