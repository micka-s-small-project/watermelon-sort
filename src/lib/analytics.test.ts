import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "./analytics";

describe("analytics", () => {
  it("does nothing when no transport is configured", () => {
    expect(() => createAnalytics().track("game_started", { game_version: "test", touch_capable: false })).not.toThrow();
  });

  it("passes typed game events and properties to the configured transport", () => {
    const capture = vi.fn();
    const analytics = createAnalytics({ capture });

    analytics.track("game_retried", {
      previous_reason: "claims",
      previous_stage: 2,
      previous_score: 240,
    });

    expect(capture).toHaveBeenCalledWith("game_retried", {
      previous_reason: "claims",
      previous_stage: 2,
      previous_score: 240,
    });
  });

  it("keeps shielded failures separate from consumed claims", () => {
    const capture = vi.fn();
    const analytics = createAnalytics({ capture });

    analytics.track("claim_received", {
      stage: 1,
      reason: "wrong_direction",
      item_type: "good",
      combo: 12,
      claim_consumed: false,
    });

    expect(capture).toHaveBeenCalledWith("claim_received", expect.objectContaining({ claim_consumed: false }));
  });

  it("records tutorial completion separately from a full game result", () => {
    const capture = vi.fn();
    const analytics = createAnalytics({ capture });

    analytics.track("tutorial_completed", { total: 10, first_attempt_correct: 8 });

    expect(capture).toHaveBeenCalledWith("tutorial_completed", { total: 10, first_attempt_correct: 8 });
  });
});
