import type { Direction } from "../game/types";
import type { GameCopy } from "../lib/i18n";

type Props = { copy: GameCopy; onSort: (direction: Direction) => void };

export function GameControls({ copy, onSort }: Props) {
  return <div className="controls controls-two-actions">
    <button type="button" aria-label={copy.healthyWatermelonLeft} className="control-button sort-control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span>
    </button>
    <button type="button" aria-label={copy.rottenWatermelonRight} className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
