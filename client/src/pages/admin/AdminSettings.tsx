import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Eye, EyeOff, Settings, Tags } from "lucide-react";

// Define the pages that can be toggled
const SITE_PAGES = [
  {
    id: "valentines",
    name: "Valentine's Collection",
    path: "/valentines",
    description: "Seasonal Valentine's Day products",
  },
  {
    id: "custom-pucks",
    name: "Custom Pucks",
    path: "/custom-pucks",
    description: "Custom portrait pucks ordering",
  },
  {
    id: "bickering-bros",
    name: "Bickering Bros",
    path: "/bickering-bros",
    description: "Freeze-dried candy section",
  },
  {
    id: "gallery",
    name: "Gallery",
    path: "/gallery",
    description: "Photo gallery of past work",
  },
  {
    id: "about",
    name: "About",
    path: "/about",
    description: "About Fairytale Farms",
  },
  {
    id: "lab",
    name: "The Lab",
    path: "/lab",
    description: "Experimental treats section",
  },
];

export default function AdminSettings() {
  const { user, isAuthenticated } = useAuth();
  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>(
    () => {
      // Load from localStorage or default all to visible
      const saved = localStorage.getItem("fairytale-page-visibility");
      if (saved) {
        return JSON.parse(saved);
      }
      return SITE_PAGES.reduce(
        (acc, page) => ({ ...acc, [page.id]: true }),
        {}
      );
    }
  );

  const { data: products, isLoading: productsLoading } =
    trpc.products.listAdmin.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: categoriesAdmin, isLoading: categoriesLoading } =
    trpc.categories.listAdmin.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const utils = trpc.useUtils();

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.listAdmin.invalidate();
      toast.success("Product updated successfully");
    },
    onError: error => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const setCategoryVisibleMutation = trpc.categories.setVisible.useMutation({
    onSuccess: (_, variables) => {
      utils.categories.list.invalidate();
      utils.categories.listAdmin.invalidate();
      toast.success(
        `Category ${variables.visible ? "shown" : "hidden"} on storefront`
      );
    },
    onError: error => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const handlePageVisibilityChange = (pageId: string, visible: boolean) => {
    const newVisibility = { ...pageVisibility, [pageId]: visible };
    setPageVisibility(newVisibility);
    localStorage.setItem(
      "fairytale-page-visibility",
      JSON.stringify(newVisibility)
    );
    toast.success(
      `${SITE_PAGES.find(p => p.id === pageId)?.name} ${visible ? "shown" : "hidden"}`
    );
  };

  const handlePriceUpdate = (productId: number, newPrice: string) => {
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    updateProductMutation.mutate({
      id: productId,
      basePrice: priceNum.toFixed(2),
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

          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Site <span className="text-gradient-gold">Settings</span>
          </h1>

          {/* Category Visibility Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Category Visibility
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hide or show product categories on the storefront (e.g. Classic Cookies, Mini Tin Cakes)
              </p>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !categoriesAdmin || categoriesAdmin.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No categories found
                </p>
              ) : (
                <div className="space-y-4">
                  {categoriesAdmin.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{cat.name}</h3>
                          {cat.visible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <code className="text-xs bg-muted px-1 rounded">
                          {cat.slug}
                        </code>
                      </div>
                      <Switch
                        checked={cat.visible}
                        disabled={setCategoryVisibleMutation.isPending}
                        onCheckedChange={checked =>
                          setCategoryVisibleMutation.mutate({
                            id: cat.id,
                            visible: checked,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Visibility Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Page Visibility
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Show or hide pages from the navigation menu
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SITE_PAGES.map(page => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{page.name}</h3>
                        {pageVisibility[page.id] ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {page.description}
                      </p>
                      <code className="text-xs bg-muted px-1 rounded">
                        {page.path}
                      </code>
                    </div>
                    <Switch
                      checked={pageVisibility[page.id]}
                      onCheckedChange={checked =>
                        handlePageVisibilityChange(page.id, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Product Pricing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust product prices directly
              </p>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !products || products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No products found
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {getProductImageUrl(product) && (
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Category ID: {product.categoryId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`price-${product.id}`}
                          className="sr-only"
                        >
                          Price
                        </Label>
                        <span className="text-muted-foreground">$</span>
                        <Input
                          id={`price-${product.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={parseFloat(product.basePrice).toFixed(
                            2
                          )}
                          className="w-24"
                          onBlur={e => {
                            const newPrice = e.target.value;
                            if (
                              newPrice !==
                              parseFloat(product.basePrice).toFixed(2)
                            ) {
                              handlePriceUpdate(product.id, newPrice);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
