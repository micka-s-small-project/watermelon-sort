import Phaser from "phaser";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameScene } from "../game/GameScene";
import type { Direction, GameResult } from "../game/types";

export type GameController = {
  start: () => void;
  sort: (direction: Direction) => void;
};

type Props = { onGameOver: (result: GameResult) => void };

export const GameCanvas = forwardRef<GameController, Props>(function GameCanvas({ onGameOver }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene>();
  const callbackRef = useRef(onGameOver);
  const pendingStartRef = useRef(false);
  callbackRef.current = onGameOver;

  useImperativeHandle(ref, () => ({
    start: () => {
      if (!sceneRef.current?.begin()) pendingStartRef.current = true;
    },
    sort: (direction) => sceneRef.current?.sort(direction),
  }), []);

  useEffect(() => {
    if (!hostRef.current) return;

    const baseUrl = import.meta.env.BASE_URL;
    const scene = new GameScene({
      assets: {
        background: `${baseUrl}assets/game/conveyor-background-8bit.jpg`,
        good: `${baseUrl}assets/game/watermelon-good-8bit.png`,
        rotten: `${baseUrl}assets/game/watermelon-rotten-8bit.png`,
        theme: `${baseUrl}assets/game/watermelon-theme.mp3`,
        sortEffect: `${baseUrl}assets/game/sorting-effect.mp3`,
      },
      onGameOver: (result) => callbackRef.current(result),
      onReady: () => {
        if (pendingStartRef.current) {
          pendingStartRef.current = false;
          scene.begin();
        }
      },
    });
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 400,
      height: 450,
      backgroundColor: "#f7f5f0",
      antialias: true,
      roundPixels: true,
      scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });

    return () => {
      sceneRef.current = undefined;
      game.destroy(true);
    };
  }, []);

  return <div ref={hostRef} className="game-canvas" />;
});
