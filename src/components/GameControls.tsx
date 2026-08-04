import { useRef } from "react";
import type { Direction, WatermelonType } from "../game/types";
import type { GameCopy } from "../lib/i18n";

type Props = {
  activeItem: WatermelonType | null;
  copy: GameCopy;
  onDiscardTrash: () => void;
  onSort: (direction: Direction) => void;
};

const SWIPE_DOWN_DISTANCE = 36;

export function GameControls({ activeItem, copy, onDiscardTrash, onSort }: Props) {
  const pointerStartYRef = useRef<number | null>(null);
  const trashIsActive = activeItem === "trash";

  function startDiscard(event: React.PointerEvent<HTMLButtonElement>) {
    pointerStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishDiscard(event: React.PointerEvent<HTMLButtonElement>) {
    const pointerStartY = pointerStartYRef.current;
    pointerStartYRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pointerStartY !== null && event.clientY - pointerStartY >= SWIPE_DOWN_DISTANCE) onDiscardTrash();
  }

  return <div className="controls">
    <button type="button" aria-label={copy.healthyWatermelonLeft} className="control-button sort-control-button good-button" onClick={() => onSort("left")}>
      <span aria-hidden="true">←</span>
    </button>

    <button
      type="button"
      className="control-button center-control-button"
      aria-label={trashIsActive ? copy.discardTrash : copy.trashControlIdle}
      disabled={!trashIsActive}
      onPointerDown={startDiscard}
      onPointerUp={finishDiscard}
      onPointerCancel={() => { pointerStartYRef.current = null; }}
    >
      <img src={`${import.meta.env.BASE_URL}assets/game/trash-bag-8bit.png`} alt="" aria-hidden="true" />
      <small>{trashIsActive ? copy.swipeDown : copy.trashBag}</small>
    </button>

    <button type="button" aria-label={copy.rottenWatermelonRight} className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
