import type { Direction } from "../game/types";

export function GameControls({ onSort }: { onSort: (direction: Direction) => void }) {
  return <div className="controls">
    <button aria-label="Send healthy watermelon left" className="control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span><small>HEALTHY</small>
    </button>
    <button aria-label="Send rotten watermelon right" className="control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span><small>ROTTEN</small>
    </button>
  </div>;
}
