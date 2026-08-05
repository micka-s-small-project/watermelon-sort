import type { Direction, WatermelonType } from "./types";

export const ROUND_LIMIT_MS = 1_500;
export function expectedDirection(type: Extract<WatermelonType, "good" | "rotten">): Direction {
  return type === "good" ? "left" : "right";
}

export function randomWatermelonType(random = Math.random()): WatermelonType {
  return random < 0.5 ? "good" : "rotten";
}

export function pointsForCorrectSort(currentScore: number): number {
  if (currentScore >= 200) return 3;
  if (currentScore >= 100) return 2;
  return 1;
}
