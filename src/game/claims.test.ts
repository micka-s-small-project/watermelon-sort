import { describe, expect, it } from "vitest";
import { recordClaimHistory } from "./claims";

describe("claim history", () => {
  it("keeps previously consumed claims after a new contract changes the active claim limit", () => {
    const beforeGodsHand = recordClaimHistory(0, true);
    expect(beforeGodsHand).toBe(1);
  });

  it("does not add protected mistakes to the settlement claim history", () => {
    expect(recordClaimHistory(1, false)).toBe(1);
  });
});
