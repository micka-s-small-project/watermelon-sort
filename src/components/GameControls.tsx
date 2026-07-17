import type { Direction } from "../game/types";

export function GameControls({ onSort }: { onSort: (direction: Direction) => void }) {
  return <div className="controls">
    <button type="button" aria-label="Send healthy watermelon left" className="control-button sort-control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span>
    </button>

    <button type="button" className="control-button center-control-button" aria-label="Center control coming soon" disabled>
      <span aria-hidden="true">◆</span>
      <small>SOON</small>
    </button>

    <button type="button" aria-label="Send rotten watermelon right" className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
