import { describe, expect, it } from "vitest";
import { createFeedbackMailto, FEEDBACK_EMAIL } from "./feedback";
import type { GameResult } from "../game/types";

const result: GameResult = {
  reason: "claims",
  stageIndex: 1,
  stageProgress: 40,
  claims: 2,
  claimLimit: 3,
  score: 165,
  stageScores: [100, 65, 0],
  combo: 12,
  sortedCounts: { good: 20, rotten: 20, trash: 0, golden: 0 },
  selectedPerks: ["쓰레기 수집가"],
  trashCollectorActive: true,
  goldenWatermelonActive: false,
  bonusBoxActive: false,
};

describe("feedback mailto", () => {
  it("targets the feedback inbox with a general feedback template", () => {
    const mailto = createFeedbackMailto("home");
    expect(mailto).toContain(`mailto:${FEEDBACK_EMAIL}`);
    expect(decodeURIComponent(mailto)).toContain("좋았던 점:");
  });

  it("includes finished-run context for result feedback", () => {
    const mailto = decodeURIComponent(createFeedbackMailto("result", result));
    expect(mailto).toContain("점수: 165");
    expect(mailto).toContain("도달 스테이지: 2");
    expect(mailto).toContain("소모 클레임: 2");
  });
});
