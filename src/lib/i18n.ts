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
  centerControlComingSoon: string;
  comingSoon: string;
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
    centerControlComingSoon: "Center control coming soon",
    comingSoon: "SOON",
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
    centerControlComingSoon: "가운데 조작은 준비 중",
    comingSoon: "준비 중",
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
