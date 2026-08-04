import Phaser from "phaser";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameScene } from "../game/GameScene";
import type { Direction, GameResult, WatermelonType } from "../game/types";

export type GameController = {
  preview: () => void;
  start: () => void;
  sort: (direction: Direction) => void;
  discardTrash: () => void;
  tapGolden: () => void;
  setMusicMuted: (muted: boolean) => void;
};

type Props = {
  goldenEggLabel: string;
  goldenMissLabel: string;
  onActiveItemChange: (type: WatermelonType) => void;
  onGameOver: (result: GameResult) => void;
};

export const GameCanvas = forwardRef<GameController, Props>(function GameCanvas({ goldenEggLabel, goldenMissLabel, onActiveItemChange, onGameOver }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene>();
  const callbackRef = useRef(onGameOver);
  const activeItemCallbackRef = useRef(onActiveItemChange);
  const goldenEggLabelRef = useRef(goldenEggLabel);
  const goldenMissLabelRef = useRef(goldenMissLabel);
  const pendingPreviewRef = useRef(false);
  const pendingStartRef = useRef(false);
  const musicMutedRef = useRef(false);
  callbackRef.current = onGameOver;
  activeItemCallbackRef.current = onActiveItemChange;
  goldenEggLabelRef.current = goldenEggLabel;
  goldenMissLabelRef.current = goldenMissLabel;

  useImperativeHandle(ref, () => ({
    preview: () => {
      if (!sceneRef.current?.preview()) pendingPreviewRef.current = true;
    },
    start: () => {
      if (!sceneRef.current?.begin()) pendingStartRef.current = true;
    },
    sort: (direction) => sceneRef.current?.sort(direction),
    discardTrash: () => sceneRef.current?.discardTrash(),
    tapGolden: () => sceneRef.current?.tapGolden(),
    setMusicMuted: (muted) => {
      musicMutedRef.current = muted;
      sceneRef.current?.setMusicMuted(muted);
    },
  }), []);

  useEffect(() => {
    if (!hostRef.current) return;

    let destroyed = false;
    let game: Phaser.Game | undefined;

    const bootGame = async () => {
      try {
        await document.fonts.load('16px "DosStory"');
      } catch {
        // The fallback monospace font keeps the game usable if the web font cannot load.
      }
      if (destroyed || !hostRef.current) return;

      const baseUrl = import.meta.env.BASE_URL;
      const scene = new GameScene({
        assets: {
          background: `${baseUrl}assets/game/conveyor-truck-clean-top-v9.png`,
          good: `${baseUrl}assets/game/watermelon-good-8bit.png`,
          rotten: `${baseUrl}assets/game/watermelon-rotten-8bit.png`,
          trash: `${baseUrl}assets/game/trash-bag-8bit.png`,
          golden: `${baseUrl}assets/game/watermelon-golden-8bit.png`,
          theme: `${baseUrl}assets/game/watermelon-theme.mp3`,
          sortEffect: `${baseUrl}assets/game/sorting-effect.mp3`,
        },
        onGameOver: (result) => callbackRef.current(result),
        onActiveItemChange: (type) => activeItemCallbackRef.current(type),
        goldenEggLabel: goldenEggLabelRef.current,
        goldenMissLabel: goldenMissLabelRef.current,
        onReady: () => {
          scene.setMusicMuted(musicMutedRef.current);
          if (pendingPreviewRef.current) {
            pendingPreviewRef.current = false;
            scene.preview();
          }
          if (pendingStartRef.current) {
            pendingStartRef.current = false;
            scene.begin();
          }
        },
      });
      sceneRef.current = scene;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 400,
        height: 600,
        backgroundColor: "#f7f5f0",
        antialias: true,
        roundPixels: true,
        scene,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      });
    };

    void bootGame();

    return () => {
      destroyed = true;
      sceneRef.current = undefined;
      game?.destroy(true);
    };
  }, []);

  return <div ref={hostRef} className="game-canvas" />;
});
