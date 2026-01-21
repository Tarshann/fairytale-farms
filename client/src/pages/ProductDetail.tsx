import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";

const CAKE_FLAVORS = [
  "Vanilla",
  "Chocolate",
  "Strawberry",
  "Red Velvet",
  "Lemon",
  "Funfetti",
];

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [selectedCakeFlavor, setSelectedCakeFlavor] = useState<string>("");
  
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params?.slug || "" },
    { enabled: !!params?.slug }
  );
  
  // Check if this is a Valentine's tier product (contains "Box" in name and is tier type)
  const isValentinesTier = product?.productType === "tier" && product?.name?.includes("Box");
  
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
    
    // Require cake flavor selection for Valentine's tier products
    if (isValentinesTier && !selectedCakeFlavor) {
      toast.error("Please select a cake flavor");
      return;
    }
    
    // Build customization notes with cake flavor if applicable
    let notes = customizationNotes.trim();
    if (isValentinesTier && selectedCakeFlavor) {
      notes = `Cake Flavor: ${selectedCakeFlavor}${notes ? `\n${notes}` : ''}`;
    }
    
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      customizationNotes: notes || undefined,
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
  
  // Redirect custom cakes to inquiry/chatbot instead of showing product detail
  const isCustomCake = product.categoryId === 1; // Customized Cakes category
  if (isCustomCake) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container max-w-2xl">
            <Link href="/products">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            
            <Card className="p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pastel-pink to-pastel-lavender rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎂</span>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold mb-3 font-display">{product.name}</h1>
                  <p className="text-muted-foreground text-lg">
                    {product.description}
                  </p>
                </div>
                
                <div className="bg-pastel-lavender/10 p-6 rounded-lg">
                  <h2 className="font-semibold text-lg mb-2">Custom Cake Ordering</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Every custom cake is unique and made to order. To get started, please use our AI chat assistant to discuss your vision, preferences, and requirements.
                  </p>
                  <div className="text-left space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Share your cake design ideas and theme</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Choose flavors, colors, and decorations</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Get a personalized quote and timeline</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => {
                      // Open chatbot
                      const chatButton = document.querySelector('[data-chatbot-trigger]') as HTMLElement;
                      if (chatButton) {
                        chatButton.click();
                      } else {
                        toast.info("Please use the chat button in the bottom right to start your custom cake inquiry");
                      }
                    }}
                  >
                    Start Custom Cake Inquiry
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Or click the chat icon in the bottom right corner
                  </p>
                </div>
              </div>
            </Card>
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
              {getProductImageUrl(product) && (
                <img
                  src={getProductImageUrl(product)}
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
                    
                    {/* Cake Flavor Selection for Valentine's Boxes */}
                    {isValentinesTier && (
                      <div className="space-y-2">
                        <Label htmlFor="cakeFlavor">Cake Flavor *</Label>
                        <p className="text-sm text-muted-foreground">
                          Select your preferred cake flavor for the mini cake included in your box
                        </p>
                        <Select value={selectedCakeFlavor} onValueChange={setSelectedCakeFlavor}>
                          <SelectTrigger id="cakeFlavor">
                            <SelectValue placeholder="Choose a cake flavor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CAKE_FLAVORS.map((flavor) => (
                              <SelectItem key={flavor} value={flavor}>
                                {flavor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
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
