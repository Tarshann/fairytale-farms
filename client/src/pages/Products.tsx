import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { getProductImageUrl } from "@/lib/productImages";
import { ChevronRight, Search, Eye, ShoppingCart, X, SlidersHorizontal, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

// Category-specific placeholder images
const categoryPlaceholders: Record<string, { emoji: string; gradient: string }> = {
  "valentine's day 2026": { emoji: "💝", gradient: "from-pink-200 to-red-200" },
  "customized cakes": { emoji: "🎂", gradient: "from-pastel-pink/40 to-pastel-peach/40" },
  "customized sugar cookies": { emoji: "🍪", gradient: "from-pastel-peach/40 to-pastel-yellow/40" },
  "cinnamon buns": { emoji: "🥐", gradient: "from-amber-200 to-orange-200" },
  "cake pops": { emoji: "🍭", gradient: "from-pastel-lavender/40 to-pastel-pink/40" },
  "brownies": { emoji: "🍫", gradient: "from-amber-300 to-amber-500" },
  "cheesecake": { emoji: "🍰", gradient: "from-yellow-100 to-orange-100" },
  "chocolate covered strawberries": { emoji: "🍓", gradient: "from-red-200 to-pink-200" },
};

// Quick View Modal Component
function QuickViewModal({ 
  product, 
  isOpen, 
  onClose,
  categoryName
}: { 
  product: any; 
  isOpen: boolean; 
  onClose: () => void;
  categoryName?: string;
}) {
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success(`${product.name} added to cart!`);
      onClose();
    },
    onError: () => {
      toast.error("Failed to add to cart");
    }
  });

  const placeholder = categoryPlaceholders[categoryName?.toLowerCase() || ""] || { emoji: "🧁", gradient: "from-pastel-pink/30 to-pastel-lavender/30" };

  const handleAddToCart = () => {
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {getProductImageUrl(product) ? (
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${placeholder.gradient}`}>
                <span className="text-6xl">{placeholder.emoji}</span>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-primary">
                  ${parseFloat(product.basePrice).toFixed(2)}
                </span>
                {product.isFeatured && (
                  <Badge variant="secondary" className="bg-pastel-pink/20 text-pink-700">
                    Featured
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground mb-4">
                {product.description}
              </p>
              
              {product.isCustomizable && (
                <div className="mb-4 p-3 bg-pastel-lavender/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">✨ Customizable</p>
                  <p className="text-xs text-muted-foreground">
                    This item can be personalized to your preferences
                  </p>
                </div>
              )}
              
              {product.inventoryCap && product.inventoryCap > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  <span className="font-medium">Limited availability:</span> Only {product.inventoryCap} remaining
                </p>
              )}
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Link href={`/products/${product.slug}`}>
                <Button variant="outline">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Product card component with quick view
function ProductCard({ 
  product, 
  onQuickView,
  categoryName,
  isInWishlist,
  onToggleWishlist
}: { 
  product: any; 
  onQuickView: () => void;
  categoryName?: string;
  isInWishlist?: boolean;
  onToggleWishlist?: () => void;
}) {
  const placeholder = categoryPlaceholders[categoryName?.toLowerCase() || ""] || { emoji: "🧁", gradient: "from-pastel-pink/30 to-pastel-lavender/30" };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full relative">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-muted relative">
          {getProductImageUrl(product) ? (
            <img
              src={getProductImageUrl(product)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${placeholder.gradient}`}>
              <span className="text-4xl">{placeholder.emoji}</span>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {product.description}
          </p>
        </CardContent>
      </Link>
      
      {/* Wishlist Heart Button */}
      <Button
        size="icon"
        variant="ghost"
        className={`absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200 ${isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWishlist?.();
        }}
      >
        <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
      </Button>
      
      {/* Quick View Button - appears on hover */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onQuickView();
        }}
      >
        <Eye className="h-4 w-4 mr-1" />
        Quick View
      </Button>
    </Card>
  );
}

// Category section with products
function CategorySection({ 
  category, 
  products,
  bgColor,
  onQuickView,
  wishlistIds,
  onToggleWishlist
}: { 
  category: { id: number; name: string; slug: string; description?: string | null };
  products: any[];
  bgColor: string;
  onQuickView: (product: any, categoryName: string) => void;
  wishlistIds: number[];
  onToggleWishlist: (productId: number) => void;
}) {
  if (products.length === 0) return null;
  
  return (
    <div className={`py-8 ${bgColor}`}>
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display">{category.name}</h2>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
          <Link href={`/products?category=${category.id}`}>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onQuickView={() => onQuickView(product, category.name)}
              categoryName={category.name}
              isInWishlist={wishlistIds.includes(product.id)}
              onToggleWishlist={() => onToggleWishlist(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [location] = useLocation();
  // useLocation returns full path like "/products?category=123"
  const searchParams = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryParam ? parseInt(categoryParam) : null
  );
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  
  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewCategory, setQuickViewCategory] = useState<string>("");
  
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: allProducts, isLoading } = trpc.products.list.useQuery();
  
  // Wishlist functionality
  const { isAuthenticated } = useAuth();
  const { data: wishlistIds = [], refetch: refetchWishlist } = trpc.wishlist.productIds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data) => {
      refetchWishlist();
      toast.success(data.added ? "Added to wishlist!" : "Removed from wishlist");
    },
    onError: () => {
      toast.error("Please sign in to use wishlist");
    }
  });
  
  const handleToggleWishlist = (productId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save favorites");
      return;
    }
    toggleWishlist.mutate({ productId });
  };
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    } else {
      setSelectedCategory(null);
    }
  }, [categoryParam]);

  // Filter and search products
  const filteredAndSearchedProducts = useMemo(() => {
    if (!allProducts) return [];
    
    let filtered = [...allProducts];
    
    // Category filter
    if (selectedCategory !== null) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Price range filter (basePrice is stored in dollars)
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under25":
          filtered = filtered.filter(p => parseFloat(p.basePrice) < 25);
          break;
        case "25to50":
          filtered = filtered.filter(p => parseFloat(p.basePrice) >= 25 && parseFloat(p.basePrice) <= 50);
          break;
        case "50to100":
          filtered = filtered.filter(p => parseFloat(p.basePrice) >= 50 && parseFloat(p.basePrice) <= 100);
          break;
        case "over100":
          filtered = filtered.filter(p => parseFloat(p.basePrice) > 100);
          break;
      }
    }
    
    // Sort
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.basePrice) - parseFloat(b.basePrice));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.basePrice) - parseFloat(a.basePrice));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return filtered;
  }, [allProducts, selectedCategory, searchQuery, sortBy, priceRange]);

  // Group products by category (for all categories view)
  const productsByCategory = categories?.reduce((acc, category) => {
    acc[category.id] = allProducts?.filter(p => p.categoryId === category.id) || [];
    return acc;
  }, {} as Record<number, any[]>) || {};

  // Background colors for alternating sections
  const bgColors = [
    "bg-white",
    "bg-pastel-pink/5",
    "bg-white",
    "bg-pastel-lavender/5",
    "bg-white",
    "bg-pastel-mint/5",
    "bg-white",
    "bg-pastel-peach/5",
  ];

  const selectedCategoryData = selectedCategory 
    ? categories?.find(c => c.id === selectedCategory)
    : null;

  const handleQuickView = (product: any, categoryName: string) => {
    setQuickViewProduct(product);
    setQuickViewCategory(categoryName);
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || "";
  };

  // Check if search/filters are active
  const hasActiveFilters = searchQuery.trim() || priceRange !== "all" || sortBy !== "name";
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-rainbow-soft py-10">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 font-display">
              Our <span className="text-gradient-rainbow">Treats</span>
            </h1>
            <p className="text-muted-foreground text-center max-w-xl mx-auto">
              Handcrafted with love, each treat tells its own delicious story
            </p>
          </div>
        </section>
        
        {/* Search and Filter Bar */}
        <section className="py-4 border-b border-border bg-white sticky top-16 z-20">
          <div className="container">
            {/* Search Bar */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search treats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* Filter Options */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Price:</span>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under25">Under $25</SelectItem>
                      <SelectItem value="25to50">$25 - $50</SelectItem>
                      <SelectItem value="50to100">$50 - $100</SelectItem>
                      <SelectItem value="over100">Over $100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("name");
                      setPriceRange("all");
                    }}
                    className="text-muted-foreground"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
            
            {/* Category Filter Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategories(!showCategories)}
                  className="rounded-full gap-2"
                >
                  {selectedCategory !== null 
                    ? categories?.find(c => c.id === selectedCategory)?.name || "Category"
                    : "All Treats"
                  }
                  <ChevronRight className={`h-4 w-4 transition-transform ${showCategories ? 'rotate-90' : ''}`} />
                </Button>
                {selectedCategory !== null && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground"
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategories(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {showCategories && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-border rounded-lg shadow-lg p-2 z-30 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <Button
                    variant={selectedCategory === null ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start rounded-md mb-1"
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategories(false);
                    }}
                  >
                    All Treats
                  </Button>
                  {categories?.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start rounded-md mb-1"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowCategories(false);
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Search Results Count */}
        {(searchQuery || hasActiveFilters) && (
          <div className="container py-3">
            <p className="text-sm text-muted-foreground">
              {filteredAndSearchedProducts.length} {filteredAndSearchedProducts.length === 1 ? 'result' : 'results'} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        )}
        
        {isLoading ? (
          /* Loading State */
          <section className="py-12">
            <div className="container">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-3 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : (searchQuery || hasActiveFilters || selectedCategory !== null) ? (
          /* Filtered/Search Results View */
          <section className="py-8">
            <div className="container">
              {selectedCategoryData && !searchQuery && !hasActiveFilters && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-display">{selectedCategoryData.name}</h2>
                  {selectedCategoryData.description && (
                    <p className="text-muted-foreground mt-1">{selectedCategoryData.description}</p>
                  )}
                </div>
              )}
              {filteredAndSearchedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredAndSearchedProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onQuickView={() => handleQuickView(product, getCategoryName(product.categoryId))}
                      categoryName={getCategoryName(product.categoryId)}
                      isInWishlist={wishlistIds.includes(product.id)}
                      onToggleWishlist={() => handleToggleWishlist(product.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">No treats found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("name");
                      setPriceRange("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* All Categories View - Organized by Category */
          <>
            {categories?.map((category, index) => (
              <CategorySection
                key={category.id}
                category={category}
                products={productsByCategory[category.id] || []}
                bgColor={bgColors[index % bgColors.length]}
                onQuickView={handleQuickView}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </>
        )}
      </main>
      
      <Footer />
      
      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          categoryName={quickViewCategory}
        />
      )}
    </div>
  );
}
