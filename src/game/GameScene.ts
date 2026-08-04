import Phaser from "phaser";
import { expectedDirection, pointsForCorrectSort, pointsForGoldenTap, randomWatermelonType, ROUND_LIMIT_MS } from "./rules";
import type { Direction, GameOverReason, GameResult, WatermelonType } from "./types";

type GameAssets = {
  background: string;
  good: string;
  rotten: string;
  trash: string;
  golden: string;
  theme: string;
  sortEffect: string;
};

type SceneOptions = {
  assets: GameAssets;
  onGameOver: (result: GameResult) => void;
  onActiveItemChange: (type: WatermelonType) => void;
  goldenEggLabel: string;
  goldenMissLabel: string;
  onReady: () => void;
};

type VolumeAdjustableSound = Phaser.Sound.BaseSound & {
  setVolume?: (value: number) => unknown;
};

// Keep the original sprite size while ending the queue before the conveyor roller.
const WATERMELON_SIZE = 70;
// The special PNGs contain more transparent padding than the regular watermelons.
// Compensate at render time so their visible silhouettes share the same game-world size.
const ITEM_DISPLAY_SIZE: Record<WatermelonType, number> = {
  good: WATERMELON_SIZE,
  rotten: WATERMELON_SIZE,
  trash: 100,
  golden: 85,
};
const WATERMELON_Y = [108, 134, 160, 186, 212, 238, 264, 290, 316, 342];
const SORT_TRANSITION_MS = 100;

export class GameScene extends Phaser.Scene {
  private readonly assets: GameAssets;
  private readonly onGameOver: (result: GameResult) => void;
  private readonly onActiveItemChange: (type: WatermelonType) => void;
  private readonly goldenEggLabel: string;
  private readonly goldenMissLabel: string;
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
  private goldenEffectObjects: Phaser.GameObjects.GameObject[] = [];
  private goldenSprite?: Phaser.GameObjects.Image;
  private goldenTapCount = 0;
  private goldenSideMissed = false;

  constructor(options: SceneOptions) {
    super("watermelon-game");
    this.assets = options.assets;
    this.onGameOver = options.onGameOver;
    this.onActiveItemChange = options.onActiveItemChange;
    this.goldenEggLabel = options.goldenEggLabel;
    this.goldenMissLabel = options.goldenMissLabel;
    this.onReady = options.onReady;
  }

  preload() {
    this.load.image("conveyor-background", this.assets.background);
    this.load.image("watermelon-good", this.assets.good);
    this.load.image("watermelon-rotten", this.assets.rotten);
    this.load.image("watermelon-trash", this.assets.trash);
    this.load.image("watermelon-golden", this.assets.golden);
    this.load.audio("watermelon-theme", this.assets.theme);
    this.load.audio("sorting-effect", this.assets.sortEffect);
  }

  create() {
    const { width, height } = this.scale;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);
    this.add.image(width / 2, height / 2, "conveyor-background").setDisplaySize(width, height);

