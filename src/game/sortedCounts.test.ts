import { describe, expect, it } from "vitest";
import { createSortedCounts, recordSortedItem } from "./sortedCounts";

describe("sorted item counts", () => {
  it("starts every item type at zero", () => {
    expect(createSortedCounts()).toEqual({ good: 0, rotten: 0, trash: 0, golden: 0 });
  });

  it("increments only the successfully processed item type", () => {
    const counts = recordSortedItem(createSortedCounts(), "golden");
    expect(counts).toEqual({ good: 0, rotten: 0, trash: 0, golden: 1 });
  });
});
