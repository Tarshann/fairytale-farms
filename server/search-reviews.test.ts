import { describe, expect, it } from "vitest";
import { appRouter } from "./routers/index";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("search.products", () => {
  it("returns an array (empty without a database) instead of throwing", async () => {
    const caller = appRouter.createCaller(publicContext());
    const results = await caller.search.products({ query: "cookie" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("rejects an empty query (zod min length)", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.search.products({ query: "" })).rejects.toThrow();
  });

  it("rejects an over-long query (zod max length)", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(
      caller.search.products({ query: "x".repeat(201) })
    ).rejects.toThrow();
  });
});

describe("reviews.recentPublished (homepage testimonials source)", () => {
  it("returns an array (empty without a database) instead of throwing", async () => {
    const caller = appRouter.createCaller(publicContext());
    const results = await caller.reviews.recentPublished({ limit: 6 });
    expect(Array.isArray(results)).toBe(true);
  });

  it("accepts no input (defaults applied)", async () => {
    const caller = appRouter.createCaller(publicContext());
    const results = await caller.reviews.recentPublished();
    expect(Array.isArray(results)).toBe(true);
  });

  it("rejects a limit above the cap", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(
      caller.reviews.recentPublished({ limit: 999 })
    ).rejects.toThrow();
  });
});
