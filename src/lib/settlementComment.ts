import { CONTINUOUS_DELIVERY_CONTRACT, EARTHQUAKE_DISASTER, GOLDEN_WATERMELON_CONTRACT, GODS_HAND, PREMIUM_DELIVERY_CONTRACT, TRASH_COLLECTOR } from "../game/perks";
import { formatWon } from "./settlement";

export type SettlementComment = {
  label: string;
  title: string;
  summary: string;
  detail: string;
  closing: string;
  perkHighlight?: string;
};

type CommentTemplate = Omit<SettlementComment, "summary" | "detail" | "closing" | "perkHighlight"> & {
  summaries: readonly string[];
  details: (takeHomePay: number) => readonly string[];
  closings: readonly string[];
};

function getPerkHighlight(selectedPerks: readonly string[]): string | undefined {
  if (selectedPerks.includes(PREMIUM_DELIVERY_CONTRACT) && selectedPerks.includes(CONTINUOUS_DELIVERY_CONTRACT)) return "프리미엄 납품 계약과 연속 납품 계약의 시너지가 돋보였습니다. 오늘의 당신은 수박이 아니라 성과를 분류했습니다.";
  if (selectedPerks.includes(GOLDEN_WATERMELON_CONTRACT)) return "황금 수박 계약을 선택한 대담함이 오늘 정산에 반짝임을 더했습니다.";
  if (selectedPerks.includes(TRASH_COLLECTOR)) return "쓰레기 수집가의 눈썰미 덕분에 남들이 지나친 레일에서도 기회를 건져냈습니다.";
  if (selectedPerks.includes(GODS_HAND)) return "신의 손 계약은 위험했지만, 그만큼 모든 선택이 진지했습니다.";
  if (selectedPerks.includes(EARTHQUAKE_DISASTER)) return "지진 속에서도 레일을 지킨 집중력이 인상적이었습니다.";
  if (selectedPerks.length > 0) return `오늘 선택한 ${selectedPerks[0]} 전략이 다음 근무의 가능성을 보여줬습니다.`;
  return undefined;
}

