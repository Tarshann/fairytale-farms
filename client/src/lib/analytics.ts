import posthog from "posthog-js";

// ---------------------------------------------------------------------------
// PostHog
// ---------------------------------------------------------------------------
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || "https://us.i.posthog.com";

let posthogReady = false;

export function initPostHog() {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we handle this manually for SPA
    capture_pageleave: true,
    autocapture: true,
  });
  posthogReady = true;
}

// ---------------------------------------------------------------------------
// Umami
// ---------------------------------------------------------------------------
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const UMAMI_HOST = import.meta.env.VITE_UMAMI_HOST as string | undefined;

export function initUmami() {
  if (!UMAMI_WEBSITE_ID || !UMAMI_HOST) return;
  // Inject the Umami script tag dynamically so Vite env vars work
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${UMAMI_HOST}/script.js`;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// Unified tracking helpers
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

/** Track a page view (call on every route change). */
export function trackPageView(url?: string) {
  if (posthogReady) {
    posthog.capture("$pageview", url ? { $current_url: url } : undefined);
  }
  // Umami auto-tracks page views from the script tag
}

/** Track a custom event in both PostHog and Umami. */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (posthogReady) {
    posthog.capture(event, properties);
  }
  if (window.umami) {
    window.umami.track(event, properties);
  }
}

/** Identify a user (PostHog only — Umami is privacy-first with no user IDs). */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (posthogReady) {
    posthog.identify(userId, traits);
  }
}

/** Reset identity on logout. */
export function resetAnalytics() {
  if (posthogReady) {
    posthog.reset();
  }
}

// ---------------------------------------------------------------------------
// E-commerce event helpers
// ---------------------------------------------------------------------------

export function trackProductViewed(product: { id: number; name: string; price: string; category?: string }) {
  trackEvent("product_viewed", {
    product_id: product.id,
    product_name: product.name,
    price: parseFloat(product.price),
    category: product.category,
  });
}

export function trackAddToCart(product: { id: number; name: string; price: string; quantity: number }) {
  trackEvent("add_to_cart", {
    product_id: product.id,
    product_name: product.name,
    price: parseFloat(product.price),
    quantity: product.quantity,
  });
}

export function trackRemoveFromCart(productId: number) {
  trackEvent("remove_from_cart", { product_id: productId });
}

export function trackCheckoutStarted(itemCount: number, total: number) {
  trackEvent("checkout_started", { item_count: itemCount, total });
}

export function trackOrderCompleted(order: { orderNumber: string; total: number; itemCount: number }) {
  trackEvent("order_completed", {
    order_number: order.orderNumber,
    total: order.total,
    item_count: order.itemCount,
  });
}

export function trackWishlistToggle(productId: number, added: boolean) {
  trackEvent(added ? "wishlist_add" : "wishlist_remove", { product_id: productId });
}

export function trackSearch(query: string, resultCount: number) {
  trackEvent("search", { query, result_count: resultCount });
}

export function trackChatOpened() {
  trackEvent("chat_opened");
}
