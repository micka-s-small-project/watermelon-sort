import { describe, expect, it } from "vitest";
import { getStage, hasNextStage, isStageComplete, isStageMidpoint } from "./stages";

describe("stage progression", () => {
  it("defines the planned 100, 150, and 200 delivery targets", () => {
    expect(getStage(0).target).toBe(100);
    expect(getStage(1).target).toBe(150);
    expect(getStage(2).target).toBe(200);
  });

  it("increases the pace in each later stage", () => {
    expect(getStage(0).roundLimitMs).toBe(1_500);
    expect(getStage(1).roundLimitMs).toBe(1_250);
    expect(getStage(2).roundLimitMs).toBe(1_000);
  });

  it("opens a midpoint reward at half of each stage target", () => {
    expect(isStageMidpoint(0, 50)).toBe(true);
    expect(isStageMidpoint(1, 75)).toBe(true);
    expect(isStageMidpoint(2, 100)).toBe(true);
    expect(isStageMidpoint(0, 49)).toBe(false);
  });

  it("completes a stage when its delivery target is reached", () => {
    expect(isStageComplete(1, 149)).toBe(false);
    expect(isStageComplete(1, 150)).toBe(true);
  });

  it("only offers a transition while another stage remains", () => {
    expect(hasNextStage(0)).toBe(true);
    expect(hasNextStage(1)).toBe(true);
    expect(hasNextStage(2)).toBe(false);
  });
});
