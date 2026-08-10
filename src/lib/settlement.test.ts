import { describe, expect, it } from "vitest";
import { calculateClaimDeduction, calculateSettlement, calculateStageSettlement, calculateTakeHomePay, CLAIM_DEDUCTION_WON, formatWon, getWonPerScore, WON_PER_SCORE_BY_STAGE } from "./settlement";

describe("settlement", () => {
  it("converts each stage score at its configured wage", () => {
    expect(WON_PER_SCORE_BY_STAGE).toEqual([100, 200, 300]);
    expect(getWonPerScore(0)).toBe(100);
    expect(getWonPerScore(1)).toBe(200);
    expect(getWonPerScore(2)).toBe(300);
    expect(calculateStageSettlement(165, 1)).toBe(33_000);
    expect(calculateSettlement([100, 100, 100])).toBe(60_000);
  });

  it("formats the settlement in Korean won", () => {
    expect(formatWon(16_500)).toBe("₩16,500");
    expect(formatWon(-3_500)).toBe("-₩3,500");
    expect(calculateStageSettlement(-10, 0)).toBe(0);
  });

  it("deducts ₩10,000 for every consumed claim and allows a negative payout", () => {
    expect(CLAIM_DEDUCTION_WON).toBe(10_000);
    expect(calculateClaimDeduction(2)).toBe(20_000);
    expect(calculateTakeHomePay([100, 20], 2)).toBe(-6_000);
    expect(calculateTakeHomePay([1], 3)).toBe(-29_900);
  });
});
