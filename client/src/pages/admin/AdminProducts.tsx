import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Edit } from "lucide-react";

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const { data: products, isLoading } = trpc.products.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  
  const utils = trpc.useUtils();
  
  const toggleStockMutation = trpc.admin.toggleProductStock.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Product stock status updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update stock status");
    },
  });
  
  const toggleFeaturedMutation = trpc.admin.toggleProductFeatured.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.featured.invalidate();
      toast.success("Product featured status updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update featured status");
    },
  });
  
  if (!isAuthenticated || user?.role !== 'admin') {
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container">
          <Link href="/admin">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
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
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{product.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-lg font-bold text-primary">
                                ${parseFloat(product.basePrice).toFixed(2)}
                              </span>
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
                              onCheckedChange={() => toggleStockMutation.mutate({ id: product.id })}
                              disabled={toggleStockMutation.isPending}
                            />
                            <span className="text-sm">In Stock</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.featured}
                              onCheckedChange={() => toggleFeaturedMutation.mutate({ id: product.id })}
                              disabled={toggleFeaturedMutation.isPending}
                            />
                            <span className="text-sm">Featured</span>
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
