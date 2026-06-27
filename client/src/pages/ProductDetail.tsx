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
import { useAuth } from "@/_core/hooks/useAuth";
import { getProductImageUrl } from "@/lib/productImages";
import { toast } from "sonner";
import { trackProductViewed, trackAddToCart } from "@/lib/analytics";
import { Minus, Plus, ShoppingCart, ArrowLeft, AlertTriangle, Star, Heart, ZoomIn, X, Share2 } from "lucide-react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  // Check if this is a Valentine's tier product (contains "Box" in name and is tier type)
  const isValentinesTier =
    product?.productType === "tier" && product?.name?.includes("Box");

  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: wishlistData } = trpc.wishlist.isInWishlist.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: !!product?.id && isAuthenticated }
  );
  const isInWishlist = wishlistData ?? false;

  const toggleWishlistMutation = trpc.wishlist.toggle.useMutation({
    onSuccess: data => {
      utils.wishlist.isInWishlist.invalidate({ productId: product?.id });
      utils.wishlist.count.invalidate();
      toast.success(data.added ? "Added to wishlist!" : "Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to update wishlist");
    },
  });

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

  const subscribeMutation = trpc.orders.createSubscriptionCheckout.useMutation({
    onSuccess: data => {
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: error => {
      toast.error(error.message || "Could not start subscription");
    },
  });

  const handleSubscribe = () => {
    if (!product) return;
    subscribeMutation.mutate({ productId: product.id });
  };

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
            <div
              className="aspect-square overflow-hidden rounded-lg bg-muted shadow-premium relative group cursor-zoom-in"
              onClick={() => getProductImageUrl(product) && setLightboxOpen(true)}
            >
              {getProductImageUrl(product) && (
                <>
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2 shadow-lg">
                      <ZoomIn className="h-5 w-5 text-gray-700" />
                    </div>
                  </div>
                </>
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

              {/* Social Share */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  Share:
                </span>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${appOrigin}/products/${product.slug}`);
                    const text = encodeURIComponent(`Check out ${product.name} from Fairytale Farms!`);
                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
                  }}
                  className="p-2 rounded-full hover:bg-sky-50 text-sky-500 transition-colors"
                  title="Share on X (Twitter)"
                  aria-label="Share on X"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${appOrigin}/products/${product.slug}`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
                  }}
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${appOrigin}/products/${product.slug}`);
                    const description = encodeURIComponent(`${product.name}${product.description ? ` - ${product.description}` : ""}`);
                    const media = product.imageUrl ? `&media=${encodeURIComponent(product.imageUrl)}` : "";
                    window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${description}${media}`, "_blank", "noopener,noreferrer");
                  }}
                  className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                  title="Share on Pinterest"
                  aria-label="Share on Pinterest"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </button>
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
                        <div className="flex gap-2">
                          <Button
                            size="lg"
                            className="flex-1"
                            onClick={handleAddToCart}
                            disabled={addToCartMutation.isPending}
                          >
                            <ShoppingCart className="mr-2 h-5 w-4" />
                            {addToCartMutation.isPending
                              ? "Adding..."
                              : "Add to Cart"}
                          </Button>

                          {isAuthenticated && (
                            <Button
                              size="lg"
                              variant="outline"
                              className={`border-pink-200 hover:bg-pink-50 ${
                                isInWishlist
                                  ? "text-pink-500 border-pink-300"
                                  : "text-muted-foreground hover:text-pink-500"
                              }`}
                              onClick={() =>
                                product &&
                                toggleWishlistMutation.mutate({ productId: product.id })
                              }
                              disabled={toggleWishlistMutation.isPending}
                              title={
                                isInWishlist
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                            >
                              <Heart
                                className={`h-5 w-5 ${isInWishlist ? "fill-pink-500 text-pink-500" : ""}`}
                              />
                            </Button>
                          )}
                        </div>

                        {product.isSubscription && product.subscriptionInterval && (
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full"
                            onClick={handleSubscribe}
                            disabled={subscribeMutation.isPending}
                          >
                            {subscribeMutation.isPending
                              ? "Starting subscription..."
                              : `Subscribe — billed ${product.subscriptionInterval === "week" ? "weekly" : "monthly"}`}
                          </Button>
                        )}

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

      {/* Image Lightbox */}
      {lightboxOpen && getProductImageUrl(product) && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            onClick={e => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={getProductImageUrl(product)!}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
