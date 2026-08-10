export const WON_PER_SCORE_BY_STAGE = [100, 200, 300] as const;
export const CLAIM_DEDUCTION_WON = 10_000;

export function getWonPerScore(stageIndex: number): number {
  return WON_PER_SCORE_BY_STAGE[stageIndex] ?? WON_PER_SCORE_BY_STAGE[WON_PER_SCORE_BY_STAGE.length - 1];
}

export function calculateStageSettlement(score: number, stageIndex: number): number {
  return Math.max(0, score) * getWonPerScore(stageIndex);
}

export function calculateSettlement(stageScores: readonly number[]): number {
  return stageScores.reduce(
    (total, score, stageIndex) => total + calculateStageSettlement(score, stageIndex),
    0,
  );
}

export function calculateClaimDeduction(claims: number): number {
  return Math.max(0, claims) * CLAIM_DEDUCTION_WON;
}

export function calculateTakeHomePay(stageScores: readonly number[], claims: number): number {
  return calculateSettlement(stageScores) - calculateClaimDeduction(claims);
}

export function formatWon(amount: number): string {
  const roundedAmount = Math.round(amount);
  return `${roundedAmount < 0 ? "-" : ""}₩${Math.abs(roundedAmount).toLocaleString("ko-KR")}`;
}
