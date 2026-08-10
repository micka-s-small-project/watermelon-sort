import { afterEach, describe, expect, it, vi } from "vitest";
import { completeTutorial, hasCompletedTutorial } from "./tutorial";

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

describe("tutorial completion storage", () => {
  it("is incomplete until the first perk has been selected", () => {
    mockStorage();
    expect(hasCompletedTutorial()).toBe(false);
    completeTutorial();
    expect(hasCompletedTutorial()).toBe(true);
  });

  it("keeps gameplay available when storage cannot be accessed", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => { throw new Error("unavailable"); },
        setItem: () => { throw new Error("unavailable"); },
      },
    });
    expect(hasCompletedTutorial()).toBe(false);
    expect(() => completeTutorial()).not.toThrow();
  });
});
