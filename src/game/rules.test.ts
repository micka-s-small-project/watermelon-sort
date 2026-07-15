import { describe, expect, it } from "vitest";
import { expectedDirection, pointsForCorrectSort, ROUND_LIMIT_MS } from "./rules";

describe("watermelon game rules", () => {
  it("routes good watermelons left and rotten ones right", () => {
    expect(expectedDirection("good")).toBe("left");
    expect(expectedDirection("rotten")).toBe("right");
  });

  it("keeps every round under 1.5 seconds", () => {
    expect(ROUND_LIMIT_MS).toBe(1_500);
  });

  it("increases points at the 100 and 200 score thresholds", () => {
    expect(pointsForCorrectSort(0)).toBe(1);
    expect(pointsForCorrectSort(99)).toBe(1);
    expect(pointsForCorrectSort(100)).toBe(2);
    expect(pointsForCorrectSort(199)).toBe(2);
    expect(pointsForCorrectSort(200)).toBe(3);
  });
});
