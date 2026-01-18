import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, Check, Heart, Cake, Cookie, MessageCircle, Truck, Home as HomeIcon, Users } from "lucide-react";

export default function Home() {
  // Best gallery images for each section
  const heroImage = "/images/gallery/cake-happily-ever-after-wedding.jpeg";
  const cookiesImage = "/images/gallery/sugar-cookies-wedding-kelsea-tommy.jpeg";
  const browniesImage = "/images/brownies.jpg";
  const kidsBirthdayImage = "/images/gallery/cake-frozen-elsa-birthday.jpeg";
  const elegantCakeImage = "/images/gallery/cake-elegant-blue-two-tier.jpeg";
  const cupcakeImage = "/images/gallery/cake-royal-crown-gold.jpeg";
  const aboutImage = "/images/gallery/cake-cinnamoroll-sanrio.jpeg";
  const ctaImage = "/images/gallery/sugar-cookies-baby-girl-caroline.jpeg";
  
  // Gallery preview images (best 6)
  const galleryImages = [
    { src: "/images/gallery/cake-happily-ever-after-wedding.jpeg", alt: "Wedding Cake" },
    { src: "/images/gallery/sugar-cookies-wedding-kelsea-tommy.jpeg", alt: "Wedding Cookies" },
    { src: "/images/gallery/cake-frozen-elsa-birthday.jpeg", alt: "Frozen Birthday Cake" },
    { src: "/images/gallery/sugar-cookies-harry-potter-graduation.jpeg", alt: "Harry Potter Cookies" },
    { src: "/images/gallery/cake-elegant-blue-two-tier.jpeg", alt: "Elegant Two-Tier Cake" },
    { src: "/images/gallery/sugar-cookies-pink-dinosaur.jpeg", alt: "Dinosaur Cookies" },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative min-h-[70vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Beautiful custom cake" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
          </div>
          
          <div className="container relative z-10 py-16 md:py-24">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Custom Cakes, Cookies & Sweet Treats Made with Heart
              </h1>
              
              <p className="text-lg md:text-xl text-gray-700">
                Handcrafted desserts for birthdays, celebrations, and everyday moments—made fresh, never mass-produced.
              </p>
              
              <p className="text-base text-gray-600 flex items-center gap-2">
                <Truck className="w-5 h-5 text-pink-500" />
                Serving Gallatin & surrounding Tennessee communities
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/products?category=classic-cookies">
                  <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg">
                    <Cookie className="mr-2 h-5 w-5" />
                    Order Cookies & Brownies
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-2 border-gray-800 text-gray-800 hover:bg-gray-100">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Custom Cake Inquiry
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK REASSURANCE STRIP */}
        <section className="py-6 bg-gray-50 border-y border-gray-100">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium">Made from scratch</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium">Custom designs welcome</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium">Porch pickup available</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium">Local, family-owned bakery</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED OFFER: COOKIES & BROWNIES */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src={cookiesImage} 
                  alt="Fresh baked cookies" 
                  className="rounded-xl shadow-lg w-full h-48 md:h-64 object-cover"
                />
                <img 
                  src={browniesImage} 
                  alt="Rich fudgy brownies" 
                  className="rounded-xl shadow-lg w-full h-48 md:h-64 object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Cookie className="w-8 h-8 text-amber-500" />
                  <h2 className="text-3xl md:text-4xl font-bold">Cookies & Brownies</h2>
                </div>
                <p className="text-lg text-gray-600 font-medium">Ready to Order</p>
                
                <p className="text-gray-700">
                  Perfect for gifts, parties, or a sweet night in.
                </p>
                
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Fresh-baked cookies by the half dozen or dozen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Rich, fudgy brownies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Porch pickup or local delivery</span>
                  </li>
                </ul>
                
                <Link href="/products?category=classic-cookies">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                    Shop Cookies & Brownies
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-500 italic">
                  Want something custom? Keep scrolling—we do that too.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOM CAKES SECTION */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            {/* 3 Image Row */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <img 
                src={kidsBirthdayImage} 
                alt="Kids birthday cake" 
                className="rounded-xl shadow-lg w-full h-40 md:h-56 object-cover"
              />
              <img 
                src={elegantCakeImage} 
                alt="Elegant celebration cake" 
                className="rounded-xl shadow-lg w-full h-40 md:h-56 object-cover"
              />
              <img 
                src={cupcakeImage} 
                alt="Cupcake set" 
                className="rounded-xl shadow-lg w-full h-40 md:h-56 object-cover"
              />
            </div>
            
            {/* Content */}
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-2">
                <Cake className="w-8 h-8 text-pink-500" />
                <h2 className="text-3xl md:text-4xl font-bold">Custom Cakes Made Just for You</h2>
              </div>
              
              <p className="text-lg text-gray-700">
                From kids' birthdays to milestone celebrations, every cake is designed specifically for your event.
              </p>
              
              <div className="text-left max-w-md mx-auto">
                <p className="font-semibold text-gray-800 mb-3">Popular requests include:</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Birthday cakes (kids & adults)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Cupcake sets
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Themed desserts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Simple and elegant designs
                  </li>
                </ul>
              </div>
              
              {/* How it works */}
              <div className="bg-white rounded-2xl p-8 shadow-sm mt-8">
                <h3 className="font-semibold text-xl mb-6 text-gray-800">How it works:</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">1</div>
                    <p className="text-gray-700">Tell us your idea using our cake inquiry form</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">2</div>
                    <p className="text-gray-700">We confirm design, size, and pricing</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">3</div>
                    <p className="text-gray-700">Your cake is baked fresh and ready for pickup</p>
                  </div>
                </div>
              </div>
              
              <Link href="/contact">
                <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white mt-4">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Start a Custom Cake Order
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* GALLERY PREVIEW */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">See Our Work</h2>
              <p className="text-gray-600">Every dessert is made with care and attention to detail.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image, index) => (
                <img 
                  key={index}
                  src={image.src} 
                  alt={image.alt} 
                  className="rounded-xl shadow-md w-full aspect-square object-cover hover:shadow-lg transition-shadow"
                />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link href="/gallery">
                <Button variant="outline" size="lg" className="border-2">
                  View Full Gallery
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Image */}
              <div>
                <img 
                  src={aboutImage} 
                  alt="Fairytale Farms bakery" 
                  className="rounded-2xl shadow-lg w-full h-80 md:h-96 object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Welcome to Fairytale Farms</h2>
                
                <p className="text-lg text-gray-700 leading-relaxed">
                  Fairytale Farms is a small, family-run bakery built on love for baking and celebrating life's sweetest moments. Every order is handcrafted, thoughtfully designed, and made as if it were for our own family.
                </p>
                
                <p className="text-lg text-gray-700 leading-relaxed">
                  We believe desserts should feel special—because the moments they're part of truly are.
                </p>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5 text-pink-500" />
                  <span>Family-owned in Castalian Springs, Tennessee</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW ORDERING WORKS */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-10">How Ordering Works</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 font-bold text-2xl flex items-center justify-center mx-auto">1</div>
                  <h3 className="font-semibold text-lg">Choose</h3>
                  <p className="text-gray-600">Choose a ready-to-order item or submit a custom request</p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 font-bold text-2xl flex items-center justify-center mx-auto">2</div>
                  <h3 className="font-semibold text-lg">Confirm</h3>
                  <p className="text-gray-600">We confirm availability and details</p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 font-bold text-2xl flex items-center justify-center mx-auto">3</div>
                  <h3 className="font-semibold text-lg">Enjoy</h3>
                  <p className="text-gray-600">Pick up your order and enjoy</p>
                </div>
              </div>
              
              <p className="text-gray-600 mt-8">
                Questions? We're happy to help.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="relative py-20">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={ctaImage} 
              alt="Celebration cookies" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-900/80 to-purple-900/80" />
          </div>
          
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Ready to Order Something Sweet?
            </h2>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/products?category=classic-cookies">
                <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100">
                  <Cookie className="mr-2 h-5 w-5" />
                  Order Cookies & Brownies
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Custom Cake Inquiry
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER TRUST SIGNALS */}
        <section className="py-8 bg-gray-100 border-t border-gray-200">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-pink-500" />
                <span>Local Tennessee Bakery</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                <span>Easy communication</span>
              </div>
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-500" />
                <span>Made fresh to order</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
