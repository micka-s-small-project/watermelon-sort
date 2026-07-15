export type ShareOutcome = "shared" | "copied" | "unavailable";

export async function shareScore(score: number): Promise<ShareOutcome> {
  const text = `I sorted ${score} watermelons in Watermelon Sorter! Can you beat my score?`;
  try {
    if (navigator.share) { await navigator.share({ title: "Watermelon Sorter", text }); return "shared"; }
    if (navigator.clipboard) { await navigator.clipboard.writeText(text); return "copied"; }
  } catch { return "unavailable"; }
  return "unavailable";
}
