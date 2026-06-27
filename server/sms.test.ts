import { describe, expect, it } from "vitest";
import { normalizePhone, isSmsConfigured } from "./_core/sms";

describe("SMS phone normalization", () => {
  it("returns null for empty / unusable input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
  });

  it("passes through valid E.164 numbers", () => {
    expect(normalizePhone("+16155551234")).toBe("+16155551234");
    expect(normalizePhone("  +447911123456 ")).toBe("+447911123456");
  });

  it("prefixes US 10-digit numbers with +1", () => {
    expect(normalizePhone("6155551234")).toBe("+16155551234");
    expect(normalizePhone("(615) 555-1234")).toBe("+16155551234");
    expect(normalizePhone("615-555-1234")).toBe("+16155551234");
  });

  it("handles 1+10-digit US numbers", () => {
    expect(normalizePhone("16155551234")).toBe("+16155551234");
    expect(normalizePhone("1 (615) 555-1234")).toBe("+16155551234");
  });
});

describe("SMS configuration", () => {
  it("is disabled by default (no Twilio env in test)", () => {
    expect(isSmsConfigured()).toBe(false);
  });
});
