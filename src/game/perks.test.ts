import { describe, expect, it } from "vitest";
import { GODS_HAND, getPerkDetails, getRandomPerks, PREMIUM_DELIVERY_CONTRACT, SAFETY_TRAINING } from "./perks";

describe("perk copy", () => {
  it("explains the premium contract benefit and its risk", () => {
    expect(getPerkDetails(PREMIUM_DELIVERY_CONTRACT)).toEqual([
      "출현: 신선 수박 50% → 75%",
      "보상: 신선 수박 점수 2배",
      "주의: 썩은 수박은 0점 · 실수 시 클레임",
    ]);
  });

  it("offers up to three unselected perks without repeating a previous choice", () => {
    const firstOffer = getRandomPerks([], () => 0);
    const nextOffer = getRandomPerks([firstOffer[0]], () => 0);

    expect(firstOffer).toHaveLength(3);
    expect(new Set(firstOffer).size).toBe(3);
    expect(nextOffer).not.toContain(firstOffer[0]);
    expect(getRandomPerks([PREMIUM_DELIVERY_CONTRACT, SAFETY_TRAINING], () => 0)).toHaveLength(3);
  });

  it("explains God's Hand's fixed score and one-claim risk", () => {
    expect(getPerkDetails(GODS_HAND)).toEqual([
      "보상: 모든 수박 점수가 3점으로 고정",
      "위험: 남은 클레임 기회가 단 1회",
      "주의: 한 번의 실수 또는 시간 초과 시 즉시 해고",
    ]);
  });
});
