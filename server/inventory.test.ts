import { describe, expect, it } from "vitest";
import {
  tracksInventory,
  remainingStock,
  isSoldOut,
  isLowStock,
} from "../shared/inventory";

describe("inventory math (shared/inventory)", () => {
  describe("tracksInventory", () => {
    it("is false when there is no cap", () => {
      expect(tracksInventory({})).toBe(false);
      expect(tracksInventory({ inventoryCap: null })).toBe(false);
      expect(tracksInventory({ inventoryCap: 0 })).toBe(false);
    });
    it("is true for a positive cap", () => {
      expect(tracksInventory({ inventoryCap: 5 })).toBe(true);
    });
  });

  describe("remainingStock", () => {
    it("returns null for uncapped products", () => {
      expect(remainingStock({})).toBeNull();
      expect(remainingStock({ inventoryCap: 0, inventorySold: 3 })).toBeNull();
    });
    it("subtracts sold from cap", () => {
      expect(remainingStock({ inventoryCap: 10, inventorySold: 4 })).toBe(6);
      expect(remainingStock({ inventoryCap: 10, inventorySold: 0 })).toBe(10);
      expect(remainingStock({ inventoryCap: 10 })).toBe(10);
    });
    it("never goes negative", () => {
      expect(remainingStock({ inventoryCap: 5, inventorySold: 8 })).toBe(0);
    });
    it("regression: does NOT report the cap as remaining once units are sold", () => {
      // The original bug showed inventoryCap (10) instead of remaining (3).
      expect(remainingStock({ inventoryCap: 10, inventorySold: 7 })).toBe(3);
    });
  });

  describe("isSoldOut", () => {
    it("is false for uncapped products", () => {
      expect(isSoldOut({})).toBe(false);
    });
    it("is true exactly when remaining hits zero", () => {
      expect(isSoldOut({ inventoryCap: 5, inventorySold: 5 })).toBe(true);
      expect(isSoldOut({ inventoryCap: 5, inventorySold: 6 })).toBe(true);
      expect(isSoldOut({ inventoryCap: 5, inventorySold: 4 })).toBe(false);
    });
  });

  describe("isLowStock", () => {
    it("flags low but not zero or plentiful stock", () => {
      expect(isLowStock({ inventoryCap: 100, inventorySold: 95 })).toBe(true); // 5 left
      expect(isLowStock({ inventoryCap: 100, inventorySold: 100 })).toBe(false); // 0 left
      expect(isLowStock({ inventoryCap: 100, inventorySold: 10 })).toBe(false); // 90 left
    });
    it("respects a custom threshold", () => {
      expect(isLowStock({ inventoryCap: 100, inventorySold: 80 }, 25)).toBe(
        true
      ); // 20 <= 25
    });
  });
});
