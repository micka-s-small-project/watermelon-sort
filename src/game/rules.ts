import type { Direction, WatermelonType } from "./types";

export const ROUND_LIMIT_MS = 1_500;

export function expectedDirection(type: Exclude<WatermelonType, "trash">): Direction {
  return type === "good" ? "left" : "right";
}

export function trashSpawnChance(combo: number): number {
  if (combo >= 25) return 0.15;
  if (combo >= 10) return 0.08;
  return 0.03;
}

export function randomWatermelonType(combo = 0, random = Math.random()): WatermelonType {
  const trashChance = trashSpawnChance(combo);
  if (random < trashChance) return "trash";
  return random < (1 + trashChance) / 2 ? "good" : "rotten";
}

export function pointsForCorrectSort(currentScore: number): number {
  if (currentScore >= 200) return 3;
  if (currentScore >= 100) return 2;
  return 1;
}
