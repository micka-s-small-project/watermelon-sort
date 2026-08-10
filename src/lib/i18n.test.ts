import { describe, expect, it } from "vitest";
import { getCopy, getSupportedLocale } from "./i18n";

describe("locale selection", () => {
  it("uses Korean only when the primary device language starts with ko", () => {
    expect(getSupportedLocale(["en-US", "ko-KR"])).toBe("en");
    expect(getSupportedLocale(["KO"])).toBe("ko");
  });

  it("defaults to English for non-Korean or missing device languages", () => {
    expect(getSupportedLocale(["en-US"])).toBe("en");
    expect(getSupportedLocale(["ja-JP"])).toBe("en");
    expect(getSupportedLocale(undefined)).toBe("en");
  });
});

describe("localized copy", () => {
  it("formats localized score and sharing text", () => {
    expect(getCopy("en").score(12)).toBe("12 pts");
    expect(getCopy("ko").score(12)).toBe("12점");
    expect(getCopy("en").shareText(12)).toContain("12");
    expect(getCopy("ko").shareText(12)).toContain("12");
    expect(getCopy("ko").tutorialProgress(0, 10)).toContain("1");
    expect(getCopy("en").tutorialResultAccuracy(8, 10)).toContain("8");
    expect(getCopy("ko").tutorialIntroTitle).toBe("튜토리얼!");
    expect(getCopy("ko").tutorialTraitGuide).toContain("카운트다운");
    expect(getCopy("ko").tutorialBonusGuide).toContain("아무 버튼");
    expect(getCopy("ko").tutorialPerkSelectionGuide).toContain("잘 읽고");
  });
});
