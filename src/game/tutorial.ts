import type { WatermelonType } from "./types";

export type TutorialWatermelonType = Extract<WatermelonType, "good" | "rotten">;
export type TutorialConveyorItem = TutorialWatermelonType | "bonus";

export const TUTORIAL_WATERMELONS: readonly TutorialWatermelonType[] = [
  "good",
  "rotten",
  "good",
  "rotten",
  "good",
  "rotten",
  "good",
  "rotten",
  "good",
  "rotten",
];

export const TUTORIAL_TOTAL = TUTORIAL_WATERMELONS.length;

export const TUTORIAL_SEQUENCE: readonly TutorialConveyorItem[] = [
  ...TUTORIAL_WATERMELONS.slice(0, 5),
  "bonus",
  ...TUTORIAL_WATERMELONS.slice(5),
];
