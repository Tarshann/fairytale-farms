import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Edit } from "lucide-react";

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const { data: products, isLoading } = trpc.products.listAdmin.useQuery(
    undefined,
    {
      enabled: isAuthenticated && user?.role === "admin",
    }
  );

  const utils = trpc.useUtils();
  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.listAdmin.invalidate();
      utils.products.featured.invalidate();
      toast.success("Product updated");
    },
    onError: error => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const toggleStockMutation = trpc.admin.toggleProductStock.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.listAdmin.invalidate();
      toast.success("Product stock status updated");
    },
    onError: error => {
      toast.error(error.message || "Failed to update stock status");
    },
  });

  const toggleFeaturedMutation = trpc.admin.toggleProductFeatured.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.listAdmin.invalidate();
      utils.products.featured.invalidate();
      toast.success("Product featured status updated");
    },
    onError: error => {
      toast.error(error.message || "Failed to update featured status");
    },
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
            Manage <span className="text-gradient-gold">Products</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {getProductImageUrl(product) && (
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              {product.isCustomizable && (
                                <Badge variant="secondary">Customizable</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.inStock}
                              onCheckedChange={() =>
                                toggleStockMutation.mutate({ id: product.id })
                              }
                              disabled={toggleStockMutation.isPending}
                            />
                            <span className="text-sm">In Stock</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.featured}
                              onCheckedChange={() =>
                                toggleFeaturedMutation.mutate({
                                  id: product.id,
                                })
                              }
                              disabled={toggleFeaturedMutation.isPending}
                            />
                            <span className="text-sm">Featured</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border grid gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`price-${product.id}`}>
                                Price
                              </Label>
                              <Input
                                id={`price-${product.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={parseFloat(
                                  product.basePrice
                                ).toFixed(2)}
                                onBlur={e => {
                                  const nextValue = e.target.value.trim();
                                  const parsed = Number.parseFloat(nextValue);
                                  if (Number.isNaN(parsed) || parsed < 0) {
                                    toast.error("Please enter a valid price");
                                    return;
                                  }
                                  if (
                                    parsed.toFixed(2) ===
                                    parseFloat(product.basePrice).toFixed(2)
                                  ) {
                                    return;
                                  }
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    basePrice: parsed.toFixed(2),
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`inventory-${product.id}`}>
                                Inventory Cap
                              </Label>
                              <Input
                                id={`inventory-${product.id}`}
                                type="number"
                                min="0"
                                placeholder="Unlimited"
                                defaultValue={product.inventoryCap ?? ""}
                                onBlur={e => {
                                  const nextValue = e.target.value.trim();
                                  const parsed =
                                    nextValue.length === 0
                                      ? null
                                      : Number.parseInt(nextValue, 10);
                                  if (
                                    parsed !== null &&
                                    (Number.isNaN(parsed) || parsed < 0)
                                  ) {
                                    toast.error(
                                      "Please enter a valid inventory cap"
                                    );
                                    return;
                                  }
                                  if (
                                    (product.inventoryCap ?? null) === parsed
                                  ) {
                                    return;
                                  }
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    inventoryCap: parsed,
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`available-from-${product.id}`}>
                                Available From
                              </Label>
                              <Input
                                id={`available-from-${product.id}`}
                                type="date"
                                defaultValue={
                                  product.availableFrom
                                    ? new Date(product.availableFrom)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onBlur={e => {
                                  const nextValue = e.target.value.trim();
                                  const currentValue = product.availableFrom
                                    ? new Date(product.availableFrom)
                                        .toISOString()
                                        .split("T")[0]
                                    : "";
                                  if (nextValue === currentValue) return;
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    availableFrom: nextValue
                                      ? new Date(nextValue).toISOString()
                                      : null,
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`available-until-${product.id}`}>
                                Available Until
                              </Label>
                              <Input
                                id={`available-until-${product.id}`}
                                type="date"
                                defaultValue={
                                  product.availableUntil
                                    ? new Date(product.availableUntil)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onBlur={e => {
                                  const nextValue = e.target.value.trim();
                                  const currentValue = product.availableUntil
                                    ? new Date(product.availableUntil)
                                        .toISOString()
                                        .split("T")[0]
                                    : "";
                                  if (nextValue === currentValue) return;
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    availableUntil: nextValue
                                      ? new Date(nextValue).toISOString()
                                      : null,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`image-${product.id}`}>
                              Image URL
                            </Label>
                            <Input
                              id={`image-${product.id}`}
                              type="text"
                              defaultValue={product.imageUrl ?? ""}
                              placeholder="/images/..."
                              onBlur={e => {
                                const nextValue = e.target.value.trim();
                                if ((product.imageUrl ?? "") === nextValue)
                                  return;
                                updateProductMutation.mutate({
                                  id: product.id,
                                  imageUrl: nextValue,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
