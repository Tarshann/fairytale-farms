import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  ArrowLeft,
  Check,
  Info,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getLoginUrl } from "@/const";

interface SelectedItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function BuildYourOwn() {
  const { user, isAuthenticated } = useAuth();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const { data: byoItems, isLoading } =
    trpc.valentines.buildYourOwnItems.useQuery();
  const addToCart = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  // All items are available for selection (no base box required)
  const addOnItems = byoItems || [];

  // Calculate totals - just sum of selected items, no base price
  const totals = useMemo(() => {
    const itemsTotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = itemsTotal;

    return { itemsTotal, total };
  }, [selectedItems]);

  const updateItemQuantity = (
    productId: number,
    name: string,
    price: number,
    delta: number
  ) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === productId);

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(item => item.productId !== productId);
        }
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else if (delta > 0) {
        return [...prev, { productId, name, price, quantity: delta }];
      }
      return prev;
    });
  };

  const getItemQuantity = (productId: number) => {
    return (
      selectedItems.find(item => item.productId === productId)?.quantity || 0
    );
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Please add at least one item to your box");
      return;
    }

    try {
      // Add selected items to cart
      for (const item of selectedItems) {
        await addToCart.mutateAsync({
          productId: item.productId,
          quantity: item.quantity,
          customizationNotes: "Build-Your-Own Valentine's Box item",
        });
      }

      utils.cart.get.invalidate();
      toast.success("Items added to cart!");

      // Reset selections
      setSelectedItems([]);
    } catch (error) {
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const itemCategories = [
    {
      name: "Cookies",
      items: addOnItems.filter(i => i.name.toLowerCase().includes("cookie")),
      color: "bg-pastel-pink",
      emoji: "🍪",
    },
    {
      name: "Pucks & Treats",
      items: addOnItems.filter(
        i =>
          i.name.toLowerCase().includes("puck") ||
          i.name.toLowerCase().includes("brownie")
      ),
      color: "bg-pastel-lavender",
      emoji: "🍫",
    },
    {
      name: "Strawberries & Cakes",
      items: addOnItems.filter(
        i =>
          i.name.toLowerCase().includes("strawberry") ||
          i.name.toLowerCase().includes("cake")
      ),
      color: "bg-pastel-peach",
      emoji: "🍓",
    },
    {
      name: "Freeze-Dried Candy",
      items: addOnItems.filter(i => i.name.toLowerCase().includes("freeze")),
      color: "bg-pastel-mint",
      emoji: "🍬",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-rainbow-soft py-12">
        <div className="container">
          <Link
            href="/valentines"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Valentine's Collection
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-pastel flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Create Your Own Valentine's Box
              </h1>
              <p className="text-muted-foreground">
                Create your perfect Valentine's treat collection
              </p>
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-pink-800">
              <span className="font-semibold">✨ Advance Order Required:</span>{" "}
              All Create Your Own boxes must be ordered in advance. This option
              is not available for same-day or last-minute orders.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Item Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Select Your Treats */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${selectedItems.length > 0 ? "bg-green-500" : "bg-pink-400"}`}
                >
                  {selectedItems.length > 0 ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Select Your Treats</h2>
                  <p className="text-muted-foreground text-sm">
                    Choose items for your custom Valentine's box - pay only for
                    what you select
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {itemCategories.map(
                    category =>
                      category.items.length > 0 && (
                        <div key={category.name}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{category.emoji}</span>
                            <h3 className="font-semibold text-lg">
                              {category.name}
                            </h3>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            {category.items.map(item => {
                              const quantity = getItemQuantity(item.id);
                              const remaining = item.inventoryCap
                                ? item.inventoryCap - (item.inventorySold || 0)
                                : null;

                              return (
                                <Card
                                  key={item.id}
                                  className={`transition-all ${quantity > 0 ? "border-primary shadow-pastel" : "hover:border-primary/50"}`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium">
                                          {item.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg font-bold text-primary">
                                            ${item.basePrice}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            each
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            updateItemQuantity(
                                              item.id,
                                              item.name,
                                              parseFloat(item.basePrice),
                                              -1
                                            )
                                          }
                                          disabled={quantity === 0}
                                        >
                                          <Minus className="w-4 h-4" />
                                        </Button>

                                        <span className="w-8 text-center font-semibold">
                                          {quantity}
                                        </span>

                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            updateItemQuantity(
                                              item.id,
                                              item.name,
                                              parseFloat(item.basePrice),
                                              1
                                            )
                                          }
                                          disabled={
                                            remaining !== null &&
                                            quantity >= remaining
                                          }
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {remaining !== null && remaining <= 20 && (
                                      <p className="text-xs text-orange-600 mt-2">
                                        Only {remaining} available
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-pastel">
                <CardHeader className="bg-gradient-rainbow-soft rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Box
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Selected Items */}
                  {selectedItems.length > 0 ? (
                    <div className="space-y-2">
                      {selectedItems.map(item => (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Select treats to add to your box</p>
                    </div>
                  )}

                  {/* Totals */}
                  {selectedItems.length > 0 && (
                    <>
                      <Separator className="my-4" />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          ${totals.total.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={selectedItems.length === 0 || addToCart.isPending}
                  >
                    {addToCart.isPending ? (
                      "Adding..."
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <p>
                        Limited to 10 Build-Your-Own orders. Order by Feb 12 for
                        Valentine's delivery.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
