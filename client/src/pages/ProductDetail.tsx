import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { toast } from "sonner";
import { trackProductViewed, trackAddToCart } from "@/lib/analytics";
import { Minus, Plus, ShoppingCart, ArrowLeft, AlertTriangle, Star } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";

const CAKE_FLAVORS = [
  "Chocolate",
  "Vanilla Confetti",
  "Strawberry",
];

const PICKUP_DATES = [
  { value: "feb-13", label: "Friday, February 13th" },
  { value: "feb-14", label: "Saturday, February 14th (Valentine's Day)" },
];

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [selectedCakeFlavor, setSelectedCakeFlavor] = useState<string>("");
  const [selectedPickupDate, setSelectedPickupDate] = useState<string>("");

  const { data: checkoutStatus } = trpc.settings.checkoutEnabled.useQuery();
  const checkoutDisabled = checkoutStatus?.enabled === false;

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params?.slug || "" },
    { enabled: !!params?.slug }
  );

  // Build-Your-Own Base Box is deprecated; send users to the Build Your Own page
  useEffect(() => {
    if (product?.slug === "build-your-own-base") {
      setLocation("/build-your-own");
    }
  }, [product?.slug, setLocation]);

  // Track product view
  useEffect(() => {
    if (product) {
      trackProductViewed({
        id: product.id,
        name: product.name,
        price: product.basePrice,
      });
    }
  }, [product?.id]);

  // Check if this is a Valentine's tier product (contains "Box" in name and is tier type)
  const isValentinesTier =
    product?.productType === "tier" && product?.name?.includes("Box");

  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Added to cart!");
      if (product) {
        trackAddToCart({
          id: product.id,
          name: product.name,
          price: product.basePrice,
          quantity,
        });
      }
      setQuantity(1);
      setCustomizationNotes("");
    },
    onError: error => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const handleAddToCart = () => {
    if (!product) return;

    if (product.isCustomizable && !customizationNotes.trim()) {
      toast.error("Please add customization details for this product");
      return;
    }

    // Require cake flavor and pickup date for Valentine's tier products
    if (isValentinesTier && !selectedCakeFlavor) {
      toast.error("Please select a cake flavor");
      return;
    }
    if (isValentinesTier && !selectedPickupDate) {
      toast.error("Please select a pickup date");
      return;
    }

    // Build customization notes with cake flavor and pickup date if applicable
    let notes = customizationNotes.trim();
    if (isValentinesTier) {
      const pickupLabel = PICKUP_DATES.find(d => d.value === selectedPickupDate)?.label || selectedPickupDate;
      notes = `Pickup Date: ${pickupLabel}\nCake Flavor: ${selectedCakeFlavor}${notes ? `\n${notes}` : ""}`;
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

  // Show custom cake inquiry page for all products in Custom Cakes category (categoryId 3)
  // These require contacting us for pricing and availability
  const isCustomCake = product.categoryId === 3;
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

            <Card className="overflow-hidden">
              {/* Product Image */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={getProductImageUrl(product) || "/images/mini-cake.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-3 font-display">
                      {product.name}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      {product.description}
                    </p>
                  </div>

                  <div className="bg-pastel-lavender/10 p-6 rounded-lg">
                    <h2 className="font-semibold text-lg mb-2">
                      Custom Cake Ordering
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Every custom cake is unique and made to order. Contact us
                      to discuss your vision, preferences, and get a quote.
                    </p>
                    <div className="text-left space-y-2 text-sm">
                      <p className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Birthdays, weddings, baby showers & more</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Choose flavors, sizes, and decorations</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>Personalized quote based on your needs</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link href="/contact">
                      <Button size="lg" className="w-full">
                        Contact Us for Details
                      </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      Or use the chat icon in the bottom right corner
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || "",
        image: product.imageUrl ? [product.imageUrl] : [],
        offers: {
          "@type": "Offer",
          price: parseFloat(product.basePrice).toFixed(2),
          priceCurrency: "USD",
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${appOrigin}/products/${product.slug}`,
        },
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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

                    {/* Valentine's Box Options */}
                    {isValentinesTier && (
                      <>
                        {/* Pickup Date Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="pickupDate">Pickup Date *</Label>
                          <p className="text-sm text-muted-foreground">
                            Valentine's orders available for pickup Feb 13th or 14th only
                          </p>
                          <Select
                            value={selectedPickupDate}
                            onValueChange={setSelectedPickupDate}
                          >
                            <SelectTrigger id="pickupDate">
                              <SelectValue placeholder="Choose pickup date..." />
                            </SelectTrigger>
                            <SelectContent>
                              {PICKUP_DATES.map(date => (
                                <SelectItem key={date.value} value={date.value}>
                                  {date.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Cake Flavor Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="cakeFlavor">Cake Flavor *</Label>
                          <p className="text-sm text-muted-foreground">
                            Select your preferred cake flavor for the mini cake
                            included in your box
                          </p>
                          <Select
                            value={selectedCakeFlavor}
                            onValueChange={setSelectedCakeFlavor}
                          >
                            <SelectTrigger id="cakeFlavor">
                              <SelectValue placeholder="Choose a cake flavor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {CAKE_FLAVORS.map(flavor => (
                                <SelectItem key={flavor} value={flavor}>
                                  {flavor}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
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
                          onChange={e => setCustomizationNotes(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    )}

                    {checkoutDisabled ? (
                      <div className="space-y-3">
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Ordering is currently closed</p>
                            <p className="text-sm mt-1">
                              Please contact us for any inquiries.
                            </p>
                          </div>
                        </div>
                        <Link href="/contact">
                          <Button size="lg" className="w-full">
                            Contact Us
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleAddToCart}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="mr-2 h-5 w-4" />
                          {addToCartMutation.isPending
                            ? "Adding..."
                            : "Add to Cart"}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                          Total: $
                          {(parseFloat(product.basePrice) * quantity).toFixed(2)}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          {/* Customer Reviews */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              Customer Reviews
            </h2>
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
