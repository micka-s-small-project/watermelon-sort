import Phaser from "phaser";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameScene } from "../game/GameScene";
import type { Direction, GameResult, GameStatus, PerkChoice, StageClear } from "../game/types";

export type GameController = {
  preview: () => void;
  start: () => void;
  sort: (direction: Direction) => void;
  tapGolden: () => void;
  openBonusBox: () => void;
  choosePerk: (perk: string) => void;
  continueToNextStage: () => void;
  setMusicMuted: (muted: boolean) => void;
};

type Props = {
  onGameOver: (result: GameResult) => void;
  onStatusChange: (status: GameStatus) => void;
  onPerkChoice: (choice: PerkChoice) => void;
  onStageClear: (stageClear: StageClear) => void;
};

export const GameCanvas = forwardRef<GameController, Props>(function GameCanvas({ onGameOver, onStatusChange, onPerkChoice, onStageClear }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene>();
  const callbackRef = useRef(onGameOver);
  const statusCallbackRef = useRef(onStatusChange);
  const perkChoiceCallbackRef = useRef(onPerkChoice);
  const stageClearCallbackRef = useRef(onStageClear);
  const pendingPreviewRef = useRef(false);
  const pendingStartRef = useRef(false);
  const musicMutedRef = useRef(false);
  callbackRef.current = onGameOver;
  statusCallbackRef.current = onStatusChange;
  perkChoiceCallbackRef.current = onPerkChoice;
  stageClearCallbackRef.current = onStageClear;

  useImperativeHandle(ref, () => ({
    preview: () => {
      if (!sceneRef.current?.preview()) pendingPreviewRef.current = true;
    },
    start: () => {
      if (!sceneRef.current?.begin()) pendingStartRef.current = true;
    },
    sort: (direction) => sceneRef.current?.sort(direction),
    tapGolden: () => sceneRef.current?.tapGolden(),
    openBonusBox: () => sceneRef.current?.openBonusBox(),
    choosePerk: (perk) => sceneRef.current?.choosePerk(perk),
    continueToNextStage: () => sceneRef.current?.continueToNextStage(),
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
        onStatusChange: (status) => statusCallbackRef.current(status),
        onPerkChoice: (choice) => perkChoiceCallbackRef.current(choice),
        onStageClear: (stageClear) => stageClearCallbackRef.current(stageClear),
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
        type: Phaser.AUTO, parent: hostRef.current, width: 400, height: 600,
        backgroundColor: "#f7f5f0", antialias: true, roundPixels: true, scene,
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
