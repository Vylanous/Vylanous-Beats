import { describe, expect, test } from "bun:test";
import { LICENSE_TIERS, TIER_BY_ID, formatCad } from "./licenses";

describe("license tiers", () => {
  test("uses the current public prices", () => {
    expect(TIER_BY_ID.mp3.priceCents).toBe(1900);
    expect(TIER_BY_ID.wav.priceCents).toBe(3900);
    expect(TIER_BY_ID.unlimited.priceCents).toBe(6900);
    expect(TIER_BY_ID.exclusive.priceCents).toBe(14900);
    expect(formatCad(TIER_BY_ID.unlimited.priceCents)).toBe("$69");
  });

  test("highlights Unlimited as the single most-popular tier", () => {
    expect(LICENSE_TIERS.filter((tier) => tier.highlight).map((tier) => tier.id)).toEqual([
      "unlimited",
    ]);
    expect(TIER_BY_ID.unlimited.badge).toBe("Most Popular");
  });
});
