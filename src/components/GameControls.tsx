import type { Direction } from "../game/types";
import type { GameCopy } from "../lib/i18n";

type Props = {
  copy: GameCopy;
  onSort: (direction: Direction) => void;
  onOpenBonusBox: () => void;
  onTapGolden: () => void;
  showBonusControl: boolean;
  showGoldenControl: boolean;
  showTrashControl: boolean;
};

export function GameControls({ copy, onSort, onOpenBonusBox, onTapGolden, showBonusControl, showGoldenControl, showTrashControl }: Props) {
  const specialActionActive = showTrashControl || showGoldenControl || showBonusControl;
  const centerLabel = showGoldenControl ? "TAP!" : showBonusControl ? "OPEN!" : showTrashControl ? "↓" : "ACTION";
  const centerHint = showGoldenControl ? "황금 수박 연타" : showBonusControl ? "성과급 수령" : showTrashControl ? "쓰레기 분류" : "보너스 · 특수 아이템";
  return <div className="controls controls-three-actions">
    <button type="button" aria-label={copy.healthyWatermelonLeft} className="control-button sort-control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span>
    </button>
    <button
      type="button"
      aria-label={centerHint}
      className={`control-button sort-control-button action-button ${showGoldenControl ? "golden-button" : showBonusControl ? "bonus-button" : showTrashControl ? "trash-button" : "action-button-idle"}`}
      disabled={!specialActionActive}
      onClick={showGoldenControl ? onTapGolden : showBonusControl ? onOpenBonusBox : () => onSort("center")}
    >
      <span aria-hidden="true">{centerLabel}</span>
      <small>{centerHint}</small>
    </button>
    <button type="button" aria-label={copy.rottenWatermelonRight} className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
