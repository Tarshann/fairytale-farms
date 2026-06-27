/**
 * inventory.ts — single source of truth for stock math.
 *
 * Used by the server (low-stock cron) and the client (product cards) so the
 * "remaining" number and sold-out state can never drift between them.
 */

export type StockSource = {
  inventoryCap?: number | null;
  inventorySold?: number | null;
};

/** Whether a product tracks a finite inventory at all. */
export function tracksInventory(p: StockSource): boolean {
  return typeof p.inventoryCap === "number" && p.inventoryCap > 0;
}

/**
 * Units still available. Returns null when the product is not inventory-capped
 * (i.e. effectively unlimited). Never returns a negative number.
 */
export function remainingStock(p: StockSource): number | null {
  if (!tracksInventory(p)) return null;
  const remaining = (p.inventoryCap as number) - (p.inventorySold ?? 0);
  return remaining > 0 ? remaining : 0;
}

/** True only for inventory-capped products that have sold out. */
export function isSoldOut(p: StockSource): boolean {
  const remaining = remainingStock(p);
  return remaining !== null && remaining <= 0;
}

/** True when a capped product is at/under the low-stock threshold (default 10). */
export function isLowStock(p: StockSource, threshold = 10): boolean {
  const remaining = remainingStock(p);
  return remaining !== null && remaining > 0 && remaining <= threshold;
}
