import { Link } from "wouter";
import { Facebook, Instagram, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand with Logo */}
          <div className="space-y-4">
            <Link href="/">
              <a className="block">
                <img 
                  src="/images/fairytale-farms-logo.png" 
                  alt="Fairytale Farms" 
                  className="h-24 w-auto object-contain"
                />
              </a>
            </Link>
            <p className="text-sm text-muted-foreground">
              Where every treat tells a story! Handcrafted with love, our magical creations turn ordinary moments into extraordinary memories.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
              <span>in Castalian Springs, TN</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    All Products
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/valentines">
                  <a className="text-muted-foreground hover:text-pink-500 transition-colors">
                    Valentine's 2026 Collection
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/lab">
                  <a className="text-muted-foreground hover:text-purple-500 transition-colors">
                    In the Lab
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/my-orders">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    My Orders
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-pastel-lavender" />
                <a href="mailto:fairytalefarms.net@gmail.com" className="hover:text-primary transition-colors">fairytalefarms.net@gmail.com</a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-pastel-mint" />
                <span>Castalian Springs, TN<br />Sumner County • DoorDash & Uber Eats</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/delivery-zones">
                <a className="text-sm text-primary hover:underline">
                  Check Delivery Area →
                </a>
              </Link>
            </div>
          </div>
          
          {/* Social & Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/share/1ATGMAQo44/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-blue-600 transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/fairytale.farms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-pink-500 transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2 text-foreground">Order Hours</p>
              <p>Orders accepted 24/7 online</p>
              <p className="mt-2 text-xs">
                Custom orders require 48-72 hours notice
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Fairytale Farms Bakery. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy">
                <a className="hover:text-primary transition-colors">Privacy Policy</a>
              </Link>
              <Link href="/terms">
                <a className="hover:text-primary transition-colors">Terms of Service</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
