import Phaser from "phaser";
import {
  CLOSING_RUSH,
  CONTINUOUS_WORK_ALLOWANCE,
  GOLDEN_WATERMELON_CONTRACT,
  GODS_HAND,
  getRandomPerks,
  hasPerk,
  hasPremiumDeliveryContract,
  INSTANT_ALLOWANCE,
  PERFECT_DELIVERY_BONUS,
  PREMIUM_DELIVERY_CONTRACT,
  RECOVERY_SUPPORT,
  SAFETY_TRAINING,
  TRASH_COLLECTOR,
  WORK_MANUAL,
} from "./perks";
import { expectedDirection, pointsForCorrectSort, pointsForGoldenTap, randomWatermelonType } from "./rules";
import { getStage, hasNextStage, isStageComplete, isStageMidpoint } from "./stages";
import type { Direction, GameOverReason, GameResult, GameStatus, PerkChoice, StageClear, WatermelonType } from "./types";

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
const TRASH_BAG_SIZE = 92;
const GOLDEN_WATERMELON_SIZE = 85;
const GOLDEN_WATERMELON_SPAWN_CHANCE = 0.01;
const WATERMELON_Y = [108, 134, 160, 186, 212, 238, 264, 290, 316, 342];
const SORT_TRANSITION_MS = 100;
const MAX_CLAIMS = 3;

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
  private claimShieldUsed = false;
  private godsHandClaimUsed = false;
  private recoveryBonusPending = false;
  private goldenTapCount = 0;
  private musicMuted = false;
  private queue: ConveyorItem[] = [];
  private roundTimer?: Phaser.Time.TimerEvent;
  private watermelonSprites: ConveyorSprite[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private backgroundMusic?: VolumeAdjustableSound;
  private activeItem: ConveyorItem = "good";
  private goldenFeedbackObjects: Phaser.GameObjects.GameObject[] = [];
  private bonusPrompt?: Phaser.GameObjects.Text;

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
    this.load.image("trash-bag", this.assets.trash);
    this.load.image("watermelon-golden", this.assets.golden);
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
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.combo = 0;
    this.stageIndex = 0;
    this.stageProgress = 0;
    this.claims = 0;
    this.selectedPerks = [];
    this.midpointChoiceShown = false;
    this.claimShieldUsed = false;
    this.godsHandClaimUsed = false;
    this.recoveryBonusPending = false;
    this.goldenTapCount = 0;
    this.scoreText?.setText("SCORE 0");
    this.comboText?.setText("COMBO x0");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => this.randomWatermelonType());
    this.createQueueSprites();
    return true;
  }

  choosePerk(perk: string) {
    if (!this.awaitingPerk || hasPerk(this.selectedPerks, perk)) return;
    this.selectedPerks.push(perk);
    if (perk === GODS_HAND) this.godsHandClaimUsed = false;
    if (perk === PREMIUM_DELIVERY_CONTRACT) this.refreshUpcomingQueue();
    if (perk === INSTANT_ALLOWANCE) this.addScore(10);
    this.awaitingPerk = false;
    this.playing = true;
    if (!this.backgroundMusic?.isPlaying) this.backgroundMusic?.play();
    this.emitStatus();
    this.startTimer(true);
  }

  continueToNextStage() {
    if (!this.awaitingStageTransition) return;
    this.awaitingStageTransition = false;
    this.stageIndex += 1;
    this.stageProgress = 0;
    this.midpointChoiceShown = false;
    this.claimShieldUsed = false;
    this.recoveryBonusPending = false;
    this.emitStatus();
    this.requestPerk("start");
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.backgroundMusic?.setVolume?.(muted ? 0 : 0.35);
  }

  tapGolden() {
    if (!this.playing || this.resolved || this.activeType !== "golden") return;
    const points = pointsForGoldenTap(this.score, this.hasGodsHand());
    this.goldenTapCount += 1;
    this.combo += 1;
    this.addScore(points);
    this.comboText?.setText(`COMBO x${this.combo}`);
    this.showGoldenTapFeedback(points);
    this.emitStatus();
  }

  openBonusBox() {
    if (!this.playing || this.activeItem !== "bonus") return;
    this.resolved = true;
    this.advanceQueue();
    this.requestPerk("midpoint");
  }

  sort(direction: Direction) {
    if (!this.playing || this.awaitingPerk) return;
    if (this.activeItem === "bonus") {
      this.openBonusBox();
      return;
    }
    if (this.resolved) return;
    if (this.activeType === "golden") return;
    this.resolved = true;
    this.roundTimer?.remove(false);
    this.sound.play("sorting-effect", { volume: 0.55 });

    if (direction !== expectedDirection(this.activeType)) {
      this.registerClaim();
      return;
    }

    const zeroValueRottenWatermelon = this.activeType === "rotten"
      && (this.hasPremiumDeliveryContract() || this.hasTrashCollector());
    let earnedScore = pointsForCorrectSort(
      this.score,
      this.activeType,
      this.hasPremiumDeliveryContract(),
      this.hasTrashCollector(),
      this.hasGodsHand(),
    );
    this.combo += 1;
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && hasPerk(this.selectedPerks, CLOSING_RUSH)) earnedScore += 1;
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && hasPerk(this.selectedPerks, CONTINUOUS_WORK_ALLOWANCE) && this.combo % 10 === 0) {
      earnedScore += 5;
    }
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && this.recoveryBonusPending) {
      earnedScore += 3;
      this.recoveryBonusPending = false;
    }
    this.addScore(earnedScore);
    this.stageProgress += 1;
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
    if (this.hasGodsHand()) {
      this.godsHandClaimUsed = true;
      this.combo = 0;
      this.comboText?.setText("COMBO x0");
      this.emitStatus();
      this.finish("claims");
      return;
    }
    if (!this.hasGodsHand() && hasPerk(this.selectedPerks, SAFETY_TRAINING) && !this.claimShieldUsed) {
      this.claimShieldUsed = true;
      this.emitStatus();
      this.advanceAndStartNextRound();
      return;
    }
    this.claims += 1;
    this.combo = 0;
    this.recoveryBonusPending = hasPerk(this.selectedPerks, RECOVERY_SUPPORT);
    this.comboText?.setText("COMBO x0");
    this.emitStatus();
    if (this.claims >= this.claimLimit()) {
      this.finish("claims");
      return;
    }
    this.advanceAndStartNextRound();
  }

  private completeStage() {
    if (hasPerk(this.selectedPerks, PERFECT_DELIVERY_BONUS)) this.addScore(20);
    this.emitStatus();
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
      options: getRandomPerks(this.selectedPerks),
    });
  }

  private advanceAndStartNextRound(incomingItem?: ConveyorItem) {
    this.advanceQueue(incomingItem);
    if (this.activeItem === "bonus") {
      this.resolved = false;
      this.showBonusPrompt();
      this.emitStatus();
      return;
    }
    this.time.delayedCall(SORT_TRANSITION_MS, () => {
      if (this.playing) this.startTimer();
    });
  }

  private advanceQueue(incomingItem: ConveyorItem = this.randomWatermelonType()) {
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
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

  private randomWatermelonType(): WatermelonType {
    if (this.hasGoldenWatermelonContract() && Math.random() < GOLDEN_WATERMELON_SPAWN_CHANCE) return "golden";
    if (this.hasTrashCollector() && Math.random() < 0.25) return "trash";
    return randomWatermelonType(Math.random(), this.hasPremiumDeliveryContract() ? 0.75 : 0.5);
  }

  private hasPremiumDeliveryContract(): boolean {
    return hasPremiumDeliveryContract(this.selectedPerks);
  }

  private hasTrashCollector(): boolean {
    return hasPerk(this.selectedPerks, TRASH_COLLECTOR);
  }

  private hasGoldenWatermelonContract(): boolean {
    return hasPerk(this.selectedPerks, GOLDEN_WATERMELON_CONTRACT);
  }

  private hasGodsHand(): boolean {
    return hasPerk(this.selectedPerks, GODS_HAND);
  }

  private claimLimit(): number {
    return this.hasGodsHand() ? 1 : MAX_CLAIMS;
  }

  private displayedClaims(): number {
    return this.hasGodsHand() ? Number(this.godsHandClaimUsed) : this.claims;
  }

  private refreshUpcomingQueue() {
    const activeItem = this.queue[this.queue.length - 1];
    if (!activeItem || activeItem === "bonus") return;
    this.queue = [
      ...Array.from({ length: WATERMELON_Y.length - 1 }, () => this.randomWatermelonType()),
      activeItem,
    ];
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.createQueueSprites();
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
      const textureKey = item === "trash" ? "trash-bag" : `watermelon-${item}`;
      const displaySize = item === "trash" ? TRASH_BAG_SIZE : item === "golden" ? GOLDEN_WATERMELON_SIZE : WATERMELON_SIZE;
      return this.add.image(this.scale.width / 2, y, textureKey)
        .setDisplaySize(displaySize, displaySize);
    }
    const box = this.add.container(this.scale.width / 2, y);
    const boxBody = this.add.rectangle(0, 0, 78, 58, 0xfdf8e7).setStrokeStyle(3, 0x26343d);
    const boxLabel = this.add.text(0, 0, "보너스\n성과급", {
      fontFamily: '"DosStory", monospace', fontSize: "12px", color: "#a85f2d", fontStyle: "bold", align: "center",
    }).setOrigin(0.5);
    box.add([boxBody, boxLabel]);
    return box;
  }

  private startTimer(withoutTimeLimit = false) {
    this.resolved = false;
    this.goldenTapCount = 0;
    if (this.activeType === "golden") this.showGoldenFeedback();
    else this.clearGoldenFeedback();
    this.emitStatus();
    if (withoutTimeLimit && this.activeType !== "golden") return;
    const timeAdjustment =
      (hasPerk(this.selectedPerks, WORK_MANUAL) ? 150 : 0)
      + (hasPerk(this.selectedPerks, CLOSING_RUSH) ? -150 : 0);
    this.roundTimer = this.time.delayedCall(getStage(this.stageIndex).roundLimitMs + timeAdjustment, () => {
      if (this.resolved || !this.playing) return;
      this.resolved = true;
      if (this.activeType === "golden" && this.goldenTapCount > 0) {
        this.advanceAndStartNextRound();
        return;
      }
      this.registerClaim();
    });
  }

  private showGoldenFeedback() {
    this.clearGoldenFeedback();
    const activeSprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!activeSprite) return;
    const aura = this.add.circle(activeSprite.x, activeSprite.y, 48, 0xffcf3f, 0.32).setDepth(10);
    const prompt = this.add.text(activeSprite.x, activeSprite.y + 54, "황금 수박! ↓ 연타!", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#9b6518", fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: aura, alpha: 0.08, scale: 1.25, duration: 420, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: prompt, scale: 1.08, duration: 320, yoyo: true, repeat: -1 });
    this.goldenFeedbackObjects = [aura, prompt];
  }

  private showBonusPrompt() {
    this.clearBonusPrompt();
    const activeSprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!activeSprite) return;
    this.bonusPrompt = this.add.text(activeSprite.x, activeSprite.y + 54, "아무 버튼이나 눌러 수령!", {
      fontFamily: '"DosStory", monospace', fontSize: "16px", color: "#9a5c2f", fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: this.bonusPrompt, scale: 1.08, duration: 360, yoyo: true, repeat: -1 });
  }

  private clearBonusPrompt() {
    if (!this.bonusPrompt) return;
    this.tweens.killTweensOf(this.bonusPrompt);
    this.bonusPrompt.destroy();
    this.bonusPrompt = undefined;
  }

  private showGoldenTapFeedback(points: number) {
    const activeSprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!activeSprite) return;
    const feedback = this.add.text(activeSprite.x, activeSprite.y - 42, `+${points}`, {
      fontFamily: '"DosStory", monospace', fontSize: "20px", color: "#d29118", fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(41);
    this.tweens.add({
      targets: feedback,
      y: feedback.y - 20,
      alpha: 0,
      duration: 360,
      ease: "Sine.easeOut",
      onComplete: () => feedback.destroy(),
    });
  }

  private clearGoldenFeedback() {
    this.goldenFeedbackObjects.forEach((feedback) => {
      this.tweens.killTweensOf(feedback);
      feedback.destroy();
    });
    this.goldenFeedbackObjects = [];
  }

  private getStatus(): GameStatus {
    return {
      stageIndex: this.stageIndex,
      stageProgress: this.stageProgress,
      claims: this.displayedClaims(),
      claimLimit: this.claimLimit(),
      score: this.score,
      combo: this.combo,
      selectedPerks: this.selectedPerks,
      trashCollectorActive: this.hasTrashCollector(),
      goldenWatermelonActive: this.activeType === "golden",
      bonusBoxActive: this.activeItem === "bonus",
    };
  }

  private addScore(points: number) {
    this.score += points;
    this.scoreText?.setText(`SCORE ${this.score}`);
  }

  private emitStatus() {
    this.onStatusChange(this.getStatus());
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.awaitingPerk = false;
    this.awaitingStageTransition = false;
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
    this.roundTimer?.remove(false);
    this.backgroundMusic?.stop();
    this.onGameOver({ ...this.getStatus(), reason });
  }

  private cleanUp() {
    this.playing = false;
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
    this.roundTimer?.remove(false);
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
  }
}
