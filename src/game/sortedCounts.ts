import type { SortedCounts, WatermelonType } from "./types";

export function createSortedCounts(): SortedCounts {
  return { good: 0, rotten: 0, trash: 0, golden: 0 };
}

export function recordSortedItem(counts: SortedCounts, item: WatermelonType): SortedCounts {
  return { ...counts, [item]: counts[item] + 1 };
}
