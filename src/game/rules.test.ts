import { describe, expect, it } from "vitest";
import { expectedDirection, pointsForCorrectSort, pointsForGoldenTap, randomWatermelonType } from "./rules";

describe("watermelon game rules", () => {
  it("routes good watermelons left and rotten ones right", () => {
    expect(expectedDirection("good")).toBe("left");
    expect(expectedDirection("rotten")).toBe("right");
    expect(expectedDirection("trash")).toBe("center");
    expect(expectedDirection("golden")).toBe("center");
  });

  it("spawns only fresh or rotten watermelons with an even split", () => {
    expect(randomWatermelonType(0)).toBe("good");
    expect(randomWatermelonType(0.499)).toBe("good");
    expect(randomWatermelonType(0.5)).toBe("rotten");
    expect(randomWatermelonType(0.999)).toBe("rotten");
  });

  it("supports perk-adjusted fresh watermelon spawn chances", () => {
    expect(randomWatermelonType(0.749, 0.75)).toBe("good");
    expect(randomWatermelonType(0.75, 0.75)).toBe("rotten");
  });

  it("increases points at the 100 and 200 score thresholds", () => {
    expect(pointsForCorrectSort(0)).toBe(1);
    expect(pointsForCorrectSort(99)).toBe(1);
    expect(pointsForCorrectSort(100)).toBe(2);
    expect(pointsForCorrectSort(199)).toBe(2);
    expect(pointsForCorrectSort(200)).toBe(3);
  });

  it("doubles fresh score and gives rotten watermelons no score for the premium contract", () => {
    expect(pointsForCorrectSort(0, "good", true)).toBe(2);
    expect(pointsForCorrectSort(100, "good", true)).toBe(4);
    expect(pointsForCorrectSort(0, "rotten", true)).toBe(0);
  });

  it("gives trash a center route and bonus value for the trash collector", () => {
    expect(pointsForCorrectSort(0, "trash", false, true)).toBe(4);
    expect(pointsForCorrectSort(100, "trash", false, true)).toBe(8);
    expect(pointsForCorrectSort(0, "rotten", false, true)).toBe(0);
  });

  it("rewards each golden watermelon tap with five times the base score", () => {
    expect(pointsForGoldenTap(0)).toBe(5);
    expect(pointsForGoldenTap(100)).toBe(10);
    expect(pointsForGoldenTap(200)).toBe(15);
  });

  it("freezes watermelon values at three points for God's Hand", () => {
    expect(pointsForCorrectSort(0, "good", false, false, true)).toBe(3);
    expect(pointsForCorrectSort(200, "rotten", true, false, true)).toBe(3);
    expect(pointsForGoldenTap(0, true)).toBe(3);
    expect(pointsForCorrectSort(0, "trash", false, true, true)).toBe(4);
  });

  it("doubles fresh watermelon scores after the continuous delivery threshold", () => {
    expect(pointsForCorrectSort(100, "good", false, false, false, false, true)).toBe(4);
    expect(pointsForCorrectSort(100, "rotten", false, false, false, false, true)).toBe(2);
  });

  it("doubles only regular watermelon scores during closing settlement", () => {
    expect(pointsForCorrectSort(100, "good", false, false, false, false, false, true)).toBe(4);
    expect(pointsForCorrectSort(100, "rotten", false, false, false, false, false, true)).toBe(4);
    expect(pointsForCorrectSort(100, "trash", false, true, false, false, false, true)).toBe(8);
  });

  it("makes rotten watermelons valuable and fixes fresh watermelons at one point for defective recycling", () => {
    expect(pointsForCorrectSort(200, "rotten", true, false, false, true)).toBe(9);
    expect(pointsForCorrectSort(200, "rotten", false, false, false, true, false, true)).toBe(18);
    expect(pointsForCorrectSort(200, "good", true, false, false, true, true, true)).toBe(1);
  });

  it("triples regular watermelon scores during an earthquake without changing special watermelon values", () => {
    expect(pointsForCorrectSort(100, "good", false, false, false, false, false, false, true)).toBe(6);
    expect(pointsForCorrectSort(100, "rotten", false, false, false, false, false, false, true)).toBe(6);
    expect(pointsForCorrectSort(100, "trash", true, false, false, false, false, false, true)).toBe(8);
    expect(pointsForCorrectSort(100, "good", false, false, true, false, false, false, true)).toBe(3);
  });

});
