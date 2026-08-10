import { describe, expect, it } from "vitest";
import { CONTINUOUS_DELIVERY_CONTRACT, PREMIUM_DELIVERY_CONTRACT } from "../game/perks";
import { getSettlementComment } from "./settlementComment";

describe("settlement comment", () => {
  it.each([
    [-1, "적자 인생"],
    [0, "오늘의 교통비"],
    [30_000, "견습 분류원"],
    [80_000, "믿음직한 직원"],
    [150_000, "이달의 수박 전문가"],
    [300_000, "정산의 신"],
  ])("uses the correct comment tier for ₩%i", (takeHomePay, title) => {
    expect(getSettlementComment(takeHomePay, []).title).toBe(title);
  });

  it("adds a strategy comment for the premium continuous-delivery synergy", () => {
    expect(getSettlementComment(300_000, [PREMIUM_DELIVERY_CONTRACT, CONTINUOUS_DELIVERY_CONTRACT]).perkHighlight)
      .toContain("시너지");
  });

  it("chooses different copy variants within the same settlement tier", () => {
    const first = getSettlementComment(80_000, [], () => 0);
    const last = getSettlementComment(80_000, [], () => 0.99);
    expect(first.title).toBe(last.title);
    expect(first.summary).not.toBe(last.summary);
    expect(first.detail).not.toBe(last.detail);
    expect(first.closing).not.toBe(last.closing);
  });
});
