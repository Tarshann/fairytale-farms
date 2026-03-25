import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: 0,
    basePrice: "",
    imageUrl: "",
    inStock: true,
    featured: false,
    isCustomizable: false,
    customizationInstructions: "",
    displayOrder: 0,
  });

  const { data: products, isLoading } = trpc.products.listAdmin.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: categories } = trpc.categories.listAdmin.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const utils = trpc.useUtils();

  const invalidateAll = () => {
    utils.products.list.invalidate();
    utils.products.listAdmin.invalidate();
    utils.products.featured.invalidate();
  };

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Product updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update product"),
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Product created");
      setShowCreate(false);
      setNewProduct({
        name: "",
        slug: "",
        description: "",
        categoryId: 0,
        basePrice: "",
        imageUrl: "",
        inStock: true,
        featured: false,
        isCustomizable: false,
        customizationInstructions: "",
        displayOrder: 0,
      });
    },
    onError: (e) => toast.error(e.message || "Failed to create product"),
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Product deleted");
    },
    onError: (e) => toast.error(e.message || "Failed to delete product"),
  });

  const toggleStockMutation = trpc.admin.toggleProductStock.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Stock status updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update"),
  });

  const toggleFeaturedMutation = trpc.admin.toggleProductFeatured.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Featured status updated");
    },
    onError: (e) => toast.error(e.message || "Failed to update"),
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

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Manage <span className="text-gradient-gold">Products</span>
            </h1>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {showCreate && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle>Create New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="Chocolate Chip Cookie"
                      value={newProduct.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setNewProduct((p) => ({
                          ...p,
                          name,
                          slug: name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""),
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input
                      placeholder="chocolate-chip-cookie"
                      value={newProduct.slug}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, slug: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={newProduct.categoryId}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          categoryId: parseInt(e.target.value),
                        }))
                      }
                    >
                      <option value={0}>Select category...</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="12.99"
                      value={newProduct.basePrice}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          basePrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      placeholder="/images/..."
                      value={newProduct.imageUrl}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          imageUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newProduct.displayOrder}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          displayOrder: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                    <Label>Description</Label>
                    <textarea
                      className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                      placeholder="Product description..."
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newProduct.inStock}
                        onChange={(e) =>
                          setNewProduct((p) => ({
                            ...p,
                            inStock: e.target.checked,
                          }))
                        }
                      />
                      In Stock
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newProduct.featured}
                        onChange={(e) =>
                          setNewProduct((p) => ({
                            ...p,
                            featured: e.target.checked,
                          }))
                        }
                      />
                      Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newProduct.isCustomizable}
                        onChange={(e) =>
                          setNewProduct((p) => ({
                            ...p,
                            isCustomizable: e.target.checked,
                          }))
                        }
                      />
                      Customizable
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      if (
                        !newProduct.name ||
                        !newProduct.slug ||
                        !newProduct.categoryId ||
                        !newProduct.basePrice
                      ) {
                        toast.error("Fill in name, slug, category, and price");
                        return;
                      }
                      createProductMutation.mutate({
                        ...newProduct,
                        description: newProduct.description || undefined,
                        imageUrl: newProduct.imageUrl || undefined,
                        customizationInstructions:
                          newProduct.customizationInstructions || undefined,
                      });
                    }}
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending
                      ? "Creating..."
                      : "Create Product"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
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
          ) : !products || products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const isExpanded = expandedProduct === product.id;
                return (
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
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {product.isCustomizable && (
                                  <Badge variant="secondary">
                                    Customizable
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {product.productType || "standard"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedProduct(
                                    isExpanded ? null : product.id
                                  )
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deleteProductMutation.isPending}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete "${product.name}"? This cannot be undone.`
                                    )
                                  ) {
                                    deleteProductMutation.mutate({
                                      id: product.id,
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={product.inStock}
                                onCheckedChange={() =>
                                  toggleStockMutation.mutate({
                                    id: product.id,
                                  })
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
                                <Label>Price</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={parseFloat(
                                    product.basePrice
                                  ).toFixed(2)}
                                  onBlur={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    if (isNaN(parsed) || parsed < 0) return;
                                    if (
                                      parsed.toFixed(2) ===
                                      parseFloat(product.basePrice).toFixed(2)
                                    )
                                      return;
                                    updateProductMutation.mutate({
                                      id: product.id,
                                      basePrice: parsed.toFixed(2),
                                    });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Inventory Cap</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Unlimited"
                                  defaultValue={product.inventoryCap ?? ""}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    const parsed =
                                      val === ""
                                        ? null
                                        : parseInt(val, 10);
                                    if (
                                      parsed !== null &&
                                      (isNaN(parsed) || parsed < 0)
                                    )
                                      return;
                                    if (
                                      (product.inventoryCap ?? null) === parsed
                                    )
                                      return;
                                    updateProductMutation.mutate({
                                      id: product.id,
                                      inventoryCap: parsed,
                                    });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Available From</Label>
                                <Input
                                  type="date"
                                  defaultValue={
                                    product.availableFrom
                                      ? new Date(product.availableFrom)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    const cur = product.availableFrom
                                      ? new Date(product.availableFrom)
                                          .toISOString()
                                          .split("T")[0]
                                      : "";
                                    if (val === cur) return;
                                    updateProductMutation.mutate({
                                      id: product.id,
                                      availableFrom: val
                                        ? new Date(val).toISOString()
                                        : null,
                                    });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Available Until</Label>
                                <Input
                                  type="date"
                                  defaultValue={
                                    product.availableUntil
                                      ? new Date(product.availableUntil)
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    const cur = product.availableUntil
                                      ? new Date(product.availableUntil)
                                          .toISOString()
                                          .split("T")[0]
                                      : "";
                                    if (val === cur) return;
                                    updateProductMutation.mutate({
                                      id: product.id,
                                      availableUntil: val
                                        ? new Date(val).toISOString()
                                        : null,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Image URL</Label>
                              <Input
                                type="text"
                                defaultValue={product.imageUrl ?? ""}
                                placeholder="/images/..."
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if ((product.imageUrl ?? "") === val) return;
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    imageUrl: val,
                                  });
                                }}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-border grid gap-4">
                              <h4 className="font-medium text-sm">
                                Extended Details
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Product Name</Label>
                                  <Input
                                    defaultValue={product.name}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim();
                                      if (val === product.name || !val) return;
                                      updateProductMutation.mutate({
                                        id: product.id,
                                        name: val,
                                      });
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Slug</Label>
                                  <Input
                                    defaultValue={product.slug}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim();
                                      if (val === product.slug || !val) return;
                                      updateProductMutation.mutate({
                                        id: product.id,
                                        slug: val,
                                      });
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Category</Label>
                                  <select
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    defaultValue={product.categoryId}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (val === product.categoryId) return;
                                      updateProductMutation.mutate({
                                        id: product.id,
                                        categoryId: val,
                                      });
                                    }}
                                  >
                                    {categories?.map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Display Order</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    defaultValue={product.displayOrder}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      if (val === product.displayOrder) return;
                                      updateProductMutation.mutate({
                                        id: product.id,
                                        displayOrder: val,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                                  defaultValue={product.description ?? ""}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val === (product.description ?? ""))
                                      return;
                                    updateProductMutation.mutate({
                                      id: product.id,
                                      description: val,
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    defaultChecked={product.isCustomizable}
                                    onChange={(e) =>
                                      updateProductMutation.mutate({
                                        id: product.id,
                                        isCustomizable: e.target.checked,
                                      })
                                    }
                                  />
                                  Customizable
                                </label>
                              </div>
                            </div>
                          )}
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
