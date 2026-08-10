export type Stage = {
  id: 1 | 2 | 3;
  title: { ko: string; en: string };
  target: number;
  roundLimitMs: number;
};

export const STAGES: readonly Stage[] = [
  { id: 1, title: { ko: "입고 검수", en: "Receiving Check" }, target: 100, roundLimitMs: 1_500 },
  { id: 2, title: { ko: "폐점 세일", en: "Closing Sale" }, target: 150, roundLimitMs: 1_250 },
  { id: 3, title: { ko: "월말 정산 전야", en: "Month-End Rush" }, target: 200, roundLimitMs: 1_000 },
];

export function getStage(stageIndex: number): Stage {
  const stage = STAGES[stageIndex];
  if (!stage) throw new Error(`Unknown stage index: ${stageIndex}`);
  return stage;
}

export function isStageMidpoint(stageIndex: number, progress: number): boolean {
  return progress === Math.ceil(getStage(stageIndex).target / 2);
}

export function isStageComplete(stageIndex: number, progress: number): boolean {
  return progress >= getStage(stageIndex).target;
}

export function hasNextStage(stageIndex: number): boolean {
  return stageIndex < STAGES.length - 1;
}
