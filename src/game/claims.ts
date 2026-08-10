export function recordClaimHistory(claimHistory: number, claimConsumed: boolean): number {
  return claimConsumed ? claimHistory + 1 : claimHistory;
}
