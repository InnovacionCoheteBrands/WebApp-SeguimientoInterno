import { describe, expect, it, vi } from "vitest";
import {
  createApiKeySummary,
  createApiKeySummaryFromRaw,
  generateApiKey,
  isStoredHashedApiKey,
  toStoredApiKey,
} from "../utils/api-key";

describe("API key utilities", () => {
  it("generates a key with expected prefix and high entropy length", () => {
    const key = generateApiKey();
    expect(key.startsWith("mc_live_")).toBe(true);
    expect(key.length).toBeGreaterThanOrEqual(40);
  });

  it("does not rely on Math.random", () => {
    const randomSpy = vi.spyOn(Math, "random");
    generateApiKey();
    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it("stores only hash payload, not plaintext", () => {
    const raw = generateApiKey();
    const stored = toStoredApiKey(raw);
    expect(stored).toMatch(/^sha256:[a-f0-9]{64}:[A-Za-z0-9_-]{4}$/i);
    expect(stored.includes(raw)).toBe(false);
    expect(isStoredHashedApiKey(stored)).toBe(true);
  });

  it("builds null summary when no key exists", () => {
    expect(createApiKeySummary(null)).toEqual({
      present: false,
      masked: null,
      last4: null,
    });
  });

  it("builds masked summary from stored hash format", () => {
    const raw = "mc_live_abcdefghijklmnopqrstuvwxyz0123456789";
    const stored = toStoredApiKey(raw);
    const summary = createApiKeySummary(stored);
    expect(summary.present).toBe(true);
    expect(summary.last4).toBe(raw.slice(-4));
    expect(summary.masked).toBe(`mc_live_...${raw.slice(-4)}`);
  });

  it("builds one-time summary from raw key", () => {
    const raw = "mc_live_abcdefghijklmnopqrstuvwxyz0123456789";
    const summary = createApiKeySummaryFromRaw(raw);
    expect(summary).toEqual({
      present: true,
      masked: `mc_live_...${raw.slice(-4)}`,
      last4: raw.slice(-4),
    });
  });
});
