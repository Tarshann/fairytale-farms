import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Package,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Settings,
  Sparkles,
  Users,
  Tag,
  MapPin,
  Image,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <p className="text-muted-foreground">
              Please sign in with an admin account
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg">Sign In</Button>
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12">
          <div className="container text-center space-y-6">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Admin <span className="text-gradient-gold">Dashboard</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Products
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalProducts || 0}
                    </p>
                  </div>
                  <Package className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Orders
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalOrders || 0}
                    </p>
                  </div>
                  <ShoppingCart className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-bold">
                      ${stats?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Messages
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalContacts || 0}
                    </p>
                  </div>
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/products">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <Package className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Manage Products</h3>
                    <p className="text-sm text-muted-foreground">
                      Add, edit, or remove products
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/orders">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <ShoppingCart className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">View Orders</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage customer orders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/contacts">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Contact Messages</h3>
                    <p className="text-sm text-muted-foreground">
                      View customer inquiries
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/settings">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <Settings className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Site Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Page visibility & pricing
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/inquiries">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer bg-gradient-to-br from-pink-50 to-rose-50">
                <CardContent className="p-6 text-center space-y-4">
                  <Sparkles className="h-12 w-12 mx-auto text-pink-500" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Custom Order Inquiries
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI chatbot order requests
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6 text-center space-y-4">
                  <Users className="h-12 w-12 mx-auto text-blue-500" />
                  <div>
                    <h3 className="text-xl font-bold">Manage Users</h3>
                    <p className="text-sm text-muted-foreground">
                      User roles & access control
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/promo-codes">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center space-y-4">
                  <Tag className="h-12 w-12 mx-auto text-green-500" />
                  <div>
                    <h3 className="text-xl font-bold">Promo Codes</h3>
                    <p className="text-sm text-muted-foreground">
                      Discounts & promotions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/delivery-zones">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-6 text-center space-y-4">
                  <MapPin className="h-12 w-12 mx-auto text-amber-500" />
                  <div>
                    <h3 className="text-xl font-bold">Delivery Zones</h3>
                    <p className="text-sm text-muted-foreground">
                      Service areas & delivery fees
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/photo-reviews">
              <Card className="hover:shadow-card-hover transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="p-6 text-center space-y-4">
                  <Image className="h-12 w-12 mx-auto text-purple-500" />
                  <div>
                    <h3 className="text-xl font-bold">Photo Reviews</h3>
                    <p className="text-sm text-muted-foreground">
                      Custom portrait photo approvals
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
