import { afterEach, describe, expect, it, vi } from "vitest";
import { getBestScore, saveBestScore } from "./highScore";

const storage = new Map<string, string>();

afterEach(() => {
  storage.clear();
  vi.unstubAllGlobals();
});

function mockStorage() {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
}

describe("high score storage", () => {
  it("uses zero when no prior score exists", () => {
    mockStorage();
    expect(getBestScore()).toBe(0);
  });

  it("keeps the larger score", () => {
    mockStorage();
    expect(saveBestScore(42)).toBe(42);
    expect(saveBestScore(8)).toBe(42);
  });

  it("ignores corrupt stored scores", () => {
    mockStorage();
    storage.set("watermelon-sorter-best-score", "not-a-score");
    expect(getBestScore()).toBe(0);
  });
});
