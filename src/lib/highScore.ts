const KEY = "watermelon-sorter-best-score";

export function getBestScore(): number {
  try {
    const value = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch { return 0; }
}

export function saveBestScore(score: number): number {
  const best = Math.max(getBestScore(), score);
  try { window.localStorage.setItem(KEY, String(best)); } catch { /* local play still works */ }
  return best;
}
