import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageView } from "@/lib/analytics";

/**
 * Tracks SPA page views on every route change.
 * Place inside the router context (App.tsx).
 */
export default function PageViewTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(window.location.href);
  }, [location]);

  return null;
}
