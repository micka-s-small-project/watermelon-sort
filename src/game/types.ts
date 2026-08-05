export type Direction = "left" | "right";
export type WatermelonType = "good" | "rotten" | "trash";
export type GameOverReason = "wrong" | "timeout";

export type GameResult = { score: number; combo: number; reason: GameOverReason };
