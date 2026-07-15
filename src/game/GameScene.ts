import Phaser from "phaser";
import { expectedDirection, pointsForCorrectSort, ROUND_LIMIT_MS } from "./rules";
import type { Direction, GameOverReason, GameResult, WatermelonType } from "./types";

type GameAssets = {
  background: string;
  good: string;
  rotten: string;
};

type SceneOptions = {
  assets: GameAssets;
  onGameOver: (result: GameResult) => void;
  onReady: () => void;
};

// Ten 70px sprites overlap by 41px so the belt reads as one busy, layered flow.
const WATERMELON_Y = [70, 99, 128, 157, 186, 215, 244, 273, 302, 331];
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
  private queue: WatermelonType[] = [];
  private roundTimer?: Phaser.Time.TimerEvent;
  private watermelonSprites: Phaser.GameObjects.Image[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;

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
  }

  create() {
    const { width, height } = this.scale;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);
    this.add.image(width / 2, height / 2, "conveyor-background").setDisplaySize(width, height);

    this.scoreText = this.add.text(16, 24, "SCORE 0", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#222222",
      fontStyle: "bold",
    }).setOrigin(0, 0.5).setResolution(textResolution);
    this.comboText = this.add.text(width - 16, 24, "COMBO ×0", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#222222",
      fontStyle: "bold",
    }).setOrigin(1, 0.5).setResolution(textResolution);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
    this.ready = true;
    this.onReady();
  }

  begin(): boolean {
    if (!this.ready) return false;

    this.roundTimer?.remove(false);
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.combo = 0;
    this.scoreText?.setText("SCORE 0");
    this.comboText?.setText("COMBO ×0");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => this.randomType());
    this.playing = true;
    this.createQueueSprites();
    this.startTimer();
    return true;
  }

  sort(direction: Direction) {
    if (!this.playing || this.resolved) return;
    this.resolved = true;
    this.roundTimer?.remove(false);

    if (direction !== expectedDirection(this.activeType)) {
      this.finish("wrong");
      return;
    }

    this.score += pointsForCorrectSort(this.score);
    this.combo += 1;
    this.scoreText?.setText(`SCORE ${this.score}`);
    this.comboText?.setText(`COMBO ×${this.combo}`);

    this.advanceQueue();
    this.time.delayedCall(SORT_TRANSITION_MS, () => {
      if (this.playing) this.startTimer();
    });
  }

  private createQueueSprites() {
    this.watermelonSprites = this.queue.map((type, index) =>
      this.add.image(this.scale.width / 2, WATERMELON_Y[index], `watermelon-${type}`)
        .setDisplaySize(70, 70)
        .setDepth(index + 2),
    );
    this.activeType = this.queue[this.queue.length - 1];
  }

  private advanceQueue() {
    this.queue.pop();
    this.watermelonSprites.pop()?.destroy();

    const nextType = this.randomType();
    this.queue.unshift(nextType);
    const incoming = this.add.image(this.scale.width / 2, WATERMELON_Y[0] - 35, `watermelon-${nextType}`)
      .setDisplaySize(70, 70)
      .setAlpha(0.82)
      .setDepth(2);
    this.watermelonSprites.unshift(incoming);

    this.watermelonSprites.forEach((sprite, index) => {
      sprite.setDepth(index + 2);
      this.tweens.add({
        targets: sprite,
        y: WATERMELON_Y[index],
        alpha: 1,
        duration: SORT_TRANSITION_MS,
        ease: "Sine.easeOut",
      });
    });
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

  private randomType(): WatermelonType {
    return Math.random() < 0.5 ? "good" : "rotten";
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.onGameOver({ score: this.score, combo: this.combo, reason });
  }

  private cleanUp() {
    this.playing = false;
    this.roundTimer?.remove(false);
  }
}
