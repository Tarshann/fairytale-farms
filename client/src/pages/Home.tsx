import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Sparkles, Heart, Award, Gift, Camera, Package, Clock, MapPin, Star, Cake, Cookie, Cherry, IceCream, Croissant, FlaskConical, Printer, Play } from "lucide-react";

// Gallery section component - single image per category (compact size)
function GallerySection({ 
  title, 
  description, 
  image, 
  link, 
  bgColor 
}: { 
  title: string; 
  description: string; 
  image: { src: string; alt: string }; 
  link: string;
  bgColor: string;
}) {
  return (
    <Link href={link}>
      <div className="group cursor-pointer">
        <div className={`h-48 md:h-56 rounded-xl overflow-hidden shadow-pastel hover:shadow-pastel-hover transition-all duration-300 ${bgColor}`}>
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
          <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            View <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

// Sidebar menu component
function SidebarMenu() {
  const menuCategories = [
    { name: "Custom Cakes", icon: Cake, href: "/products?category=customized-cakes", color: "text-pink-500" },
    { name: "Sugar Cookies", icon: Cookie, href: "/products?category=customized-sugar-cookies", color: "text-purple-500" },
    { name: "Cinnamon Buns", icon: Croissant, href: "/products?category=cinnamon-buns", color: "text-amber-500" },
    { name: "Cake Pops", icon: Cherry, href: "/products?category=cake-pops", color: "text-red-400" },
    { name: "Brownies", icon: IceCream, href: "/products?category=brownies", color: "text-amber-700" },
    { name: "Cheesecake", icon: Cake, href: "/products?category=cheesecake", color: "text-yellow-500" },
    { name: "Chocolate Strawberries", icon: Heart, href: "/products?category=chocolate-covered-strawberries", color: "text-red-500" },
  ];

  const specialCollections = [
    { name: "Valentine's Collection", icon: Heart, href: "/valentines", color: "text-pink-500", badge: "NEW" },
    { name: "Build Your Own Box", icon: Package, href: "/build-your-own", color: "text-purple-500" },
    { name: "Portrait Pucks", icon: Camera, href: "/custom-portrait-pucks", color: "text-green-500" },
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Special Collections */}
        <Card className="border-2 border-pink-100 shadow-pastel overflow-hidden">
          <div className="bg-gradient-rainbow-soft p-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Special Collections
            </h3>
          </div>
          <CardContent className="p-0">
            <nav className="divide-y">
              {specialCollections.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="font-medium group-hover:text-primary transition-colors">{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-pink-500 text-white text-xs">{item.badge}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* All Categories */}
        <Card className="shadow-pastel">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Browse by Category
            </h3>
            <nav className="space-y-1">
              {menuCategories.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                    <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-sm group-hover:text-primary transition-colors">{item.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="shadow-pastel bg-pastel-mint/30">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Delivery Info
            </h3>
            <p className="text-sm text-muted-foreground">
              We deliver to the Nashville area within a 30-mile radius of Goodlettsville, TN.
            </p>
            <Link href="/delivery-zones">
              <Button variant="outline" size="sm" className="w-full">
                Check Your ZIP Code
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

export default function Home() {
  const { data: categories } = trpc.categories.list.useQuery();
  
  // Single image per gallery category
  const cakeImage = { src: "/images/481921085_1253005226678831_1341694159329657887_n.jpg", alt: "Custom Birthday Cake" };
  const cookieImage = { src: "/images/344689592_197741496452305_5407816167306511262_n.jpg", alt: "Decorated Sugar Cookies" };
  const treatsImage = { src: "/images/brownies.jpg", alt: "Gourmet Brownies" };
  const cinnamonImage = { src: "/images/cinnamon_buns.jpg", alt: "Fresh Cinnamon Buns" };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1">
        {/* Whimsical Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-rainbow-soft">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-40 h-40 bg-pastel-pink rounded-full blur-3xl opacity-50" />
            <div className="absolute top-20 right-20 w-48 h-48 bg-pastel-lavender rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-pastel-mint rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-20 right-1/4 w-36 h-36 bg-pastel-peach rounded-full blur-3xl opacity-50" />
          </div>
          
          <div className="container relative py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge className="bg-white/80 text-pink-600 border-pink-200 px-4 py-2 text-sm animate-pulse">
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Valentine's Day 2026 Collection Now Available!
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Welcome to{" "}
                <span className="text-gradient-rainbow">Fairytale Farms</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Where every treat tells a story! Handcrafted with love, our magical creations 
                turn ordinary moments into extraordinary memories. 
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/valentines">
                  <Button size="lg" className="shadow-pastel bg-primary hover:bg-primary/90">
                    <Heart className="mr-2 h-5 w-5 fill-current" />
                    Shop Valentine's Collection
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="border-2">
                    Browse All Treats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Quick Info */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium">Order by Feb 12</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Nashville Area Delivery</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Limited Quantities</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Menu */}
              <SidebarMenu />
              
              {/* Main Gallery Content - 2x2 Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <GallerySection
                    title="Custom Cakes"
                    description="Magical creations for every celebration"
                    image={cakeImage}
                    link="/products?category=customized-cakes"
                    bgColor="bg-pastel-pink/20"
                  />
                  <GallerySection
                    title="Sugar Cookies"
                    description="Beautifully decorated and deliciously sweet"
                    image={cookieImage}
                    link="/products?category=customized-sugar-cookies"
                    bgColor="bg-pastel-lavender/20"
                  />
                  <GallerySection
                    title="Sweet Treats"
                    description="Brownies, cake pops, cheesecake & more"
                    image={treatsImage}
                    link="/products"
                    bgColor="bg-pastel-peach/20"
                  />
                  <GallerySection
                    title="Cinnamon Buns"
                    description="Fresh-baked and irresistibly gooey"
                    image={cinnamonImage}
                    link="/products?category=cinnamon-buns"
                    bgColor="bg-pastel-mint/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* What Makes Us Special - Whimsical Version */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Makes Us Magical</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every treat from Fairytale Farms is crafted with a sprinkle of magic and a whole lot of love
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-pink">
                    <Heart className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Made with Love</h3>
                  <p className="text-muted-foreground">
                    Every item is handcrafted with care using premium ingredients and a whole lot of heart.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-lavender">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">A Touch of Magic</h3>
                  <p className="text-muted-foreground">
                    Our secret? A sprinkle of fairy dust and years of baking expertise in every creation.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-pastel bg-white">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pastel-mint">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    We use only the finest ingredients to ensure every bite is a delightful experience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Valentine's Day Quick Links - No Prices */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="text-center mb-12">
              <Badge className="bg-pink-100 text-pink-600 mb-4">
                <Heart className="w-3 h-3 mr-1 fill-current" /> Limited Time
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Valentine's Day Specials</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Show your love with our enchanting Valentine's collection
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/valentines">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-pink-200 hover:shadow-pastel transition-all duration-300 overflow-hidden h-full">
                  <div className="aspect-video bg-gradient-to-br from-pastel-pink to-pastel-lavender flex items-center justify-center">
                    <Gift className="w-16 h-16 text-pink-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">Curated Gift Boxes</h3>
                    <p className="text-muted-foreground">Three perfectly crafted Valentine's collections for every budget</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/build-your-own">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-purple-200 hover:shadow-pastel transition-all duration-300 overflow-hidden h-full">
                  <div className="aspect-video bg-gradient-to-br from-pastel-lavender to-pastel-sky flex items-center justify-center">
                    <Package className="w-16 h-16 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">Build Your Own Box</h3>
                    <p className="text-muted-foreground">Create a custom box filled with your sweetheart's favorite treats</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/custom-portrait-pucks">
                <Card className="group cursor-pointer border-2 border-transparent hover:border-green-200 hover:shadow-pastel transition-all duration-300 overflow-hidden h-full">
                  <div className="aspect-video bg-gradient-to-br from-pastel-mint to-pastel-sky flex items-center justify-center">
                    <Camera className="w-16 h-16 text-green-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">Custom Portrait Pucks</h3>
                    <p className="text-muted-foreground">Turn your favorite photo into a delicious edible keepsake</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* In the Lab Teaser Section */}
        <section className="py-16 bg-gradient-to-r from-pastel-lavender/30 via-white to-pastel-pink/30">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="bg-pastel-lavender/50 text-purple-700 border-0 mb-4">
                  <FlaskConical className="w-3 h-3 mr-1" />
                  Behind the Magic
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  In the Lab with{" "}
                  <span className="text-gradient-rainbow">Fairytale Farms</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Ever wonder how we create those perfect custom cookie cutters and stamps? 
                  Peek behind the curtain and watch the magic happen in real-time!
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Printer className="w-4 h-4 text-purple-500" />
                    <span>3D Printed Tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Camera className="w-4 h-4 text-pink-500" />
                    <span>Live Lab Cam</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Custom Designs</span>
                  </div>
                </div>
                <Link href="/lab">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Play className="w-4 h-4 mr-2" />
                    Visit the Lab
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <Card className="overflow-hidden border-2 border-pastel-lavender/50 shadow-pastel">
                  <div className="aspect-video bg-gradient-to-br from-pastel-lavender/20 to-pastel-pink/20 flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <FlaskConical className="w-10 h-10 text-purple-500" />
                      </div>
                      <p className="text-muted-foreground">See what's printing today!</p>
                    </div>
                    {/* Live indicator */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                      <span className="text-xs font-medium text-purple-600">Lab Updates</span>
                    </div>
                  </div>
                </Card>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-pastel-pink flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-xl">🍪</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-10 h-10 rounded-full bg-pastel-mint flex items-center justify-center shadow-lg">
                  <span className="text-lg">✨</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial/Story Section */}
        <section className="py-16 bg-gradient-rainbow-soft">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Sparkles className="w-12 h-12 text-pink-500 mx-auto" />
              <blockquote className="text-2xl md:text-3xl font-display italic text-foreground/80">
                "Every treat has a story, and we're here to help you tell yours. From birthday wishes to wedding dreams, 
                we bake happiness into every creation."
              </blockquote>
              <p className="text-muted-foreground font-medium">— The Fairytale Farms Family</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
