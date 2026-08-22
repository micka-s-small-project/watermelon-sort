import { describe, expect, it } from "vitest";
import { getStageBackgroundAssetKey, getStageMusicAssetKey } from "./stageAssets";

describe("stage background assets", () => {
  it("selects the matching background for each playable stage", () => {
    expect(getStageBackgroundAssetKey(0)).toBe("conveyor-background-stage-0");
    expect(getStageBackgroundAssetKey(1)).toBe("conveyor-background-stage-1");
    expect(getStageBackgroundAssetKey(2)).toBe("conveyor-background-stage-2");
  });

  it("falls back to the first-stage background for an invalid stage", () => {
    expect(getStageBackgroundAssetKey(-1)).toBe("conveyor-background-stage-0");
    expect(getStageBackgroundAssetKey(3)).toBe("conveyor-background-stage-0");
  });

  it("uses the matching theme for each stage", () => {
    expect(getStageMusicAssetKey(0)).toBe("watermelon-theme");
    expect(getStageMusicAssetKey(1)).toBe("market-theme");
    expect(getStageMusicAssetKey(2)).toBe("supermarket-theme");
  });
});
