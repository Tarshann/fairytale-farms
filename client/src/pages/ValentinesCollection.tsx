import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Heart, Sparkles, Gift, Camera, Clock, MapPin, Star, ChevronRight, Package } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ValentinesCollection() {
  const { user } = useAuth();
  const { data: tiers, isLoading: tiersLoading } = trpc.valentines.tiers.useQuery();
  const { data: customPortrait } = trpc.valentines.customPortrait.useQuery();

  const tierColors = [
    { bg: "bg-pastel-pink", border: "border-pink-200", accent: "text-pink-600" },
    { bg: "bg-pastel-lavender", border: "border-purple-200", accent: "text-purple-600" },
    { bg: "bg-pastel-peach", border: "border-orange-200", accent: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-rainbow-soft opacity-50" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pastel-pink rounded-full blur-3xl opacity-40" />
          <div className="absolute top-20 right-20 w-40 h-40 bg-pastel-lavender rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-pastel-mint rounded-full blur-3xl opacity-40" />
        </div>
        
        <div className="container relative py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/80 text-pink-600 border-pink-200 px-4 py-2 text-sm">
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Valentine's Day 2026 Collection
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Spread the Love with{" "}
              <span className="text-gradient-rainbow">Fairytale Magic</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Handcrafted with love and a sprinkle of magic. Our enchanting Valentine's treats 
              are perfect for sweethearts, friends, and anyone who deserves a little extra love. 
              Limited quantities available for February 13-14 delivery.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-pastel">
                <Gift className="w-5 h-5 mr-2" />
                Shop Curated Tiers
              </Button>
              <Link href="/build-your-own">
                <Button size="lg" variant="outline" className="border-2">
                  <Package className="w-5 h-5 mr-2" />
                  Build Your Own
                </Button>
              </Link>
            </div>
            
            {/* Key Info Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                <Clock className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium">Order by Feb 12</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Sumner County Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                <Sparkles className="w-4 h-4 text-mint-500" />
                <span className="text-sm font-medium">100 Boxes Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Tiers Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Curated Valentine's Tiers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three perfectly crafted collections, each showcasing our signature treats and technology-enhanced creations.
            </p>
          </div>
          
          {tiersLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {tiers?.map((tier, index) => {
                const colors = tierColors[index] || tierColors[0];
                const remaining = tier.inventoryCap ? tier.inventoryCap - (tier.inventorySold || 0) : null;
                
                return (
                  <Card 
                    key={tier.id} 
                    className={`relative overflow-hidden border-2 ${colors.border} hover:shadow-pastel-hover transition-all duration-300 group`}
                  >
                    {/* Tier Badge */}
                    <div className={`absolute top-4 right-4 z-10`}>
                      <Badge className={`${colors.bg} ${colors.accent} border-0`}>
                        Tier {index + 1}
                      </Badge>
                    </div>
                    
                    {/* Limited Stock Badge */}
                    {remaining !== null && remaining <= 10 && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge variant="destructive" className="animate-pulse">
                          Only {remaining} left!
                        </Badge>
                      </div>
                    )}
                    
                    {/* Image */}
                    <div className={`h-48 ${colors.bg} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 shimmer-rainbow opacity-30" />
                      <Gift className={`w-20 h-20 ${colors.accent} opacity-50`} />
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">${tier.basePrice}</span>
                        {user && (
                          <Badge variant="outline" className="text-xs">
                            Academy: ${(parseFloat(tier.basePrice) * 0.8).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="prose prose-sm text-muted-foreground">
                        {tier.description?.split('\n').slice(0, 3).map((line, i) => (
                          <p key={i} className="mb-1">{line}</p>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Link href={`/products/${tier.slug}`} className="w-full">
                        <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Custom Portrait Pucks Section */}
      {customPortrait && (
        <section className="py-20 bg-gradient-rainbow-soft">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-white text-purple-600 border-purple-200">
                  <Camera className="w-4 h-4 mr-2" />
                  Exclusive Technology
                </Badge>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Custom Portrait Pucks
                </h2>
                
                <p className="text-lg text-muted-foreground mb-6">
Turn your favorite photo into an edible keepsake. Our artists lovingly transform 
                  your memories into hand-crafted Oreo masterpieces that taste as magical as they look.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-pastel-pink flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Perfect for Special Moments</h4>
                      <p className="text-sm text-muted-foreground">Anniversary photos, family portraits, pet tributes, engagement announcements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-pastel-lavender flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">72-Hour Advance Order</h4>
                      <p className="text-sm text-muted-foreground">Order cutoff: February 10, 2026. 50% deposit required at booking.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-pastel-mint flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Limited Availability</h4>
                      <p className="text-sm text-muted-foreground">Only 10 custom portrait orders accepted. 6-puck minimum ($48).</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-4xl font-bold text-primary">${customPortrait.basePrice}</span>
                  <span className="text-muted-foreground">per puck</span>
                </div>
                
                <Link href="/custom-portrait-pucks">
                  <Button size="lg" className="shadow-pastel">
                    <Camera className="w-5 h-5 mr-2" />
                    Order Custom Portraits
                  </Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-white shadow-pastel-hover overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-rainbow opacity-10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-24 h-24 text-purple-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">Your photo, transformed into edible art</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-semibold text-purple-600">Projection Tech</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Build Your Own CTA */}
      <section className="py-20 bg-white">
        <div className="container">
          <Card className="bg-gradient-rainbow p-1 rounded-2xl">
            <div className="bg-white rounded-xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Build Your Own Box
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Create a personalized Valentine's treat box with exactly what you want. 
                    Start with a base box and add your favorite items with our live pricing calculator.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline">Chocolate Chip Cookies</Badge>
                    <Badge variant="outline">Royal Icing Cookies</Badge>
                    <Badge variant="outline">Oreo Pucks</Badge>
                    <Badge variant="outline">Brownies</Badge>
                    <Badge variant="outline">Freeze-Dried Candy</Badge>
                    <Badge variant="outline">Mini Cakes</Badge>
                  </div>
                  
                  <Link href="/build-your-own">
                    <Button size="lg" className="shadow-pastel">
                      <Package className="w-5 h-5 mr-2" />
                      Start Building
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {['🍪', '🧁', '🍫', '🍓', '🎂', '🍬'].map((emoji, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-xl flex items-center justify-center text-4xl ${
                        ['bg-pastel-pink', 'bg-pastel-lavender', 'bg-pastel-mint', 'bg-pastel-peach', 'bg-pastel-sky', 'bg-pastel-yellow'][i]
                      }`}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Delivery Info */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Delivery Information</h2>
            <p className="text-muted-foreground">Serving Sumner County with love</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <MapPin className="w-10 h-10 text-pink-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">30-Mile Radius</h3>
              <p className="text-sm text-muted-foreground">
                From Castalian Springs, TN via DoorDash & Uber Eats throughout Sumner County.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Clock className="w-10 h-10 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Feb 13-14 Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred delivery date. Same-day and scheduled options available.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Gift className="w-10 h-10 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Order Cutoff</h3>
              <p className="text-sm text-muted-foreground">
                Tiers: Feb 12 | Custom Portraits: Feb 10. Don't miss out!
              </p>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/delivery-zones">
              <Button variant="outline">
                Check Your ZIP Code
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
