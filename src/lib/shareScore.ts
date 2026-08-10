export type ShareOutcome = "shared" | "copied" | "unavailable";

export async function shareScore(title: string, text: string): Promise<ShareOutcome> {
  try {
    if (navigator.share) { await navigator.share({ title, text }); return "shared"; }
    if (navigator.clipboard) { await navigator.clipboard.writeText(text); return "copied"; }
  } catch { return "unavailable"; }
  return "unavailable";
}
