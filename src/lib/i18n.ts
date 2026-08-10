export type SupportedLocale = "en" | "ko";

export type GameCopy = {
  documentTitle: string;
  marketTitleLines: readonly string[];
  startGame: string;
  muteMusic: string;
  unmuteMusic: string;
  gameAreaLabel: string;
  countdownLabel: string;
  resultLabel: string;
  resultTitleLines: readonly string[];
  score: (score: number) => string;
  timeoutReason: string;
  wrongBeltReason: string;
  retry: string;
  share: string;
  home: string;
  shared: string;
  copied: string;
  sharingUnavailable: string;
  healthyWatermelonLeft: string;
  rottenWatermelonRight: string;
  tutorialProgress: (completed: number, total: number) => string;
  tutorialIntroTitle: string;
  tutorialGoodGuide: string;
  tutorialRottenGuide: string;
  tutorialMixedGuide: string;
  tutorialTryAgain: string;
  tutorialBonusTitle: string;
  tutorialBonusGuide: string;
  tutorialPerkSelectionGuide: string;
  tutorialResultTitle: string;
  tutorialResultComplete: (total: number) => string;
  tutorialResultAccuracy: (correct: number, total: number) => string;
  tutorialResultMessage: string;
  tutorialTraitGuide: string;
  tutorialContinue: string;
  shareText: (score: number) => string;
};

const COPY: Record<SupportedLocale, GameCopy> = {
  en: {
    documentTitle: "Watermelonlonlonmelon",
    marketTitleLines: ["Watermelon", "lonlonmelon"],
    startGame: "Start Sorting",
    muteMusic: "Mute background music",
    unmuteMusic: "Unmute background music",
    gameAreaLabel: "Watermelon sorting game",
    countdownLabel: "Game start countdown",
    resultLabel: "Shift results",
    resultTitleLines: ["Shift", "Results"],
    score: (score) => `${score} pts`,
    timeoutReason: "Reason: Time ran out",
    wrongBeltReason: "Reason: Wrong belt",
    retry: "Retry",
    share: "Share",
    home: "Home",
    shared: "Score shared!",
    copied: "Score copied to clipboard!",
    sharingUnavailable: "Sharing is unavailable on this device.",
    healthyWatermelonLeft: "Send healthy watermelon left",
    rottenWatermelonRight: "Send rotten watermelon right",
    tutorialProgress: (completed, total) => `Tutorial ${completed + 1} / ${total}`,
    tutorialIntroTitle: "Tutorial!",
    tutorialGoodGuide: "Fresh watermelon goes left!",
    tutorialRottenGuide: "Rotten watermelon goes right!",
    tutorialMixedGuide: "Sort each watermelon into the matching lane.",
    tutorialTryAgain: "No penalty. Try the lane that matches the watermelon.",
    tutorialBonusTitle: "Performance bonus box!",
    tutorialBonusGuide: "Bonus boxes arrive on the rail during a shift. Press any button to collect one.",
    tutorialResultTitle: "Tutorial Results!",
    tutorialResultComplete: (total) => `${total} watermelons sorted`,
    tutorialResultAccuracy: (correct, total) => `First-try accuracy ${correct} / ${total}`,
    tutorialResultMessage: "Great! Choose a performance bonus and begin your shift.",
    tutorialTraitGuide: "Your tutorial shift is complete. The real shift starts after the countdown.",
    tutorialContinue: "Start countdown",
    tutorialPerkSelectionGuide: "Read each performance bonus carefully, then choose one. ↑↓ move · Space select",
    shareText: (score) => `I sorted ${score} watermelons in Watermelonlonlonmelon! Can you beat my score?`,
  },
  ko: {
    documentTitle: "수박수박수박박수박",
    marketTitleLines: ["수박수박", "수박박수박"],
    startGame: "수박 분류하기",
    muteMusic: "배경 음악 끄기",
    unmuteMusic: "배경 음악 켜기",
    gameAreaLabel: "수박 분류 게임",
    countdownLabel: "게임 시작 카운트다운",
    resultLabel: "노동 결과",
    resultTitleLines: ["노 동", "결 과!"],
    score: (score) => `${score}점`,
    timeoutReason: "해고 사유: 시간 초과",
    wrongBeltReason: "해고 사유: 잘못된 레일",
    retry: "다시하기",
    share: "공유하기",
    home: "메인메뉴",
    shared: "점수를 공유했어요!",
    copied: "점수를 클립보드에 복사했어요!",
    sharingUnavailable: "이 기기에서는 공유할 수 없어요.",
    healthyWatermelonLeft: "싱싱한 수박을 왼쪽으로 보내기",
    rottenWatermelonRight: "썩은 수박을 오른쪽으로 보내기",
    tutorialProgress: (completed, total) => `튜토리얼 ${completed + 1} / ${total}`,
    tutorialIntroTitle: "튜토리얼!",
    tutorialGoodGuide: "싱싱한 수박은 왼쪽 레일로 보내세요!",
    tutorialRottenGuide: "썩은 수박은 오른쪽 레일로 보내세요!",
    tutorialMixedGuide: "수박 상태에 맞는 레일을 선택하세요!",
    tutorialTryAgain: "괜찮아요! 수박 상태에 맞는 레일을 다시 선택하세요.",
    tutorialBonusTitle: "성과급 보너스 상자!",
    tutorialBonusGuide: "성과급 상자는 게임 중 레일 위로 도착합니다. 아무 버튼이나 눌러 수령하세요.",
    tutorialResultTitle: "튜토리얼 결과!",
    tutorialResultComplete: (total) => `${total}개 분류 완료`,
    tutorialResultAccuracy: (correct, total) => `첫 시도 정확도 ${correct} / ${total}`,
    tutorialResultMessage: "좋습니다! 이제 성과급 특성을 골라 나만의 납품 전략을 만드세요.",
    tutorialTraitGuide: "튜토리얼 근무를 마쳤습니다. 카운트다운 뒤 정식 근무를 시작합니다.",
    tutorialContinue: "카운트다운 시작",
    tutorialPerkSelectionGuide: "특성을 잘 읽고 선택하세요! · ↑↓ 이동 · Space 선택",
    shareText: (score) => `수박수박수박박수박에서 ${score}점을 기록했어요! 내 점수를 넘을 수 있나요?`,
  },
};

export function getSupportedLocale(locales: readonly string[] | undefined): SupportedLocale {
  return locales?.[0]?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function getBrowserLocale(): SupportedLocale {
  return getSupportedLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function getCopy(locale: SupportedLocale): GameCopy {
  return COPY[locale];
}