const COMMENT_TEMPLATES: readonly CommentTemplate[] = [
  {
    label: "WORK REVIEW · DEFICIT", title: "적자 인생",
    summaries: [
      "열심히 일했지만, 허술한 업무 처리 능력 탓에 일하고도 적자를 면하지 못했습니다.",
      "레일은 바쁘게 움직였지만 통장은 반대 방향으로 달렸습니다.",
      "오늘의 분류 실적은 고객 불만의 속도를 따라가지 못했습니다.",
    ],
    details: (pay) => [
      `안타깝게도 당신에게 남은 것은 클레임을 처리하느라 생긴 ${formatWon(Math.abs(pay))}의 적자와, 무거운 수박을 많이 옮기느라 생긴 정형외과 진료비와 물리치료비 70,000원입니다.`,
      `정산 결과는 ${formatWon(Math.abs(pay))}의 마이너스입니다. 수박보다 클레임을 더 많이 옮긴 하루였을지도 모르겠습니다.`,
      `${formatWon(Math.abs(pay))}의 적자가 발생했습니다. 오늘은 사장님보다 정형외과 선생님이 당신의 이름을 먼저 외울 것 같습니다.`,
    ],
    closings: [
      "안타깝게도 수박 분류 업무는 당신에게 잘 맞지 않았나 봅니다. 언젠가 당신에게 꼭 맞는 직업을 찾을 수 있겠죠.",
      "그래도 레일은 내일도 돌아갑니다. 다음 근무에서는 클레임 세 장을 아껴보세요.",
      "퇴근길에는 무거운 수박 대신 가벼운 마음만 챙기길 바랍니다.",
    ],
  },
  {
    label: "WORK REVIEW · COMMUTE", title: "오늘의 교통비",
    summaries: [
      "적자는 피했지만, 오늘의 노동은 아직 삼각김밥과 교통비를 간신히 넘긴 수준입니다.",
      "통장은 플러스가 됐습니다. 다만 편의점에 들르면 다시 현실을 마주하게 됩니다.",
      "수박은 잘 나눴지만, 큰돈까지는 아직 한 레일 남았습니다.",
    ],
    details: (pay) => [
      `그래도 ${formatWon(pay)}을 손에 쥐었습니다. 레일의 리듬을 조금 더 익히면 다음 정산은 달라질 겁니다.`,
      `${formatWon(pay)}을 정산했습니다. 오늘은 경험치를 벌었다고 생각해도 좋겠습니다.`,
      `오늘의 실수령은 ${formatWon(pay)}입니다. 따뜻한 음료 한 잔과 다음 도전을 살 수 있는 금액입니다.`,
    ],
    closings: ["오늘의 경험은 내일의 콤보가 됩니다.", "다음 성과급 상자는 조금 더 욕심내도 좋겠습니다.", "첫 월급은 작아도 다음 판의 이유는 충분합니다."],
  },
  {
    label: "WORK REVIEW · ROOKIE", title: "견습 분류원",
    summaries: ["아직 능숙하진 않지만, 적어도 오늘의 노동이 빚으로 끝나지는 않았습니다.", "이제 막 마트의 리듬을 배운 견습생다운 정산입니다.", "손은 조금 바빴고, 통장도 조금은 웃었습니다."],
    details: (pay) => [`${formatWon(pay)}의 첫 정산입니다. 성과급 상자의 특성을 더 영리하게 조합해 보세요.`, `${formatWon(pay)}을 벌었습니다. 콤보를 한 번만 더 길게 이어도 결과는 크게 달라집니다.`, `오늘의 수당은 ${formatWon(pay)}입니다. 다음에는 고단가 스테이지까지 올라갈 실력이 보입니다.`],
    closings: ["마트는 당신의 다음 근무를 조용히 기대하고 있습니다.", "사장님은 아직 당신의 이름표를 버리지 않았습니다.", "견습 기간은 끝나지 않았습니다. 다만 기대치는 올랐습니다."],
  },
  {
    label: "WORK REVIEW · RELIABLE", title: "믿음직한 직원",
    summaries: ["마트가 당신의 손놀림을 기억하기 시작했습니다.", "오늘 레일은 당신에게 꽤 협조적이었습니다.", "클레임보다 납품이 먼저 떠오르는 근무였습니다."],
    details: (pay) => [`${formatWon(pay)}을 정산했습니다. 다음 근무에는 더 높은 성과급과 더 긴 콤보를 노려볼 만합니다.`, `오늘의 성과는 ${formatWon(pay)}입니다. 이제 수박의 표정만 봐도 갈 곳이 보일 겁니다.`, `${formatWon(pay)}을 벌었습니다. 사장님이 슬쩍 시급표를 다시 보고 있습니다.`],
    closings: ["다음 근무에서는 마트의 핵심 인력이 될 수 있겠습니다.", "높은 단가의 마지막 스테이지가 당신을 기다립니다.", "이 페이스라면 고객 불만도 먼저 줄을 설 겁니다."],
  },
  {
    label: "WORK REVIEW · EXPERT", title: "이달의 수박 전문가",
    summaries: ["썩은 수박도, 고객 불만도 당신 앞에서는 질서를 찾았습니다.", "오늘의 레일은 사실상 당신의 개인 작업대였습니다.", "성과급 상자가 당신을 보면 먼저 열리고 싶어 할 수준입니다."],
    details: (pay) => [`${formatWon(pay)}의 성과는 우연이 아닙니다. 이미 레일의 속도와 보상 타이밍을 읽고 있습니다.`, `오늘 ${formatWon(pay)}을 정산했습니다. 매대의 수박들이 당신에게 경례하고 있습니다.`, `${formatWon(pay)}을 벌었습니다. 이 정도면 수박 분류가 아니라 운영 컨설팅에 가깝습니다.`],
    closings: ["다음 근무에는 마트의 기록을 새로 쓸 수 있겠습니다.", "사장님은 당신의 휴무일을 조심스럽게 묻고 있습니다.", "이제 남은 것은 황금 수박과 기록 경신뿐입니다."],
  },
  {
    label: "WORK REVIEW · LEGEND", title: "정산의 신",
    summaries: ["오늘 마트의 매출은 당신의 손끝에서 나왔습니다.", "레일은 당신을 시험했지만, 결국 당신의 편이 되었습니다.", "오늘의 당신은 분류원이 아니라 마트의 전설입니다."],
    details: (pay) => [`${formatWon(pay)}을 정산했습니다. 수박은 분류됐고, 통장도 익었습니다.`, `오늘의 실수령 ${formatWon(pay)}. 사장님은 당신의 명찰을 금박으로 바꾸는 중입니다.`, `${formatWon(pay)}을 벌었습니다. 이 정도면 수박도 당신의 지시를 기다릴 겁니다.`],
    closings: ["사장님은 당신의 다음 출근을 기다리며 황금 수박을 따로 숨겨두고 있습니다.", "다음 판에는 돈보다 높은 기록을 노려도 좋겠습니다.", "마트 역사책의 첫 장에 오늘의 정산이 기록됐습니다."],
  },
];

function getTemplate(takeHomePay: number): CommentTemplate {
  if (takeHomePay < 0) return COMMENT_TEMPLATES[0];
  if (takeHomePay < 30_000) return COMMENT_TEMPLATES[1];
  if (takeHomePay < 80_000) return COMMENT_TEMPLATES[2];
  if (takeHomePay < 150_000) return COMMENT_TEMPLATES[3];
  if (takeHomePay < 300_000) return COMMENT_TEMPLATES[4];
  return COMMENT_TEMPLATES[5];
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export function getSettlementComment(takeHomePay: number, selectedPerks: readonly string[], random = Math.random): SettlementComment {
  const template = getTemplate(takeHomePay);
  return {
    label: template.label,
    title: template.title,
    summary: pick(template.summaries, random),
    detail: pick(template.details(takeHomePay), random),
    closing: pick(template.closings, random),
    perkHighlight: getPerkHighlight(selectedPerks),
  };
}
