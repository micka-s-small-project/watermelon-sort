export const WON_PER_SCORE = 100;
export const CLAIM_DEDUCTION_WON = 10_000;

export function calculateSettlement(score: number): number {
  return Math.max(0, score) * WON_PER_SCORE;
}

export function calculateClaimDeduction(claims: number): number {
  return Math.max(0, claims) * CLAIM_DEDUCTION_WON;
}

export function calculateTakeHomePay(score: number, claims: number): number {
  return calculateSettlement(score) - calculateClaimDeduction(claims);
}

export function formatWon(amount: number): string {
  const roundedAmount = Math.round(amount);
  return `${roundedAmount < 0 ? "-" : ""}₩${Math.abs(roundedAmount).toLocaleString("ko-KR")}`;
}
