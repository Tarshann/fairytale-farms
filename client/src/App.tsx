import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminInquiries from "./pages/admin/AdminInquiries";
import ChatWidget from "./components/ChatWidget";
import Login from "./pages/Login";

// Valentine's Day 2026 Collection
import ValentinesCollection from "./pages/ValentinesCollection";
import Wishlist from "./pages/Wishlist";
import BuildYourOwn from "./pages/BuildYourOwn";
import CustomPortraitPucks from "./pages/CustomPortraitPucks";
import DeliveryZones from "./pages/DeliveryZones";
import Lab from "./pages/Lab";
import About from "./pages/About";
import BickeringBros from "./pages/BickeringBros";
import Gallery from "./pages/Gallery";
import FAQ from "./pages/FAQ";

function Router() {
  return (
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

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
