import Phaser from "phaser";
import { expectedDirection, pointsForCorrectSort, randomWatermelonType } from "./rules";
import { getStage, hasNextStage, isStageComplete, isStageMidpoint } from "./stages";
import type { Direction, GameOverReason, GameResult, GameStatus, PerkChoice, StageClear, WatermelonType } from "./types";

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
  onStatusChange: (status: GameStatus) => void;
  onPerkChoice: (choice: PerkChoice) => void;
  onStageClear: (stageClear: StageClear) => void;
  onReady: () => void;
};

type VolumeAdjustableSound = Phaser.Sound.BaseSound & {
  setVolume?: (value: number) => unknown;
};

type ConveyorItem = WatermelonType | "bonus";
type ConveyorSprite = Phaser.GameObjects.Image | Phaser.GameObjects.Container;

const WATERMELON_SIZE = 70;
const WATERMELON_Y = [108, 134, 160, 186, 212, 238, 264, 290, 316, 342];
const SORT_TRANSITION_MS = 100;
const MAX_CLAIMS = 3;
const TEMPORARY_PERKS = ["특성 1", "특성 2", "특성 3"] as const;

export class GameScene extends Phaser.Scene {
  private readonly assets: GameAssets;
  private readonly onGameOver: (result: GameResult) => void;
  private readonly onStatusChange: (status: GameStatus) => void;
  private readonly onPerkChoice: (choice: PerkChoice) => void;
  private readonly onStageClear: (stageClear: StageClear) => void;
  private readonly onReady: () => void;
  private score = 0;
  private combo = 0;
  private stageIndex = 0;
  private stageProgress = 0;
  private claims = 0;
  private selectedPerks: string[] = [];
  private midpointChoiceShown = false;
  private activeType: WatermelonType = "good";
  private resolved = true;
  private ready = false;
  private playing = false;
  private awaitingPerk = false;
  private awaitingStageTransition = false;
  private musicMuted = false;
  private queue: ConveyorItem[] = [];
  private roundTimer?: Phaser.Time.TimerEvent;
  private watermelonSprites: ConveyorSprite[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private backgroundMusic?: VolumeAdjustableSound;
  private activeItem: ConveyorItem = "good";

  constructor(options: SceneOptions) {
    super("watermelon-game");
    this.assets = options.assets;
    this.onGameOver = options.onGameOver;
    this.onStatusChange = options.onStatusChange;
    this.onPerkChoice = options.onPerkChoice;
    this.onStageClear = options.onStageClear;
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
    this.scoreText = this.add.text(76, 300, "SCORE 0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#26733a", fontStyle: "bold",
      align: "center", stroke: "#ffffff", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.comboText = this.add.text(width - 76, 300, "COMBO x0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#b55b2d", fontStyle: "bold",
      align: "center", stroke: "#ffffff", strokeThickness: 3,
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
    this.preview();
    this.emitStatus();
    this.requestPerk("start");
    return true;
  }

  preview(): boolean {
    if (!this.ready) return false;
    this.roundTimer?.remove(false);
    this.playing = false;
    this.awaitingPerk = false;
    this.awaitingStageTransition = false;
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.combo = 0;
    this.stageIndex = 0;
    this.stageProgress = 0;
    this.claims = 0;
    this.selectedPerks = [];
    this.midpointChoiceShown = false;
    this.scoreText?.setText("SCORE 0");
    this.comboText?.setText("COMBO x0");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => randomWatermelonType());
    this.createQueueSprites();
    return true;
  }

  choosePerk(perk: string) {
    if (!this.awaitingPerk) return;
    this.selectedPerks.push(perk);
    this.awaitingPerk = false;
    this.playing = true;
    if (!this.backgroundMusic?.isPlaying) this.backgroundMusic?.play();
    this.emitStatus();
    this.startTimer();
  }

  continueToNextStage() {
    if (!this.awaitingStageTransition) return;
    this.awaitingStageTransition = false;
    this.stageIndex += 1;
    this.stageProgress = 0;
    this.midpointChoiceShown = false;
    this.emitStatus();
    this.requestPerk("start");
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.backgroundMusic?.setVolume?.(muted ? 0 : 0.35);
  }

  sort(direction: Direction) {
    if (!this.playing || this.resolved || this.awaitingPerk) return;
    this.resolved = true;
    this.roundTimer?.remove(false);
    this.sound.play("sorting-effect", { volume: 0.55 });

    if (direction !== expectedDirection(this.activeType)) {
      this.registerClaim();
      return;
    }

    this.score += pointsForCorrectSort(this.score);
    this.combo += 1;
    this.stageProgress += 1;
    this.scoreText?.setText(`SCORE ${this.score}`);
    this.comboText?.setText(`COMBO x${this.combo}`);
    this.emitStatus();

    if (isStageComplete(this.stageIndex, this.stageProgress)) {
      this.completeStage();
      return;
    }
    if (!this.midpointChoiceShown && isStageMidpoint(this.stageIndex, this.stageProgress)) {
      this.midpointChoiceShown = true;
      this.advanceAndStartNextRound("bonus");
      return;
    }
    this.advanceAndStartNextRound();
  }

  private registerClaim() {
    this.claims += 1;
    this.combo = 0;
    this.comboText?.setText("COMBO x0");
    this.emitStatus();
    if (this.claims >= MAX_CLAIMS) {
      this.finish("claims");
      return;
    }
    this.advanceAndStartNextRound();
  }

  private completeStage() {
    if (!hasNextStage(this.stageIndex)) {
      this.finish("complete");
      return;
    }
    this.playing = false;
    this.awaitingStageTransition = true;
    this.roundTimer?.remove(false);
    this.advanceQueue();
    this.onStageClear({ completedStageIndex: this.stageIndex, status: this.getStatus() });
  }

  private requestPerk(phase: PerkChoice["phase"]) {
    this.playing = false;
    this.awaitingPerk = true;
    this.roundTimer?.remove(false);
    this.onPerkChoice({
      stageIndex: this.stageIndex,
      phase,
      options: TEMPORARY_PERKS,
    });
  }

  private advanceAndStartNextRound(incomingItem: ConveyorItem = randomWatermelonType()) {
    this.advanceQueue(incomingItem);
    if (this.activeItem === "bonus") {
      this.time.delayedCall(500, () => {
        if (!this.playing || this.activeItem !== "bonus") return;
        this.advanceQueue();
        this.requestPerk("midpoint");
      });
      return;
    }
    this.time.delayedCall(SORT_TRANSITION_MS, () => {
      if (this.playing) this.startTimer();
    });
  }

  private advanceQueue(incomingItem: ConveyorItem = randomWatermelonType()) {
    this.queue.pop();
    this.watermelonSprites.pop()?.destroy();
    this.queue.unshift(incomingItem);
    const incoming = this.createConveyorSprite(incomingItem, WATERMELON_Y[0] - WATERMELON_SIZE / 2)
      .setAlpha(0.82)
      .setDepth(2);
    this.watermelonSprites.unshift(incoming);

    this.watermelonSprites.forEach((sprite, index) => {
      sprite.setDepth(index + 2);
      this.tweens.add({ targets: sprite, y: WATERMELON_Y[index], alpha: 1, duration: SORT_TRANSITION_MS, ease: "Sine.easeOut" });
    });
    this.activeItem = this.queue[this.queue.length - 1];
    if (this.activeItem !== "bonus") this.activeType = this.activeItem;
  }

  private createQueueSprites() {
    this.watermelonSprites = this.queue.map((item, index) =>
      this.createConveyorSprite(item, WATERMELON_Y[index]).setDepth(index + 2),
    );
    this.activeItem = this.queue[this.queue.length - 1];
    if (this.activeItem !== "bonus") this.activeType = this.activeItem;
  }

  private createConveyorSprite(item: ConveyorItem, y: number): ConveyorSprite {
    if (item !== "bonus") {
      return this.add.image(this.scale.width / 2, y, `watermelon-${item}`)
        .setDisplaySize(WATERMELON_SIZE, WATERMELON_SIZE);
    }
    const box = this.add.container(this.scale.width / 2, y);
    const boxBody = this.add.rectangle(0, 0, 78, 58, 0xfdf8e7).setStrokeStyle(3, 0x26343d);
    const boxLabel = this.add.text(0, 0, "보너스\n성과급", {
      fontFamily: '"DosStory", monospace', fontSize: "12px", color: "#a85f2d", fontStyle: "bold", align: "center",
    }).setOrigin(0.5);
    box.add([boxBody, boxLabel]);
    return box;
  }

  private startTimer() {
    this.resolved = false;
    this.roundTimer = this.time.delayedCall(getStage(this.stageIndex).roundLimitMs, () => {
      if (this.resolved || !this.playing) return;
      this.resolved = true;
      this.registerClaim();
    });
  }

  private getStatus(): GameStatus {
    return {
      stageIndex: this.stageIndex,
      stageProgress: this.stageProgress,
      claims: this.claims,
      score: this.score,
      combo: this.combo,
      selectedPerks: this.selectedPerks,
    };
  }

  private emitStatus() {
    this.onStatusChange(this.getStatus());
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.awaitingPerk = false;
    this.awaitingStageTransition = false;
    this.roundTimer?.remove(false);
    this.backgroundMusic?.stop();
    this.onGameOver({ ...this.getStatus(), reason });
  }

  private cleanUp() {
    this.playing = false;
    this.roundTimer?.remove(false);
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
  }
}
