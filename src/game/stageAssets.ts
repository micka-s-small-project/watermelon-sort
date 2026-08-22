export const STAGE_BACKGROUND_ASSET_KEYS = [
  "conveyor-background-stage-0",
  "conveyor-background-stage-1",
  "conveyor-background-stage-2",
] as const;

export function getStageBackgroundAssetKey(stageIndex: number): string {
  return STAGE_BACKGROUND_ASSET_KEYS[stageIndex] ?? STAGE_BACKGROUND_ASSET_KEYS[0];
}

export function getStageMusicAssetKey(stageIndex: number): "watermelon-theme" | "market-theme" | "supermarket-theme" {
  if (stageIndex === 1) return "market-theme";
  if (stageIndex === 2) return "supermarket-theme";
  return "watermelon-theme";
}
