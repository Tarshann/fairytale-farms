import { describe, it, expect } from "vitest";
import Anthropic from "@anthropic-ai/sdk";

const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
const describeAuth = hasAnthropicKey ? describe : describe.skip;

describeAuth("Anthropic API Key Validation", () => {
  it("should have ANTHROPIC_API_KEY configured", () => {
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
    expect(process.env.ANTHROPIC_API_KEY?.length).toBeGreaterThan(0);
  });

  it("should successfully connect to Anthropic API", async () => {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say hello" }],
    });

    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.content[0].type).toBe("text");
  }, 30000);
});
