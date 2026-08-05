import { describe, expect, it } from "vitest";
import { getStage, hasNextStage, isStageComplete, isStageMidpoint } from "./stages";

describe("stage progression", () => {
  it("defines the planned 60, 80, and 100 delivery targets", () => {
    expect(getStage(0).target).toBe(60);
    expect(getStage(1).target).toBe(80);
    expect(getStage(2).target).toBe(100);
  });

  it("increases the pace in each later stage", () => {
    expect(getStage(0).roundLimitMs).toBe(1_500);
    expect(getStage(1).roundLimitMs).toBe(1_250);
    expect(getStage(2).roundLimitMs).toBe(1_000);
  });

  it("opens a midpoint reward at half of each stage target", () => {
    expect(isStageMidpoint(0, 30)).toBe(true);
    expect(isStageMidpoint(1, 40)).toBe(true);
    expect(isStageMidpoint(2, 50)).toBe(true);
    expect(isStageMidpoint(0, 29)).toBe(false);
  });

  it("completes a stage when its delivery target is reached", () => {
    expect(isStageComplete(1, 79)).toBe(false);
    expect(isStageComplete(1, 80)).toBe(true);
  });

  it("only offers a transition while another stage remains", () => {
    expect(hasNextStage(0)).toBe(true);
    expect(hasNextStage(1)).toBe(true);
    expect(hasNextStage(2)).toBe(false);
  });
});
