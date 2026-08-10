import { describe, expect, it } from "vitest";
import { calculateClaimDeduction, calculateSettlement, calculateTakeHomePay, CLAIM_DEDUCTION_WON, formatWon, WON_PER_SCORE } from "./settlement";

describe("settlement", () => {
  it("converts each score point into the configured wage", () => {
    expect(WON_PER_SCORE).toBe(100);
    expect(calculateSettlement(165)).toBe(16_500);
  });

  it("formats the settlement in Korean won", () => {
    expect(formatWon(16_500)).toBe("₩16,500");
    expect(formatWon(-3_500)).toBe("-₩3,500");
    expect(calculateSettlement(-10)).toBe(0);
  });

  it("deducts ₩10,000 for every consumed claim and allows a negative payout", () => {
    expect(CLAIM_DEDUCTION_WON).toBe(10_000);
    expect(calculateClaimDeduction(2)).toBe(20_000);
    expect(calculateTakeHomePay(165, 2)).toBe(-3_500);
    expect(calculateTakeHomePay(1, 3)).toBe(-29_900);
  });
});
