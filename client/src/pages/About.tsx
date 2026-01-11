import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Heart, Sparkles, Cookie, Cake, Star, Award, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section with Logo */}
        <section className="relative py-20 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-pastel-pink/20 via-pastel-lavender/20 to-pastel-mint/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-pastel-peach/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pastel-blue/30 rounded-full blur-3xl" />
          
          <div className="container relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <img 
                src="/images/fairytale-farms-logo.png" 
                alt="Fairytale Farms" 
                className="h-48 md:h-64 w-auto object-contain mb-8"
              />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-gradient-rainbow">Our Story</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Where every treat tells a story, and every bite creates a memory.
              </p>
            </div>
          </div>
        </section>
        
        {/* The Beginning */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-pastel-pink">
                  <Heart className="h-5 w-5 fill-pastel-pink" />
                  <span className="text-sm font-medium uppercase tracking-wider">Our Beginning</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  A Dream Baked with Love
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Fairytale Farms began in a small kitchen with a big dream: to create treats that bring 
                    joy and wonder to every celebration. What started as baking for family and friends 
                    quickly blossomed into something magical.
                  </p>
                  <p>
                    Based in Goodlettsville, Tennessee, we believe that every cookie, cake, and sweet 
                    treat should be crafted with the same love and attention you'd give to something 
                    made for your own family. Because to us, every customer becomes part of our 
                    Fairytale Farms family.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-pastel-pink/30 via-pastel-lavender/30 to-pastel-mint/30 p-8 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Sparkles className="h-16 w-16 mx-auto text-gold" />
                    <p className="text-2xl font-serif italic text-muted-foreground">
                      "Every treat deserves to be extraordinary"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* What We Offer */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-pastel-lavender mb-4">
                <Cookie className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">What We Create</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Handcrafted with Magic
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From custom celebration cakes to artisanal sugar cookies, each creation is made 
                fresh to order with premium ingredients and endless creativity.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Cake,
                  title: "Custom Cakes",
                  description: "Stunning celebration cakes designed for your special moments, from birthdays to weddings.",
                  color: "text-pastel-pink"
                },
                {
                  icon: Cookie,
                  title: "Sugar Cookies",
                  description: "Beautifully decorated cookies featuring custom designs, including our signature 3D-printed cutters.",
                  color: "text-pastel-lavender"
                },
                {
                  icon: Heart,
                  title: "Sweet Treats",
                  description: "Cinnamon buns, cake pops, brownies, cheesecakes, and chocolate covered strawberries.",
                  color: "text-pastel-mint"
                },
                {
                  icon: Star,
                  title: "Seasonal Collections",
                  description: "Special limited-edition treats for holidays and celebrations throughout the year.",
                  color: "text-pastel-peach"
                },
                {
                  icon: Sparkles,
                  title: "Custom Creations",
                  description: "Unique designs brought to life with our innovative cookie cutter lab and artistic decorating.",
                  color: "text-pastel-blue"
                },
                {
                  icon: Award,
                  title: "Premium Quality",
                  description: "Only the finest ingredients, made fresh to order with attention to every detail.",
                  color: "text-gold"
                }
              ].map((item, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <item.icon className={`h-10 w-10 mx-auto mb-4 ${item.color}`} />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* The Lab Teaser */}
        <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 text-purple-600 mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Innovation Meets Tradition</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                The Fairytale Farms Lab
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Step behind the scenes and discover how we bring custom cookie designs to life. 
                Our lab combines creativity with innovation to create one-of-a-kind cookie cutters 
                for truly unique treats.
              </p>
              <Link href="/lab">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Visit The Lab
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Makes Us Special
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-pastel-pink/30 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold">Made with Love</h3>
                <p className="text-muted-foreground">
                  Every treat is handcrafted with care and attention, just like we'd make for our own family.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-pastel-lavender/30 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold">Community First</h3>
                <p className="text-muted-foreground">
                  Proudly serving the Nashville area with local delivery and a commitment to our neighbors.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-pastel-mint/30 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold">Creative Magic</h3>
                <p className="text-muted-foreground">
                  From custom designs to innovative techniques, we bring your sweetest dreams to life.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Location & Delivery */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-pastel-mint">
                    <MapPin className="h-5 w-5" />
                    <span className="text-sm font-medium uppercase tracking-wider">Find Us</span>
                  </div>
                  <h2 className="text-3xl font-bold">
                    Serving the Nashville Area
                  </h2>
                  <p className="text-muted-foreground">
                    Based in Goodlettsville, Tennessee, we deliver fresh treats throughout the 
                    greater Nashville area within a 30-mile radius. Can't wait? Local pickup 
                    is always available!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/delivery-zones">
                      <Button variant="outline">
                        Check Delivery Area
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button>
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Delivery Coverage</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pastel-pink" />
                        Goodlettsville & Hendersonville
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pastel-lavender" />
                        Nashville & Brentwood
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pastel-mint" />
                        Franklin & Mt. Juliet
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pastel-peach" />
                        Gallatin & Lebanon
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pastel-blue" />
                        And more within 30 miles!
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-pastel-pink/30 via-pastel-lavender/30 to-pastel-mint/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Create Something Magical?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether it's a birthday celebration, wedding, holiday gathering, or just because – 
                let us help make your moment unforgettable.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    Browse Our Treats
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
