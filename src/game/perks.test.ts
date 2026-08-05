import { describe, expect, it } from "vitest";
import { getPerkDetails, getRandomPerks, PREMIUM_DELIVERY_CONTRACT, SAFETY_TRAINING } from "./perks";

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
});
