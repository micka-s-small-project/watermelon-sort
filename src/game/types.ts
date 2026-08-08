export type Direction = "left" | "center" | "right";
export type WatermelonType = "good" | "rotten" | "trash" | "golden";
export type GameOverReason = "claims" | "complete";

export type GameStatus = {
  stageIndex: number;
  stageProgress: number;
  claims: number;
  claimLimit: number;
  score: number;
  combo: number;
  selectedPerks: string[];
  trashCollectorActive: boolean;
  goldenWatermelonActive: boolean;
  bonusBoxActive: boolean;
};

export type PerkChoice = {
  stageIndex: number;
  phase: "start" | "midpoint";
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
