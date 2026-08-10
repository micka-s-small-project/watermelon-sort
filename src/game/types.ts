export type Direction = "left" | "center" | "right";
export type WatermelonType = "good" | "rotten" | "trash" | "golden";
export type GameOverReason = "claims" | "complete";
export type SortedCounts = Record<WatermelonType, number>;

export type TutorialProgress = {
  completed: number;
  total: number;
  currentItem: Extract<WatermelonType, "good" | "rotten"> | "bonus";
  firstAttemptCorrect: number;
  hadWrongAttempt: boolean;
};

export type TutorialResult = {
  total: number;
  firstAttemptCorrect: number;
};

export type GameStatus = {
  stageIndex: number;
  stageProgress: number;
  claims: number;
  claimLimit: number;
  score: number;
  stageScores: readonly number[];
  combo: number;
  sortedCounts: SortedCounts;
  selectedPerks: string[];
  trashCollectorActive: boolean;
  goldenWatermelonActive: boolean;
  bonusBoxActive: boolean;
  tutorial?: TutorialProgress;
};

export type PerkChoice = {
  stageIndex: number;
  phase: "start" | "midpoint" | "tutorial";
  options: readonly string[];
};

export type StageClear = {
  completedStageIndex: number;
  status: GameStatus;
};

export type GameClaim = {
  stageIndex: number;
  reason: "wrong_direction" | "timeout";
  itemType: WatermelonType;
  combo: number;
  claimConsumed: boolean;
};

export type GameResult = GameStatus & { reason: GameOverReason };
