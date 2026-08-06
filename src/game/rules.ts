import type { Direction, WatermelonType } from "./types";

export function expectedDirection(type: WatermelonType): Direction {
  if (type === "good") return "left";
  if (type === "trash") return "center";
  if (type === "golden") return "center";
  return "right";
}

export function pointsForGoldenTap(currentScore: number, godsHand = false): number {
  if (godsHand) return 3;
  return pointsForCorrectSort(currentScore) * 5;
}

export function randomWatermelonType(random = Math.random(), goodProbability = 0.5): WatermelonType {
  return random < goodProbability ? "good" : "rotten";
}

export function pointsForCorrectSort(
  currentScore: number,
  type: WatermelonType = "good",
  premiumDeliveryContract = false,
  trashCollector = false,
  godsHand = false,
): number {
  if (godsHand && type !== "trash") return 3;
  const basePoints = currentScore >= 200 ? 3 : currentScore >= 100 ? 2 : 1;
  if (type === "rotten" && (premiumDeliveryContract || trashCollector)) return 0;
  if (type === "trash") return basePoints * 4;
  return premiumDeliveryContract ? basePoints * 2 : basePoints;
}
