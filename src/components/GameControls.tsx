import { useRef } from "react";
import type { Direction, WatermelonType } from "../game/types";
import type { GameCopy } from "../lib/i18n";

type Props = {
  activeItem: WatermelonType | null;
  copy: GameCopy;
  onDiscardTrash: () => void;
  onTapGolden: () => void;
  onSort: (direction: Direction) => void;
};

const SWIPE_DOWN_DISTANCE = 36;

export function GameControls({ activeItem, copy, onDiscardTrash, onTapGolden, onSort }: Props) {
  const pointerStartYRef = useRef<number | null>(null);
  const trashIsActive = activeItem === "trash";
  const goldenIsActive = activeItem === "golden";

  function handleCenterClick() {
    if (window.matchMedia("(pointer: fine)").matches) onDiscardTrash();
  }

  function handleCenterPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    // Phaser owns the live item state. Always forward the press so a delayed React
    // render can never make a currently active golden watermelon miss input.
    onTapGolden();
    if (trashIsActive) startDiscard(event);
  }

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
      className={`control-button center-control-button ${goldenIsActive ? "golden-control-button" : ""} ${!trashIsActive && !goldenIsActive ? "center-control-button-idle" : ""}`}
      aria-label={goldenIsActive ? copy.tapGolden : trashIsActive ? copy.discardTrash : copy.specialControlIdle}
      onClick={handleCenterClick}
      onPointerDown={handleCenterPointerDown}
      onPointerUp={trashIsActive ? finishDiscard : undefined}
      onPointerCancel={() => { pointerStartYRef.current = null; }}
    >
      <img src={`${import.meta.env.BASE_URL}assets/game/${goldenIsActive ? "watermelon-golden-8bit.png" : "trash-bag-8bit.png"}`} alt="" aria-hidden="true" />
      <small>{goldenIsActive ? copy.tap : trashIsActive ? copy.swipeDown : copy.trashBag}</small>
    </button>

    <button type="button" aria-label={copy.rottenWatermelonRight} className="control-button sort-control-button rotten-button" onClick={() => onSort("right")}>
      <span aria-hidden="true">→</span>
    </button>
  </div>;
}
