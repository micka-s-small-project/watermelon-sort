import Phaser from "phaser";
import { recordClaimHistory } from "./claims";
import {
  BOSS_SON,
  CLOSING_RUSH,
  CLOSING_SETTLEMENT_CONTRACT,
  CONTINUOUS_DELIVERY_CONTRACT,
  CONTINUOUS_WORK_ALLOWANCE,
  DEFECTIVE_RECYCLING_CONTRACT,
  GOLDEN_WATERMELON_CONTRACT,
  GODS_HAND,
  EARTHQUAKE_DISASTER,
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
import { createSortedCounts, recordSortedItem } from "./sortedCounts";
import { getStage, hasNextStage, isStageComplete, isStageMidpoint } from "./stages";
import { getStageBackgroundAssetKey, getStageMusicAssetKey, STAGE_BACKGROUND_ASSET_KEYS } from "./stageAssets";
import { TUTORIAL_SEQUENCE, TUTORIAL_TOTAL, TUTORIAL_WATERMELONS } from "./tutorial";
import type { Direction, GameClaim, GameOverReason, GameResult, GameStatus, PerkChoice, StageClear, TutorialResult, WatermelonType } from "./types";

type GameAssets = {
  backgrounds: readonly [string, string, string];
  good: string;
  rotten: string;
  trash: string;
  golden: string;
  theme: string;
  marketTheme: string;
  supermarketTheme: string;
  sortEffect: string;
  receiptPrint: string;
};

type SceneOptions = {
  assets: GameAssets;
  onGameOver: (result: GameResult) => void;
  onStatusChange: (status: GameStatus) => void;
  onPerkChoice: (choice: PerkChoice) => void;
  onStageClear: (stageClear: StageClear) => void;
  onClaim: (claim: GameClaim) => void;
  onStageCompleted: (status: GameStatus) => void;
  onTutorialStepCompleted: (completed: number, total: number, firstAttemptCorrect: boolean) => void;
  onTutorialResult: (result: TutorialResult) => void;
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
const EARTHQUAKE_NORMAL_MS = 5_000;
const EARTHQUAKE_DURATION_MS = 1_250;
const EARTHQUAKE_CAMERA_INTENSITY = 0.02;
const BACKGROUND_MUSIC_VOLUME = 0.35;
const MARKET_MUSIC_VOLUME = 0.7;
const SUPERMARKET_MUSIC_VOLUME = 0.7;

export class GameScene extends Phaser.Scene {
  private readonly assets: GameAssets;
  private readonly onGameOver: (result: GameResult) => void;
  private readonly onStatusChange: (status: GameStatus) => void;
  private readonly onPerkChoice: (choice: PerkChoice) => void;
  private readonly onStageClear: (stageClear: StageClear) => void;
  private readonly onClaim: (claim: GameClaim) => void;
  private readonly onStageCompleted: (status: GameStatus) => void;
  private readonly onTutorialStepCompleted: (completed: number, total: number, firstAttemptCorrect: boolean) => void;
  private readonly onTutorialResult: (result: TutorialResult) => void;
  private readonly onReady: () => void;
  private score = 0;
  private stageScores = [0, 0, 0];
  private combo = 0;
  private stageIndex = 0;
  private stageProgress = 0;
  private claims = 0;
  private claimHistory = 0;
  private stageScoreStart = 0;
  private stageHadClaim = false;
  private closingSettlementActive = true;
  private bossSonStageIndex?: number;
  private earthquakeActive = false;
  private reduceMotion = false;
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
  private sortedCounts = createSortedCounts();
  private musicMuted = false;
  private queue: ConveyorItem[] = [];
  private roundTimer?: Phaser.Time.TimerEvent;
  private watermelonSprites: ConveyorSprite[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private claimText?: Phaser.GameObjects.Text;
  private backgroundImage?: Phaser.GameObjects.Image;
  private backgroundMusic?: VolumeAdjustableSound;
  private marketMusic?: VolumeAdjustableSound;
  private supermarketMusic?: VolumeAdjustableSound;
  private receiptPrintSound?: Phaser.Sound.BaseSound;
  private activeItem: ConveyorItem = "good";
  private goldenFeedbackObjects: Phaser.GameObjects.GameObject[] = [];
  private bonusPrompt?: Phaser.GameObjects.Text;
  private earthquakeOverlay?: Phaser.GameObjects.Rectangle;
  private earthquakeCycleTimer?: Phaser.Time.TimerEvent;
  private tutorialActive = false;
  private tutorialResultPending = false;
  private tutorialIndex = 0;
  private tutorialCompletedWatermelons = 0;
  private tutorialFirstAttemptCorrect = 0;
  private tutorialAttemptedCurrent = false;
  private tutorialPerkPending = false;

  constructor(options: SceneOptions) {
    super("watermelon-game");
    this.assets = options.assets;
    this.onGameOver = options.onGameOver;
    this.onStatusChange = options.onStatusChange;
    this.onPerkChoice = options.onPerkChoice;
    this.onStageClear = options.onStageClear;
    this.onClaim = options.onClaim;
    this.onStageCompleted = options.onStageCompleted;
    this.onTutorialStepCompleted = options.onTutorialStepCompleted;
    this.onTutorialResult = options.onTutorialResult;
    this.onReady = options.onReady;
  }

  preload() {
    this.assets.backgrounds.forEach((background, stageIndex) => {
      this.load.image(getStageBackgroundAssetKey(stageIndex), background);
    });
    this.load.image("watermelon-good", this.assets.good);
    this.load.image("watermelon-rotten", this.assets.rotten);
    this.load.image("trash-bag", this.assets.trash);
    this.load.image("watermelon-golden", this.assets.golden);
    this.load.audio("watermelon-theme", this.assets.theme);
    this.load.audio("market-theme", this.assets.marketTheme);
    this.load.audio("supermarket-theme", this.assets.supermarketTheme);
    this.load.audio("sorting-effect", this.assets.sortEffect);
    this.load.audio("receipt-print", this.assets.receiptPrint);
  }

  create() {
    const { width, height } = this.scale;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);
    this.reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.backgroundImage = this.add.image(width / 2, height / 2, STAGE_BACKGROUND_ASSET_KEYS[0]).setDisplaySize(width, height);
    this.earthquakeOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x8d6548, 0)
      .setDepth(19)
      .setScrollFactor(0);
    this.scoreText = this.add.text(76, 300, "SCORE 0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#26733a", fontStyle: "bold",
      align: "center", stroke: "#ffffff", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.comboText = this.add.text(width - 76, 300, "COMBO x0", {
      fontFamily: '"DosStory", monospace', fontSize: "18px", color: "#b55b2d", fontStyle: "bold",
      align: "center", stroke: "#ffffff", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.claimText = this.add.text(82, 74, "클레임 ♥ ♥ ♥", {
      fontFamily: '"DosStory", monospace', fontSize: "16px", color: "#bd3145", fontStyle: "bold",
      align: "center", stroke: "#ffffff", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setResolution(textResolution);
    this.backgroundMusic = this.sound.add("watermelon-theme", {
      loop: true, volume: this.musicMuted ? 0 : BACKGROUND_MUSIC_VOLUME,
    }) as VolumeAdjustableSound;
    this.marketMusic = this.sound.add("market-theme", {
      loop: true, volume: this.musicMuted ? 0 : MARKET_MUSIC_VOLUME,
    }) as VolumeAdjustableSound;
    this.supermarketMusic = this.sound.add("supermarket-theme", {
      loop: true, volume: this.musicMuted ? 0 : SUPERMARKET_MUSIC_VOLUME,
    }) as VolumeAdjustableSound;
    this.receiptPrintSound = this.sound.add("receipt-print", { volume: 0.7 });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
    this.ready = true;
    this.onReady();
  }

  begin(showTutorial = false): boolean {
    if (!this.ready) return false;
    this.preview();
    this.emitStatus();
    if (showTutorial) {
      this.startTutorial();
      return true;
    }
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
    this.stopEarthquakeCycle();
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.score = 0;
    this.stageScores = [0, 0, 0];
    this.combo = 0;
    this.stageIndex = 0;
    this.updateStageBackground();
    this.backgroundMusic?.stop();
    this.marketMusic?.stop();
    this.supermarketMusic?.stop();
    this.stageProgress = 0;
    this.claims = 0;
    this.claimHistory = 0;
    this.stageScoreStart = 0;
    this.stageHadClaim = false;
    this.closingSettlementActive = true;
    this.bossSonStageIndex = undefined;
    this.selectedPerks = [];
    this.midpointChoiceShown = false;
    this.claimShieldUsed = false;
    this.godsHandClaimUsed = false;
    this.recoveryBonusPending = false;
    this.goldenTapCount = 0;
    this.sortedCounts = createSortedCounts();
    this.tutorialActive = false;
    this.tutorialResultPending = false;
    this.tutorialIndex = 0;
    this.tutorialCompletedWatermelons = 0;
    this.tutorialFirstAttemptCorrect = 0;
    this.tutorialAttemptedCurrent = false;
    this.tutorialPerkPending = false;
    this.scoreText?.setText("SCORE 0");
    this.comboText?.setText("COMBO x0");
    this.updateClaimDisplay();
    this.prepareRegularQueue();
    return true;
  }

  choosePerk(perk: string) {
    if (!this.awaitingPerk || hasPerk(this.selectedPerks, perk)) return;
    if (this.tutorialActive && this.tutorialPerkPending) {
      this.applyPerk(perk);
      this.tutorialPerkPending = false;
      this.awaitingPerk = false;
      this.resolved = false;
      this.playing = true;
      this.prepareRemainingTutorialQueue();
      this.emitStatus();
      return;
    }
    this.applyPerk(perk);
    this.tutorialActive = false;
    this.awaitingPerk = false;
    this.playing = true;
    if (this.hasEarthquakeContract()) this.startEarthquakeCycle();
    this.playStageMusic();
    this.emitStatus();
    this.startTimer(true);
  }

  continueToNextStage() {
    if (!this.awaitingStageTransition) return;
    this.awaitingStageTransition = false;
    this.stageIndex += 1;
    this.updateStageBackground();
    this.playStageMusic();
    this.stageProgress = 0;
    this.stageScoreStart = this.score;
    this.stageHadClaim = false;
    this.closingSettlementActive = true;
    this.midpointChoiceShown = false;
    this.claimShieldUsed = false;
    this.recoveryBonusPending = false;
    this.emitStatus();
    this.requestPerk("start");
  }

  private updateStageBackground() {
    this.backgroundImage?.setTexture(getStageBackgroundAssetKey(this.stageIndex));
  }

  private playStageMusic() {
    const activeMusic = {
      "watermelon-theme": this.backgroundMusic,
      "market-theme": this.marketMusic,
      "supermarket-theme": this.supermarketMusic,
    }[getStageMusicAssetKey(this.stageIndex)];
    [this.backgroundMusic, this.marketMusic, this.supermarketMusic]
      .filter((music) => music !== activeMusic)
      .forEach((music) => music?.stop());
    if (!activeMusic?.isPlaying) activeMusic?.play();
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.backgroundMusic?.setVolume?.(muted ? 0 : BACKGROUND_MUSIC_VOLUME);
    this.marketMusic?.setVolume?.(muted ? 0 : MARKET_MUSIC_VOLUME);
    this.supermarketMusic?.setVolume?.(muted ? 0 : SUPERMARKET_MUSIC_VOLUME);
  }

  playReceiptPrintSound() {
    if (this.musicMuted) return;
    this.receiptPrintSound?.stop();
    this.receiptPrintSound?.play();
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
    if (this.tutorialActive && this.activeItem === "bonus") {
      this.openTutorialBonusBox();
      return;
    }
    if (!this.playing || this.activeItem !== "bonus") return;
    this.resolved = true;
    this.advanceQueue();
    this.requestPerk("midpoint");
  }

  sort(direction: Direction) {
    if (!this.playing || this.awaitingPerk) return;
    if (this.tutorialActive) {
      this.sortTutorial(direction);
      return;
    }
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
      this.registerClaim("wrong_direction");
      return;
    }

    this.combo += 1;
    const zeroValueRottenWatermelon = this.activeType === "rotten"
      && (this.hasPremiumDeliveryContract() || this.hasTrashCollector())
      && !this.hasDefectiveRecyclingContract();
    const closingSettlementApplies = this.hasClosingSettlementContract()
      && this.closingSettlementActive
      && this.isClosingSettlementWindow();
    let earnedScore = pointsForCorrectSort(
      this.score,
      this.activeType,
      this.hasPremiumDeliveryContract(),
      this.hasTrashCollector(),
      this.hasGodsHand(),
      this.hasDefectiveRecyclingContract(),
      this.hasContinuousDeliveryContract() && this.combo >= 20,
      closingSettlementApplies,
      this.hasEarthquakeEffect(),
    );
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && hasPerk(this.selectedPerks, CLOSING_RUSH)) earnedScore += 1;
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && hasPerk(this.selectedPerks, CONTINUOUS_WORK_ALLOWANCE) && this.combo % 10 === 0) {
      earnedScore += 5;
    }
    if (!zeroValueRottenWatermelon && !this.hasGodsHand() && this.recoveryBonusPending) {
      earnedScore += 3;
      this.recoveryBonusPending = false;
    }
    this.addScore(earnedScore);
    this.sortedCounts = recordSortedItem(this.sortedCounts, this.activeType);
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

  private startTutorial() {
    this.tutorialActive = true;
    this.tutorialIndex = 0;
    this.tutorialCompletedWatermelons = 0;
    this.tutorialFirstAttemptCorrect = 0;
    this.tutorialAttemptedCurrent = false;
    this.playing = true;
    this.prepareTutorialQueue();
    this.emitStatus();
  }

  private sortTutorial(direction: Direction) {
    const tutorialItem = TUTORIAL_SEQUENCE[this.tutorialIndex];
    if (!tutorialItem || this.resolved) return;
    if (tutorialItem === "bonus") {
      this.openTutorialBonusBox();
      return;
    }
    if (direction !== expectedDirection(tutorialItem)) {
      this.tutorialAttemptedCurrent = true;
      this.emitStatus();
      return;
    }

    const firstAttemptCorrect = !this.tutorialAttemptedCurrent;
    if (firstAttemptCorrect) this.tutorialFirstAttemptCorrect += 1;
    this.tutorialIndex += 1;
    this.tutorialCompletedWatermelons += 1;
    this.onTutorialStepCompleted(this.tutorialCompletedWatermelons, TUTORIAL_TOTAL, firstAttemptCorrect);

    this.tutorialAttemptedCurrent = false;
    if (this.tutorialCompletedWatermelons === TUTORIAL_TOTAL) {
      this.resolved = true;
      this.playing = false;
      this.tutorialResultPending = true;
      this.emitStatus();
      this.onTutorialResult(this.getTutorialResult());
      return;
    }

    this.advanceTutorialWatermelon();
  }

  private openTutorialBonusBox() {
    if (this.resolved || TUTORIAL_SEQUENCE[this.tutorialIndex] !== "bonus") return;
    this.tutorialIndex += 1;
    this.tutorialAttemptedCurrent = false;
    this.tutorialPerkPending = true;
    this.requestPerk("tutorial");
  }

  private applyPerk(perk: string) {
    this.selectedPerks.push(perk);
    if (perk === GODS_HAND) this.godsHandClaimUsed = false;
    if (perk === BOSS_SON) this.bossSonStageIndex = this.stageIndex;
    if (perk === PREMIUM_DELIVERY_CONTRACT) this.refreshUpcomingQueue();
    if (perk === INSTANT_ALLOWANCE) this.addScore(10);
  }

  private prepareTutorialQueue() {
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.queue = [...TUTORIAL_WATERMELONS].reverse();
    this.createQueueSprites();
    this.insertTutorialBonusBox(this.queue.length - 6);
    this.resolved = false;
  }

  private advanceTutorialWatermelon() {
    this.resolved = true;
    this.advanceQueue();
    this.emitStatus();
    this.time.delayedCall(SORT_TRANSITION_MS, () => {
      if (!this.tutorialActive || this.tutorialResultPending) return;
      this.resolved = false;
      this.emitStatus();
    });
  }

  private insertTutorialBonusBox(boxIndex: number) {
    const previousSprite = this.watermelonSprites[boxIndex];
    if (boxIndex < 0 || !previousSprite) return;
    this.queue[boxIndex] = "bonus";
    previousSprite.destroy();
    this.watermelonSprites[boxIndex] = this.createConveyorSprite("bonus", WATERMELON_Y[boxIndex]).setDepth(boxIndex + 2);
  }

  private prepareRemainingTutorialQueue() {
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    const remainingWatermelons = TUTORIAL_SEQUENCE
      .slice(this.tutorialIndex)
      .filter((item) => item !== "bonus");
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => "good" as ConveyorItem);
    remainingWatermelons.forEach((item, index) => {
      this.queue[this.queue.length - 1 - index] = item;
    });
    this.createQueueSprites();
    this.activeItem = this.queue[this.queue.length - 1];
    this.activeType = this.activeItem as WatermelonType;
  }

  private prepareRegularQueue() {
    this.watermelonSprites.forEach((sprite) => sprite.destroy());
    this.watermelonSprites = [];
    this.queue = Array.from({ length: WATERMELON_Y.length }, () => this.randomWatermelonType());
    this.createQueueSprites();
  }

  private getTutorialResult(): TutorialResult {
    return { total: TUTORIAL_TOTAL, firstAttemptCorrect: this.tutorialFirstAttemptCorrect };
  }

  private registerClaim(reason: GameClaim["reason"]) {
    const bossSonPardon = this.hasBossSonPardon();
    if (!bossSonPardon) {
      this.stageHadClaim = true;
      if (this.isClosingSettlementWindow()) this.closingSettlementActive = false;
    }
    const claimConsumed = !bossSonPardon
      && (this.hasGodsHand() || !hasPerk(this.selectedPerks, SAFETY_TRAINING) || this.claimShieldUsed);
    this.claimHistory = recordClaimHistory(this.claimHistory, claimConsumed);
    this.showClaimFeedback(claimConsumed, bossSonPardon ? "사장님네 아들 봐줌!" : undefined);
    this.onClaim({ stageIndex: this.stageIndex, reason, itemType: this.activeType, combo: this.combo, claimConsumed });
    if (bossSonPardon) {
      this.emitStatus();
      this.advanceAndStartNextRound();
      return;
    }
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
    this.stopEarthquakeCycle();
    if (hasPerk(this.selectedPerks, PERFECT_DELIVERY_BONUS) && !this.stageHadClaim) {
      this.addScore(Math.floor((this.score - this.stageScoreStart) * 0.5));
    }
    this.emitStatus();
    this.onStageCompleted(this.getStatus());
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
    if (this.hasEarthquakeContract()) this.stopEarthquakeCycle();
    const options = getRandomPerks(
      this.selectedPerks,
      Math.random,
      3,
        phase === "midpoint" ? [PERFECT_DELIVERY_BONUS, BOSS_SON, EARTHQUAKE_DISASTER] : [],
    );
    this.onPerkChoice({
      stageIndex: this.stageIndex,
      phase,
      options,
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

  private hasContinuousDeliveryContract(): boolean {
    return hasPerk(this.selectedPerks, CONTINUOUS_DELIVERY_CONTRACT);
  }

  private hasClosingSettlementContract(): boolean {
    return hasPerk(this.selectedPerks, CLOSING_SETTLEMENT_CONTRACT);
  }

  private hasDefectiveRecyclingContract(): boolean {
    return hasPerk(this.selectedPerks, DEFECTIVE_RECYCLING_CONTRACT);
  }

  private hasEarthquakeContract(): boolean {
    return hasPerk(this.selectedPerks, EARTHQUAKE_DISASTER);
  }

  private hasBossSonPardon(): boolean {
    return this.bossSonStageIndex === this.stageIndex;
  }

  private hasEarthquakeEffect(): boolean {
    return this.earthquakeActive && this.hasEarthquakeContract();
  }

  private startEarthquakeCycle() {
    this.stopEarthquakeCycle();
    this.earthquakeCycleTimer = this.time.delayedCall(EARTHQUAKE_NORMAL_MS, () => this.activateEarthquake());
  }

  private activateEarthquake() {
    if (!this.hasEarthquakeContract() || !this.playing) return;
    this.earthquakeActive = true;
    this.earthquakeOverlay?.setAlpha(0.24);
    if (!this.reduceMotion) this.cameras.main.shake(EARTHQUAKE_DURATION_MS, EARTHQUAKE_CAMERA_INTENSITY, true);
    this.showEarthquakeFeedback();
    this.earthquakeCycleTimer = this.time.delayedCall(EARTHQUAKE_DURATION_MS, () => {
      this.earthquakeActive = false;
      this.earthquakeOverlay?.setAlpha(0);
      if (this.hasEarthquakeContract() && this.playing) {
        this.earthquakeCycleTimer = this.time.delayedCall(EARTHQUAKE_NORMAL_MS, () => this.activateEarthquake());
      }
    });
  }

  private stopEarthquakeCycle() {
    this.earthquakeCycleTimer?.remove(false);
    this.earthquakeCycleTimer = undefined;
    this.earthquakeActive = false;
    this.earthquakeOverlay?.setAlpha(0);
    this.cameras.main?.resetFX();
  }

  private showEarthquakeFeedback() {
    const feedback = this.add.text(this.scale.width / 2, 214, "지진 발생! ×3", {
      fontFamily: '"DosStory", monospace', fontSize: "19px", color: "#9a4d26", fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(45);
    this.tweens.add({
      targets: feedback,
      y: feedback.y - 18,
      alpha: 0,
      duration: EARTHQUAKE_DURATION_MS,
      ease: "Sine.easeOut",
      onComplete: () => feedback.destroy(),
    });
  }

  private isClosingSettlementWindow(): boolean {
    return this.stageProgress >= getStage(this.stageIndex).target - 15;
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
        this.sortedCounts = recordSortedItem(this.sortedCounts, "golden");
        this.emitStatus();
        this.advanceAndStartNextRound();
        return;
      }
      this.registerClaim("timeout");
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

  private showClaimFeedback(claimConsumed: boolean, protectedMessage?: string) {
    const activeSprite = this.watermelonSprites[this.watermelonSprites.length - 1];
    if (!activeSprite) return;
    const feedbackColor = claimConsumed ? "#d3344b" : "#287d9b";
    const feedback = this.add.text(activeSprite.x, activeSprite.y - 42, claimConsumed ? "♥ -1" : protectedMessage ?? "보호막 방어!", {
      fontFamily: '"DosStory", monospace', fontSize: claimConsumed ? "24px" : "17px",
      color: feedbackColor, fontStyle: "bold",
      stroke: "#ffffff", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(42);
    const flash = this.add.circle(activeSprite.x, activeSprite.y, 44, claimConsumed ? 0xd3344b : 0x287d9b, 0.34).setDepth(11);
    this.tweens.add({
      targets: [feedback, flash],
      y: "-=26",
      alpha: 0,
      duration: 520,
      ease: "Sine.easeOut",
      onComplete: () => {
        feedback.destroy();
        flash.destroy();
      },
    });
    this.tweens.add({ targets: activeSprite, x: activeSprite.x - 8, duration: 55, yoyo: true, repeat: 3 });
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
      claims: this.claimHistory,
      claimLimit: this.claimLimit(),
      score: this.score,
      stageScores: [...this.stageScores],
      combo: this.combo,
      sortedCounts: { ...this.sortedCounts },
      selectedPerks: this.selectedPerks,
      trashCollectorActive: this.hasTrashCollector(),
      goldenWatermelonActive: this.activeType === "golden",
      bonusBoxActive: this.activeItem === "bonus",
      tutorial: this.tutorialActive && !this.tutorialResultPending
        ? {
            completed: this.tutorialCompletedWatermelons,
            total: TUTORIAL_TOTAL,
            currentItem: TUTORIAL_SEQUENCE[this.tutorialIndex] ?? "good",
            firstAttemptCorrect: this.tutorialFirstAttemptCorrect,
            hadWrongAttempt: this.tutorialAttemptedCurrent,
          }
        : undefined,
    };
  }

  private addScore(points: number) {
    this.score += points;
    this.stageScores[this.stageIndex] += points;
    this.scoreText?.setText(`SCORE ${this.score}`);
  }

  private emitStatus() {
    this.updateClaimDisplay();
    this.onStatusChange(this.getStatus());
  }

  private updateClaimDisplay() {
    const claimLimit = this.claimLimit();
    const remainingClaims = Math.max(claimLimit - this.displayedClaims(), 0);
    const hearts = Array.from({ length: claimLimit }, (_, index) => (index < remainingClaims ? "♥" : "♡")).join(" ");
    this.claimText?.setText(`클레임 ${hearts}`);
  }

  private finish(reason: GameOverReason) {
    this.playing = false;
    this.awaitingPerk = false;
    this.awaitingStageTransition = false;
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
    this.stopEarthquakeCycle();
    this.roundTimer?.remove(false);
    this.backgroundMusic?.stop();
    this.marketMusic?.stop();
    this.supermarketMusic?.stop();
    this.onGameOver({ ...this.getStatus(), reason });
  }

  private cleanUp() {
    this.playing = false;
    this.clearGoldenFeedback();
    this.clearBonusPrompt();
    this.stopEarthquakeCycle();
    this.roundTimer?.remove(false);
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
    this.marketMusic?.destroy();
    this.marketMusic = undefined;
    this.supermarketMusic?.destroy();
    this.supermarketMusic = undefined;
    this.receiptPrintSound?.stop();
    this.receiptPrintSound?.destroy();
    this.receiptPrintSound = undefined;
  }
}
