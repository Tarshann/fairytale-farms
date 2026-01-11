import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, Menu, X, Heart, Sparkles, FlaskConical } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: cartItems } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/valentines", label: "Valentine's 2026", special: true },
    { href: "/lab", label: "The Lab", lab: true },
    { href: "/products", label: "All Products" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <img 
                src="/images/fairytale-farms-logo.png" 
                alt="Fairytale Farms" 
                className="h-12 w-auto object-contain"
              />
            </a>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.special && <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />}
                  {link.lab && <FlaskConical className="w-4 h-4 text-purple-500" />}
                  {link.label}
                  {link.special && (
                    <Badge className="ml-1 bg-pastel-pink text-pink-700 border-0 text-xs py-0 px-1.5">
                      NEW
                    </Badge>
                  )}
                  {link.lab && (
                    <Badge className="ml-1 bg-pastel-lavender text-purple-700 border-0 text-xs py-0 px-1.5">
                      LIVE
                    </Badge>
                  )}
                </a>
              </Link>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link href="/my-orders">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    My Orders
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </a>
            )}
            
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600 hover:bg-pink-50">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/cart">
              <Button variant="outline" size="sm" className="relative border-primary/30 hover:border-primary">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="text-pink-500">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`flex items-center gap-2 py-3 px-2 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  } ${link.special ? "bg-pastel-pink/30" : ""} ${link.lab ? "bg-pastel-lavender/30" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.special && <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />}
                  {link.lab && <FlaskConical className="w-4 h-4 text-purple-500" />}
                  {link.label}
                  {link.special && (
                    <Badge className="ml-auto bg-pink-500 text-white border-0 text-xs">
                      NEW
                    </Badge>
                  )}
                  {link.lab && (
                    <Badge className="ml-auto bg-purple-500 text-white border-0 text-xs">
                      LIVE
                    </Badge>
                  )}
                </a>
              </Link>
            ))}
            
            <div className="pt-4 space-y-2 border-t border-border">
              <Link href="/wishlist">
                <Button variant="ghost" className="w-full justify-start text-pink-500" onClick={() => setMobileMenuOpen(false)}>
                  <Heart className="h-4 w-4 mr-2" />
                  My Wishlist
                </Button>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/my-orders">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                        Admin
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
