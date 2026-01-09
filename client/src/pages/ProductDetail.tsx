import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState("");
  
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params?.slug || "" },
    { enabled: !!params?.slug }
  );
  
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Added to cart!");
      setQuantity(1);
      setCustomizationNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      window.location.href = getLoginUrl();
      return;
    }
    
    if (!product) return;
    
    if (product.isCustomizable && !customizationNotes.trim()) {
      toast.error("Please add customization details for this product");
      return;
    }
    
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      customizationNotes: customizationNotes.trim() || undefined,
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link href="/products">
              <Button>Back to Products</Button>
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
          <Link href="/products">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted shadow-premium">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">
                    ${parseFloat(product.basePrice).toFixed(2)}
                  </span>
                  {product.isCustomizable && (
                    <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                      Customizable
                    </span>
                  )}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
              
              {!product.inStock && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                  <p className="font-medium">Out of Stock</p>
                  <p className="text-sm">This item is currently unavailable.</p>
                </div>
              )}
              
              {product.inStock && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-semibold w-12 text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {product.isCustomizable && (
                      <div className="space-y-2">
                        <Label htmlFor="customization">
                          Customization Details *
                        </Label>
                        {product.customizationInstructions && (
                          <p className="text-sm text-muted-foreground">
                            {product.customizationInstructions}
                          </p>
                        )}
                        <Textarea
                          id="customization"
                          placeholder="Describe your customization requirements..."
                          value={customizationNotes}
                          onChange={(e) => setCustomizationNotes(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    )}
                    
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="mr-2 h-5 w-4" />
                      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Total: ${(parseFloat(product.basePrice) * quantity).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
