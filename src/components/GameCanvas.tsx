import Phaser from "phaser";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameScene } from "../game/GameScene";
import type { Direction, GameResult } from "../game/types";

export type GameController = {
  start: () => void;
  sort: (direction: Direction) => void;
  setMusicMuted: (muted: boolean) => void;
};

type Props = { onGameOver: (result: GameResult) => void };

export const GameCanvas = forwardRef<GameController, Props>(function GameCanvas({ onGameOver }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene>();
  const callbackRef = useRef(onGameOver);
  const pendingStartRef = useRef(false);
  const musicMutedRef = useRef(false);
  callbackRef.current = onGameOver;

  useImperativeHandle(ref, () => ({
    start: () => {
      if (!sceneRef.current?.begin()) pendingStartRef.current = true;
    },
    sort: (direction) => sceneRef.current?.sort(direction),
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
          theme: `${baseUrl}assets/game/watermelon-theme.mp3`,
          sortEffect: `${baseUrl}assets/game/sorting-effect.mp3`,
        },
        onGameOver: (result) => callbackRef.current(result),
        onReady: () => {
          scene.setMusicMuted(musicMutedRef.current);
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