    this.scoreText = this.add.text(76, 300, "SCORE\n0", {
      fontFamily: '"DosStory", monospace',
      fontSize: "18px",
      color: "#26733a",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 5,
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.comboText = this.add.text(width - 76, 300, "COMBO\n×0", {
      fontFamily: '"DosStory", monospace',
      fontSize: "18px",
      color: "#b55b2d",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 5,
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.backgroundMusic = this.sound.add("watermelon-theme", {
      loop: true,
      volume: this.musicMuted ? 0 : 0.35,
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
    this.stopGoldenEffect();
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.combo = 0;
    this.scoreText?.setText("SCORE\n0");
    this.comboText?.setText("COMBO\n×0");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => this.randomType());
    this.createQueueSprites();
    return true;
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.backgroundMusic?.setVolume?.(muted ? 0 : 0.35);
  }

  sort(direction: Direction) {
    if (!this.playing || this.resolved) return;
    if (this.activeType === "golden") {
      this.goldenSideMissed = true;
      this.showFloatingText(this.goldenMissLabel, "#8e612d");
      return;
    }
    this.resolved = true;
    this.roundTimer?.remove(false);
    this.sound.play("sorting-effect", { volume: 0.55 });

    if (this.activeType === "trash" || direction !== expectedDirection(this.activeType)) {
      this.finish("wrong");
      return;
    }

    this.resolveCorrectItem();
  }

  discardTrash() {
    if (!this.playing || this.resolved || this.activeType !== "trash") return;
    this.resolved = true;
    this.roundTimer?.remove(false);
    this.sound.play("sorting-effect", { volume: 0.55 });
    this.resolveCorrectItem();
  }

  tapGolden() {
    if (!this.playing || this.resolved || this.activeType !== "golden") return;
    const points = pointsForGoldenTap(this.score);
    this.goldenTapCount += 1;
    this.score += points;
    this.combo += 1;
    this.scoreText?.setText(`SCORE\n${this.score}`);
    this.comboText?.setText(`COMBO\n×${this.combo}`);
    this.showFloatingText(`+${points}`, "#d29118");
  }

  private resolveCorrectItem() {
    this.score += pointsForCorrectSort(this.score);
    this.combo += 1;
    this.scoreText?.setText(`SCORE\n${this.score}`);
    this.comboText?.setText(`COMBO\n×${this.combo}`);

    this.advanceAndStartNextRound();
  }

  private advanceAndStartNextRound() {
    this.advanceQueue();
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
    this.setActiveType(this.queue[this.queue.length - 1]);
  }

  private advanceQueue() {
    this.stopGoldenEffect();
    this.queue.pop();
    this.watermelonSprites.pop()?.destroy();

    const nextType = this.randomType();
    this.queue.unshift(nextType);
    const incoming = this.add.image(this.scale.width / 2, WATERMELON_Y[0] - WATERMELON_SIZE / 2, `watermelon-${nextType}`)
      .setDisplaySize(ITEM_DISPLAY_SIZE[nextType], ITEM_DISPLAY_SIZE[nextType])
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
    this.setActiveType(this.queue[this.queue.length - 1]);
  }

  private startTimer() {
    this.resolved = false;
    this.goldenTapCount = 0;
    this.goldenSideMissed = false;
    if (this.activeType === "golden") this.startGoldenEffect();
    this.roundTimer = this.time.delayedCall(ROUND_LIMIT_MS, () => {
      if (this.resolved || !this.playing) return;
      this.resolved = true;
      if (this.activeType === "golden") {
        this.stopGoldenEffect();
        if (this.goldenTapCount > 0) {
          this.advanceAndStartNextRound();
          return;
        }
        if (this.goldenSideMissed) {
          this.showFloatingText(this.goldenEggLabel, "#d44848");
          this.time.delayedCall(500, () => {
            if (this.playing) this.advanceAndStartNextRound();
          });
          return;
        }
        this.finish("goldenMiss");
        return;
      }
      this.finish("timeout");
    });
  }

  private randomType(): WatermelonType {
    return randomWatermelonType(this.combo);
  }

  private setActiveType(type: WatermelonType) {
    this.activeType = type;
    this.onActiveItemChange(type);
  }

  private startGoldenEffect() {
    this.stopGoldenEffect();
    const sprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!sprite) return;

    this.goldenSprite = sprite;
    const effectScale = sprite.displayWidth / WATERMELON_SIZE;
    const aura = this.add.circle(sprite.x, sprite.y, 47 * effectScale, 0xffd24a, 0.26).setDepth(sprite.depth - 1);
    const sparkles = [
      this.add.star(sprite.x - 36 * effectScale, sprite.y - 23 * effectScale, 4, 2, 7, 0xfff3b0, 0.95),
      this.add.star(sprite.x + 33 * effectScale, sprite.y - 29 * effectScale, 4, 2, 8, 0xffffff, 0.95),
      this.add.star(sprite.x + 35 * effectScale, sprite.y + 24 * effectScale, 4, 1, 5, 0xffdc58, 0.9),
    ];
    sparkles.forEach((sparkle, index) => {
      sparkle.setDepth(sprite.depth - 1);
      sparkle.setAlpha(0.25);
      this.tweens.add({ targets: sparkle, alpha: 1, scale: 1.35, duration: 330, delay: index * 110, yoyo: true, repeat: -1 });
    });
    this.tweens.add({ targets: aura, alpha: 0.06, scale: 1.28, duration: 520, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: sprite, scaleX: sprite.scaleX * 1.06, scaleY: sprite.scaleY * 1.06, duration: 420, yoyo: true, repeat: -1 });
    this.goldenEffectObjects = [aura, ...sparkles];
  }

  private stopGoldenEffect() {
    this.goldenEffectObjects.forEach((effect) => {
      this.tweens.killTweensOf(effect);
      effect.destroy();
    });
    this.goldenEffectObjects = [];
    if (this.goldenSprite) {
      this.tweens.killTweensOf(this.goldenSprite);
      this.goldenSprite.setDisplaySize(ITEM_DISPLAY_SIZE.golden, ITEM_DISPLAY_SIZE.golden);
      this.goldenSprite = undefined;
    }
  }

  private showFloatingText(text: string, color: string) {
    const sprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!sprite) return;
    const label = this.add.text(sprite.x, sprite.y - 48, text, {
      fontFamily: '"DosStory", monospace',
      fontSize: "18px",
      fontStyle: "bold",
      color,
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: label,
      y: label.y - 22,
      alpha: 0,
      duration: 450,
      ease: "Sine.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.stopGoldenEffect();
    this.backgroundMusic?.stop();
    this.onGameOver({ score: this.score, combo: this.combo, reason });
  }

  private cleanUp() {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.stopGoldenEffect();
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
  }
}
