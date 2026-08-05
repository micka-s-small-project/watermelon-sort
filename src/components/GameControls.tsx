import type { Direction } from "../game/types";
import type { GameCopy } from "../lib/i18n";

type Props = { copy: GameCopy; onSort: (direction: Direction) => void; showTrashControl: boolean };

export function GameControls({ copy, onSort, showTrashControl }: Props) {
  return <div className={`controls ${showTrashControl ? "controls-three-actions" : "controls-two-actions"}`}>
    <button type="button" aria-label={copy.healthyWatermelonLeft} className="control-button sort-control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span>
    </button>
    {showTrashControl && (
      <button type="button" aria-label="쓰레기 가운데 분류" className="control-button sort-control-button trash-button" onClick={() => onSort("center")}>
        <span aria-hidden="true">↓</span>
      </button>
    )}
    <button type="button" aria-label={copy.rottenWatermelonRight} className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
