import Phaser from "phaser";
import { expectedDirection, pointsForCorrectSort, randomWatermelonType, ROUND_LIMIT_MS } from "./rules";
import type { Direction, GameOverReason, GameResult, WatermelonType } from "./types";

type GameAssets = {
  background: string;
  good: string;
  rotten: string;
  theme: string;
  sortEffect: string;
};

type SceneOptions = {
  assets: GameAssets;
  onGameOver: (result: GameResult) => void;
  onReady: () => void;
};

type VolumeAdjustableSound = Phaser.Sound.BaseSound & {
  setVolume?: (value: number) => unknown;
};

const WATERMELON_SIZE = 70;
const ITEM_DISPLAY_SIZE: Record<WatermelonType, number> = {
  good: WATERMELON_SIZE,
  rotten: WATERMELON_SIZE,
};
const WATERMELON_Y = [108, 134, 160, 186, 212, 238, 264, 290, 316, 342];
const SORT_TRANSITION_MS = 100;

export class GameScene extends Phaser.Scene {
  private readonly assets: GameAssets;
  private readonly onGameOver: (result: GameResult) => void;
  private readonly onReady: () => void;
  private score = 0;
  private combo = 0;
  private activeType: WatermelonType = "good";
  private resolved = true;
  private ready = false;
  private playing = false;
  private musicMuted = false;
  private queue: WatermelonType[] = [];
  private roundTimer?: Phaser.Time.TimerEvent;
  private watermelonSprites: Phaser.GameObjects.Image[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private backgroundMusic?: VolumeAdjustableSound;

  constructor(options: SceneOptions) {
    super("watermelon-game");
    this.assets = options.assets;
    this.onGameOver = options.onGameOver;
    this.onReady = options.onReady;
  }

  preload() {
    this.load.image("conveyor-background", this.assets.background);
    this.load.image("watermelon-good", this.assets.good);
    this.load.image("watermelon-rotten", this.assets.rotten);
    this.load.audio("watermelon-theme", this.assets.theme);
    this.load.audio("sorting-effect", this.assets.sortEffect);
  }

  create() {
    const { width, height } = this.scale;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);
    this.add.image(width / 2, height / 2, "conveyor-background").setDisplaySize(width, height);

    this.scoreText = this.add.text(76, 300, "SCORE\n0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#26733a", fontStyle: "bold",
      align: "center", lineSpacing: 5, stroke: "#ffffff", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.comboText = this.add.text(width - 76, 300, "COMBO\n×0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#b55b2d", fontStyle: "bold",
      align: "center", lineSpacing: 5, stroke: "#ffffff", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.backgroundMusic = this.sound.add("watermelon-theme", {
      loop: true, volume: this.musicMuted ? 0 : 0.35,
    }) as VolumeAdjustableSound;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
    this.ready = true;
    this.onReady();
  }

  begin(): boolean {
    if (!this.ready) return false;
    if (this.watermelonSprites.length === 0) this.preview();
    this.playing = true;
    if (!this.backgroundMusic?.isPlaying) this.backgroundMusic?.play();
    this.startTimer();
    return true;
  }

  preview(): boolean {
    if (!this.ready) return false;
    this.roundTimer?.remove(false);
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.combo = 0;
    this.scoreText?.setText("SCORE\n0");
    this.comboText?.setText("COMBO\n×0");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => randomWatermelonType());
    this.createQueueSprites();
    return true;
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.backgroundMusic?.setVolume?.(muted ? 0 : 0.35);
  }

  sort(direction: Direction) {
    if (!this.playing || this.resolved) return;
    this.resolved = true;
    this.roundTimer?.remove(false);
    this.sound.play("sorting-effect", { volume: 0.55 });

    if (direction !== expectedDirection(this.activeType)) {
      this.finish("wrong");
      return;
    }

    this.score += pointsForCorrectSort(this.score);
    this.combo += 1;
    this.scoreText?.setText(`SCORE\n${this.score}`);
    this.comboText?.setText(`COMBO\n×${this.combo}`);
    this.advanceAndStartNextRound();
  }

  private advanceAndStartNextRound() {
    this.queue.pop();
    this.watermelonSprites.pop()?.destroy();

    const nextType = randomWatermelonType();
    this.queue.unshift(nextType);
    const incoming = this.add.image(this.scale.width / 2, WATERMELON_Y[0] - WATERMELON_SIZE / 2, `watermelon-${nextType}`)
      .setDisplaySize(ITEM_DISPLAY_SIZE[nextType], ITEM_DISPLAY_SIZE[nextType])
      .setAlpha(0.82)
      .setDepth(2);
    this.watermelonSprites.unshift(incoming);

    this.watermelonSprites.forEach((sprite, index) => {
      sprite.setDepth(index + 2);
      this.tweens.add({ targets: sprite, y: WATERMELON_Y[index], alpha: 1, duration: SORT_TRANSITION_MS, ease: "Sine.easeOut" });
    });
    this.activeType = this.queue[this.queue.length - 1];
    this.time.delayedCall(SORT_TRANSITION_MS, () => {
      if (this.playing) this.startTimer();
    });
  }

  private createQueueSprites() {
    this.watermelonSprites = this.queue.map((type, index) =>
      this.add.image(this.scale.width / 2, WATERMELON_Y[index], `watermelon-${type}`)
        .setDisplaySize(ITEM_DISPLAY_SIZE[type], ITEM_DISPLAY_SIZE[type])
        .setDepth(index + 2),
    );
    this.activeType = this.queue[this.queue.length - 1];
  }

  private startTimer() {
    this.resolved = false;
    this.roundTimer = this.time.delayedCall(ROUND_LIMIT_MS, () => {
      if (this.resolved || !this.playing) return;
      this.resolved = true;
      this.finish("timeout");
    });
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.backgroundMusic?.stop();
    this.onGameOver({ score: this.score, combo: this.combo, reason });
  }

  private cleanUp() {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
  }
}
