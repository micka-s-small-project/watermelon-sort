export type Direction = "left" | "right";
export type WatermelonType = "good" | "rotten" | "trash" | "golden";
export type GameOverReason = "wrong" | "timeout" | "goldenMiss";

export type GameResult = { score: number; combo: number; reason: GameOverReason };
