import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PageViewTracker from "./components/PageViewTracker";

// Eagerly loaded (critical path)
import Home from "./pages/Home";
import Products from "./pages/Products";

// Lazy-loaded routes (split into separate chunks)
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ValentinesCollection = lazy(() => import("./pages/ValentinesCollection"));
const BuildYourOwn = lazy(() => import("./pages/BuildYourOwn"));
const CustomPortraitPucks = lazy(() => import("./pages/CustomPortraitPucks"));
const DeliveryZones = lazy(() => import("./pages/DeliveryZones"));
const Lab = lazy(() => import("./pages/Lab"));
const About = lazy(() => import("./pages/About"));
const BickeringBros = lazy(() => import("./pages/BickeringBros"));
const Gallery = lazy(() => import("./pages/Gallery"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

// Admin routes (separate chunk)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminDeliveryZones = lazy(() => import("./pages/admin/AdminDeliveryZones"));
const AdminPhotoReviews = lazy(() => import("./pages/admin/AdminPhotoReviews"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        {/* Public routes */}
        <Route path={"/"} component={Home} />
        <Route path={"/products"} component={Products} />
        <Route path={"/products/:slug"} component={ProductDetail} />
        <Route path={"/cart"} component={Cart} />
        <Route path={"/checkout"} component={Checkout} />
        <Route path={"/order-confirmation"} component={OrderConfirmation} />
        <Route
          path={"/order-confirmation/:orderNumber"}
          component={OrderConfirmation}
        />
        <Route path={"/my-orders"} component={MyOrders} />
        <Route path={"/orders/:id"} component={OrderDetail} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/login"} component={Login} />
        <Route path={"/wishlist"} component={Wishlist} />
        <Route path={"/account/orders"} component={MyOrders} />

        {/* Valentine's Day 2026 Collection */}
        <Route path={"/valentines"} component={ValentinesCollection} />
        <Route path={"/build-your-own"} component={BuildYourOwn} />
        <Route path={"/custom-portrait-pucks"} component={CustomPortraitPucks} />
        <Route path={"/delivery-zones"} component={DeliveryZones} />
        <Route path={"/lab"} component={Lab} />
        <Route path={"/about"} component={About} />
        <Route path={"/bickering-bros"} component={BickeringBros} />
        <Route path={"/gallery"} component={Gallery} />
        <Route path={"/faq"} component={FAQ} />

        {/* Admin routes */}
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/products"} component={AdminProducts} />
        <Route path={"/admin/orders"} component={AdminOrders} />
        <Route path={"/admin/contacts"} component={AdminContacts} />
        <Route path={"/admin/settings"} component={AdminSettings} />
        <Route path={"/admin/inquiries"} component={AdminInquiries} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/admin/promo-codes"} component={AdminPromoCodes} />
        <Route path={"/admin/delivery-zones"} component={AdminDeliveryZones} />
        <Route path={"/admin/photo-reviews"} component={AdminPhotoReviews} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PageViewTracker />
          <Router />
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
