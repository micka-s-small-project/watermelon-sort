export const PREMIUM_DELIVERY_CONTRACT = "프리미엄 납품 계약";
export const SAFETY_TRAINING = "안전 교육 수료증";
export const CONTINUOUS_WORK_ALLOWANCE = "연속 근무 수당";
export const WORK_MANUAL = "작업 매뉴얼";
export const CLOSING_RUSH = "마감 러시";
export const INSTANT_ALLOWANCE = "즉시 지급 수당";
export const PERFECT_DELIVERY_BONUS = "무결점 납품 보너스";
export const RECOVERY_SUPPORT = "재정비 지원금";
export const TRASH_COLLECTOR = "쓰레기 수집가";
export const GOLDEN_WATERMELON_CONTRACT = "황금 수박 계약";
export const GODS_HAND = "신의 손";
export const CONTINUOUS_DELIVERY_CONTRACT = "연속 납품 계약";
export const CLOSING_SETTLEMENT_CONTRACT = "마감 정산 특약";
export const DEFECTIVE_RECYCLING_CONTRACT = "불량품 재활용 계약";
export const BOSS_SON = "사장님네 아들";
export const EARTHQUAKE_DISASTER = "자연재해(지진)";

type PerkDefinition = {
  name: string;
  details: readonly string[];
};

const PERKS: readonly PerkDefinition[] = [
  { name: PREMIUM_DELIVERY_CONTRACT, details: ["출현: 신선 수박 50% → 75%", "보상: 신선 수박 점수 2배", "주의: 썩은 수박은 0점 · 실수 시 클레임"] },
  { name: SAFETY_TRAINING, details: ["방어: 스테이지 첫 클레임 무효", "매 스테이지마다 1회 다시 적용", "콤보도 유지됩니다"] },
  { name: CONTINUOUS_WORK_ALLOWANCE, details: ["보상: 10콤보마다 +5점", "콤보를 유지할수록 이득", "클레임 시 콤보는 초기화됩니다"] },
  { name: WORK_MANUAL, details: ["시간: 매 분류 제한 시간 +0.15초", "안정적으로 실수를 줄일 수 있습니다", "점수 규칙은 변하지 않습니다"] },
  { name: CLOSING_RUSH, details: ["시간: 매 분류 제한 시간 -0.15초", "보상: 올바른 분류마다 +1점", "주의: 빠른 판단이 필요합니다"] },
  { name: INSTANT_ALLOWANCE, details: ["즉시: 선택 즉시 +10점", "안정적인 초기 수당", "추가 조건이 없습니다"] },
  { name: PERFECT_DELIVERY_BONUS, details: ["보상: 무실수 스테이지 획득 점수 +50%", "스테이지 시작 성과급에서만 등장", "클레임이 한 번이라도 발생하면 지급되지 않습니다"] },
  { name: RECOVERY_SUPPORT, details: ["회복: 클레임 다음 점수 획득 분류 +3점", "실수 뒤의 회복 기회", "다음 보상에서만 적용됩니다"] },
  { name: TRASH_COLLECTOR, details: ["출현: 쓰레기 봉투가 레일에 등장", "보상: 가운데 분류 시 기본 점수 4배", "주의: 썩은 수박은 0점이 됩니다"] },
  { name: GOLDEN_WATERMELON_CONTRACT, details: ["출현: 황금 수박이 매우 낮은 확률로 등장", "보상: 제한 시간 동안 탭 1회당 기본 점수 5배", "주의: 한 번도 누르지 못하면 클레임이 발생합니다"] },
  { name: GODS_HAND, details: ["보상: 모든 수박 점수가 3점으로 고정", "위험: 남은 클레임 기회가 단 1회", "주의: 한 번의 실수 또는 시간 초과 시 즉시 해고"] },
  { name: CONTINUOUS_DELIVERY_CONTRACT, details: ["조건: 20콤보 달성 후 클레임 전까지 유지", "보상: 신선 수박 점수 2배", "주의: 클레임 시 콤보와 계약 효과가 초기화됩니다"] },
  { name: CLOSING_SETTLEMENT_CONTRACT, details: ["보상: 스테이지 마지막 15개 신선·썩은 수박 점수 2배", "위험: 마감 구간 클레임 발생 시 특약 종료", "황금 수박·쓰레기 봉투에는 적용되지 않습니다"] },
  { name: DEFECTIVE_RECYCLING_CONTRACT, details: ["보상: 썩은 수박 점수 3배", "주의: 신선 수박 점수는 1점으로 고정", "프리미엄 납품 계약과 함께 선택할 수 있습니다"] },
  { name: BOSS_SON, details: ["보호: 이번 스테이지의 모든 실수를 봐줍니다", "클레임·콤보·마감 특약에 영향이 없습니다", "스테이지 시작 성과급에서만 등장하는 1회용 특성"] },
  { name: EARTHQUAKE_DISASTER, details: ["위험: 5초마다 1.25초간 화면이 강하게 흔들립니다", "보상: 지진 구간 신선·썩은 수박 점수 3배", "스테이지 시작 성과급에서만 등장하는 1회용 특성"] },
];

export function hasPerk(selectedPerks: readonly string[], perk: string): boolean {
  return selectedPerks.includes(perk);
}

export function hasPremiumDeliveryContract(selectedPerks: readonly string[]): boolean {
  return hasPerk(selectedPerks, PREMIUM_DELIVERY_CONTRACT);
}

export function getRandomPerks(
  selectedPerks: readonly string[],
  random = Math.random,
  count = 3,
  excludedPerks: readonly string[] = [],
): readonly string[] {
  const remaining = PERKS
    .map((perk) => perk.name)
    .filter((perk) => !hasPerk(selectedPerks, perk) && !excludedPerks.includes(perk));
  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
  }
  return remaining.slice(0, count);
}

export function getPerkDetails(perk: string): readonly string[] {
  return PERKS.find((candidate) => candidate.name === perk)?.details ?? [];
}
