/**
 * Stripe product configuration
 * This file is not used for the bakery products themselves,
 * but could be used for subscription plans or other Stripe-specific products if needed in the future.
 *
 * For now, we handle bakery products dynamically through the database and create
 * Stripe checkout sessions on-the-fly based on cart contents.
 */

export const STRIPE_PRODUCTS = {
  // Future: Add subscription plans or other Stripe products here if needed
};
