export type Direction = "left" | "right";
export type WatermelonType = "good" | "rotten";
export type GameOverReason = "claims" | "complete";

export type GameStatus = {
  stageIndex: number;
  stageProgress: number;
  claims: number;
  score: number;
  combo: number;
  selectedPerks: string[];
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

export type GameResult = GameStatus & { reason: GameOverReason };
