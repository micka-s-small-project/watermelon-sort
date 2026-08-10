import { describe, expect, it } from "vitest";
import { TUTORIAL_SEQUENCE, TUTORIAL_TOTAL, TUTORIAL_WATERMELONS } from "./tutorial";

describe("tutorial sequence", () => {
  it("teaches the left and right routes first, then gives ten regular watermelons", () => {
    expect(TUTORIAL_WATERMELONS.slice(0, 2)).toEqual(["good", "rotten"]);
    expect(TUTORIAL_TOTAL).toBe(10);
    expect(TUTORIAL_WATERMELONS).toHaveLength(10);
  });

  it("contains both regular watermelon types", () => {
    expect(TUTORIAL_WATERMELONS).toContain("good");
    expect(TUTORIAL_WATERMELONS).toContain("rotten");
  });

  it("places the bonus box between the first and second half of the tutorial", () => {
    expect(TUTORIAL_SEQUENCE).toHaveLength(11);
    expect(TUTORIAL_SEQUENCE[5]).toBe("bonus");
    expect(TUTORIAL_SEQUENCE.filter((item) => item !== "bonus")).toEqual(TUTORIAL_WATERMELONS);
  });
});
