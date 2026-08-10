import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { saveBestScore } from "./lib/highScore";
import { completeTutorial, hasCompletedTutorial } from "./lib/tutorial";
import { getBrowserLocale, getCopy } from "./lib/i18n";
import { shareScore } from "./lib/shareScore";
import { createFeedbackMailto } from "./lib/feedback";
import { getSettlementComment, type SettlementComment } from "./lib/settlementComment";
import { trackEvent } from "./lib/analytics";
import { calculateClaimDeduction, calculateSettlement, calculateStageSettlement, calculateTakeHomePay, formatWon, getWonPerScore } from "./lib/settlement";
import { getStage } from "./game/stages";
import { GOLDEN_WATERMELON_CONTRACT, getPerkDetails, TRASH_COLLECTOR } from "./game/perks";
import { TUTORIAL_TOTAL } from "./game/tutorial";
import type { Direction, GameClaim, GameResult, GameStatus, PerkChoice, StageClear, TutorialResult } from "./game/types";
import "./App.css";

type Screen = "start" | "countdown" | "tutorial-intro" | "playing" | "perk" | "stage-transition" | "tutorial-result" | "game-over" | "result";
const COUNTDOWN_SECONDS = 3;
const TUTORIAL_INTRO_MS = 1_600;
const GAME_OVER_NOTICE_MS = 1_500;

function App() {
  const [locale] = useState(getBrowserLocale);
  const copy = getCopy(locale);
  const controllerRef = useRef<GameController>(null);
  const homeThemeRef = useRef<HTMLAudioElement | null>(null);
  const runStartedAtRef = useRef<number | null>(null);
  const printedResultRef = useRef<GameResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<GameResult | null>(null);
  const [settlementComment, setSettlementComment] = useState<SettlementComment | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [perkChoice, setPerkChoice] = useState<PerkChoice | null>(null);
  const [perkCursor, setPerkCursor] = useState(0);
  const [stageClear, setStageClear] = useState<StageClear | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [tutorialResult, setTutorialResult] = useState<TutorialResult | null>(null);

  const choosePerk = useCallback((perk: string) => {
    if (perkChoice) {
      trackEvent("perk_selected", {
        stage: perkChoice.stageIndex + 1,
        phase: perkChoice.phase,
        perk,
        score: gameStatus?.score ?? 0,
        combo: gameStatus?.combo ?? 0,
      });
    }
    controllerRef.current?.choosePerk(perk);
    setPerkChoice(null);
    setPerkCursor(0);
    setScreen("playing");
  }, [gameStatus?.combo, gameStatus?.score, perkChoice]);

  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}assets/game/watermelon-theme.mp3`);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.35;
    homeThemeRef.current = audio;

    return () => {
      audio.pause();
      homeThemeRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.documentTitle;
  }, [copy.documentTitle, locale]);

  useEffect(() => {
    const audio = homeThemeRef.current;
    if (!audio) return;

    if (screen !== "start") {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    const playTheme = () => {
      void audio.play().catch(() => {
        // Browsers may block audible autoplay until the first user interaction.
      });
    };

    playTheme();
    window.addEventListener("pointerdown", playTheme, { once: true });
    window.addEventListener("keydown", playTheme, { once: true });

    return () => {
      window.removeEventListener("pointerdown", playTheme);
      window.removeEventListener("keydown", playTheme);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "countdown") return;

    const timer = window.setTimeout(() => {
      if (countdown === 1) {
        setScreen("playing");
        runStartedAtRef.current = Date.now();
        trackEvent("game_started", {
          game_version: import.meta.env.VITE_GAME_VERSION || "local",
          touch_capable: navigator.maxTouchPoints > 0,
        });
        controllerRef.current?.start(false);
        return;
      }
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, screen]);

  useEffect(() => {
    if (screen !== "tutorial-intro") return;

    const timer = window.setTimeout(() => {
      setScreen("playing");
      runStartedAtRef.current = Date.now();
      trackEvent("game_started", {
        game_version: import.meta.env.VITE_GAME_VERSION || "local",
        touch_capable: navigator.maxTouchPoints > 0,
      });
      trackEvent("tutorial_started", { total: TUTORIAL_TOTAL });
      controllerRef.current?.start(true);
    }, TUTORIAL_INTRO_MS);

    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "game-over") return;

    const timer = window.setTimeout(() => setScreen("result"), GAME_OVER_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "result" || isMusicMuted || !result || printedResultRef.current === result) return;

    printedResultRef.current = result;
    controllerRef.current?.playReceiptPrintSound();
  }, [isMusicMuted, result, screen]);

  useEffect(() => {
    if (homeThemeRef.current) homeThemeRef.current.muted = isMusicMuted;
    controllerRef.current?.setMusicMuted(isMusicMuted);
  }, [isMusicMuted]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen === "stage-transition" && event.code === "Space") {
        event.preventDefault();
        continueToNextStage();
        return;
      }
      if (screen === "result" && event.key === "ArrowDown") {
        event.preventDefault();
        resultRef.current?.scrollBy({ top: window.innerHeight * 0.72, behavior: "smooth" });
        return;
      }
      if (screen === "perk" && perkChoice) {
        const optionCount = perkChoice.options.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          setPerkCursor((cursor) => (cursor - 1 + optionCount) % optionCount);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          setPerkCursor((cursor) => (cursor + 1) % optionCount);
          return;
        }
        if (event.code === "Space") {
          event.preventDefault();
          const perk = perkChoice.options[perkCursor];
          if (perk) choosePerk(perk);
        }
        return;
      }
      if (screen !== "playing") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        controllerRef.current?.sort("left");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        controllerRef.current?.sort("right");
      }
      if (event.key === "ArrowDown" && gameStatus?.goldenWatermelonActive) {
        event.preventDefault();
        controllerRef.current?.tapGolden();
      } else if (event.key === "ArrowDown" && gameStatus?.bonusBoxActive) {
        event.preventDefault();
        controllerRef.current?.openBonusBox();
      } else if (event.key === "ArrowDown" && gameStatus?.trashCollectorActive) {
        event.preventDefault();
        controllerRef.current?.sort("center");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choosePerk, gameStatus?.bonusBoxActive, gameStatus?.goldenWatermelonActive, gameStatus?.trashCollectorActive, perkChoice, perkCursor, screen]);

  function startGame() {
    if (result) {
      trackEvent("game_retried", {
        previous_reason: result.reason,
        previous_stage: result.stageIndex + 1,
        previous_score: result.score,
      });
    }
    homeThemeRef.current?.pause();
    if (homeThemeRef.current) homeThemeRef.current.currentTime = 0;
    setResult(null);
    setSettlementComment(null);
    printedResultRef.current = null;
    setGameStatus(null);
    setPerkChoice(null);
    setPerkCursor(0);
    setStageClear(null);
    setShareMessage("");
    setTutorialResult(null);
    const needsTutorial = !hasCompletedTutorial();
    controllerRef.current?.preview();
    setCountdown(COUNTDOWN_SECONDS);
    setScreen(needsTutorial ? "tutorial-intro" : "countdown");
  }

  function handleGameOver(nextResult: GameResult) {
    const durationSeconds = runStartedAtRef.current
      ? Math.max(0, Math.round((Date.now() - runStartedAtRef.current) / 1_000))
      : 0;
    trackEvent("game_finished", {
      reason: nextResult.reason,
      reached_stage: nextResult.stageIndex + 1,
      score: nextResult.score,
      duration_seconds: durationSeconds,
      perks: nextResult.selectedPerks,
    });
    setResult(nextResult);
    setSettlementComment(getSettlementComment(
      calculateTakeHomePay(nextResult.stageScores, nextResult.claims),
      nextResult.selectedPerks,
    ));
    setStageClear(null);
    saveBestScore(nextResult.score);
    setScreen(nextResult.reason === "claims" ? "game-over" : "result");
  }

  function handlePerkChoice(choice: PerkChoice) {
    trackEvent("perk_offered", {
      stage: choice.stageIndex + 1,
      phase: choice.phase,
      options: choice.options,
    });
    setPerkChoice(choice);
    setPerkCursor(0);
    setStageClear(null);
    setScreen("perk");
  }

  function handleStageClear(nextStageClear: StageClear) {
    setStageClear(nextStageClear);
    setPerkChoice(null);
    setScreen("stage-transition");
  }

  function handleClaim(claim: GameClaim) {
    trackEvent("claim_received", {
      stage: claim.stageIndex + 1,
      reason: claim.reason,
      item_type: claim.itemType,
      combo: claim.combo,
      claim_consumed: claim.claimConsumed,
    });
  }

  function handleStageCompleted(status: GameStatus) {
    trackEvent("stage_completed", {
      stage: status.stageIndex + 1,
      score: status.score,
      combo: status.combo,
      claims: status.claims,
    });
  }

  function handleTutorialStepCompleted(completed: number, total: number, firstAttemptCorrect: boolean) {
    trackEvent("tutorial_step_completed", {
      completed,
      total,
      first_attempt_correct: firstAttemptCorrect,
    });
  }

  function handleTutorialResult(nextTutorialResult: TutorialResult) {
    setTutorialResult(nextTutorialResult);
    setScreen("tutorial-result");
  }

  function startRegularShift() {
    if (!tutorialResult) return;
    completeTutorial();
    trackEvent("tutorial_completed", {
      total: tutorialResult.total,
      first_attempt_correct: tutorialResult.firstAttemptCorrect,
    });
    setCountdown(COUNTDOWN_SECONDS);
    setScreen("countdown");
  }

  function continueToNextStage() {
    controllerRef.current?.continueToNextStage();
  }

  function goHome() {
    setResult(null);
    setGameStatus(null);
    setPerkChoice(null);
    setPerkCursor(0);
    setStageClear(null);
    setShareMessage("");
    setTutorialResult(null);
    setScreen("start");
  }

  async function handleShare() {
    if (!result) return;
    const outcome = await shareScore(copy.documentTitle, copy.shareText(result.score));
    if (outcome === "shared" || outcome === "copied") {
      trackEvent("score_shared", {
        score: result.score,
        method: outcome === "shared" ? "native_share" : "clipboard",
      });
    }
    setShareMessage(
      outcome === "shared" ? copy.shared : outcome === "copied" ? copy.copied : copy.sharingUnavailable,
    );
  }

  const sort = (direction: Direction) => controllerRef.current?.sort(direction);
  const toggleMusic = () => setIsMusicMuted((muted) => !muted);
  const trackFeedbackOpened = (source: "home" | "result") => {
    trackEvent("feedback_opened", source === "result" && result
      ? { source, score: result.score, stage: result.stageIndex + 1 }
      : { source });
  };
  const settlementAmount = result ? calculateSettlement(result.stageScores) : 0;
  const claimDeductionAmount = result ? calculateClaimDeduction(result.claims) : 0;
  const takeHomePay = result ? calculateTakeHomePay(result.stageScores, result.claims) : 0;
  const showsGoldenWatermelon = result?.selectedPerks.includes(GOLDEN_WATERMELON_CONTRACT) ?? false;
  const showsTrashBag = result?.selectedPerks.includes(TRASH_COLLECTOR) ?? false;
  const visibleGame = screen === "playing" || screen === "countdown" || screen === "tutorial-intro" || screen === "perk" || screen === "stage-transition" || screen === "tutorial-result" || screen === "game-over";
  const displayedStageIndex = gameStatus?.stageIndex ?? stageClear?.completedStageIndex ?? 0;

  return (
    <main className={`app-shell app-shell-${screen} app-shell-${locale}`}>
      {screen === "start" && (
        <section
          className="market-home"
          aria-labelledby="market-title"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/game/supermarket-home-no-sign-v3.png)` }}
        >
          <h1 id="market-title" className="market-title">
            {copy.marketTitleLines.map((line, lineIndex) => (
              <span className="market-title-line" key={line}>
                {Array.from(line).map((character, characterIndex) => (
                  <span
                    className="market-title-character"
                    key={`${line}-${characterIndex}`}
                    style={{ animationDelay: `${lineIndex * 180 + characterIndex * 80}ms` }}
                  >
                    {character}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <button className="market-start-button" type="button" onClick={startGame}>{copy.startGame}</button>
          <a className="market-feedback-button" href={createFeedbackMailto("home")} onClick={() => trackFeedbackOpened("home")}>
            <span aria-hidden="true">✉</span>
            <span>피드백</span>
          </a>
          <button
            className="market-mute-button"
            type="button"
            aria-label={isMusicMuted ? copy.unmuteMusic : copy.muteMusic}
            aria-pressed={isMusicMuted}
            onClick={toggleMusic}
          >
            <span aria-hidden="true">♪</span>
          </button>
        </section>
      )}

      <section className={`game-area game-area-stage-${displayedStageIndex} ${visibleGame ? "" : "game-area-hidden"}`} aria-label={copy.gameAreaLabel}>
        <GameCanvas
          ref={controllerRef}
          onGameOver={handleGameOver}
          onStatusChange={setGameStatus}
          onPerkChoice={handlePerkChoice}
          onStageClear={handleStageClear}
          onClaim={handleClaim}
          onStageCompleted={handleStageCompleted}
          onTutorialStepCompleted={handleTutorialStepCompleted}
          onTutorialResult={handleTutorialResult}
        />
        <div className="stage-tint" aria-hidden="true" />
        {screen === "countdown" && (
          <div className="game-countdown" aria-label={copy.countdownLabel}>
            <p key={countdown} className="game-countdown-number" aria-live="polite">{countdown}</p>
          </div>
        )}
        {screen === "tutorial-intro" && (
          <div className="tutorial-intro-overlay" aria-live="assertive">
            <p className="tutorial-intro-title">{copy.tutorialIntroTitle}</p>
          </div>
        )}
        {screen === "playing" && (
          <GameControls
            copy={copy}
            onSort={sort}
            onOpenBonusBox={() => controllerRef.current?.openBonusBox()}
            onTapGolden={() => controllerRef.current?.tapGolden()}
            showBonusControl={gameStatus?.bonusBoxActive ?? false}
            showGoldenControl={gameStatus?.goldenWatermelonActive ?? false}
            showTrashControl={gameStatus?.trashCollectorActive ?? false}
          />
        )}
        {screen === "playing" && gameStatus?.tutorial && (
          <aside className="tutorial-guide" aria-live="polite">
            <strong>{gameStatus.tutorial.currentItem === "bonus" ? copy.tutorialBonusTitle : copy.tutorialProgress(gameStatus.tutorial.completed, gameStatus.tutorial.total)}</strong>
            <span>
              {gameStatus.tutorial.currentItem === "bonus"
                ? copy.tutorialBonusGuide
                : gameStatus.tutorial.hadWrongAttempt
                ? copy.tutorialTryAgain
                : gameStatus.tutorial.completed === 0
                  ? copy.tutorialGoodGuide
                  : gameStatus.tutorial.completed === 1
                    ? copy.tutorialRottenGuide
                    : copy.tutorialMixedGuide}
            </span>
          </aside>
        )}
        {gameStatus && (screen === "playing" || screen === "perk" || screen === "stage-transition") && (
          <div className="stage-hud" aria-live="polite">
            <span>STAGE {gameStatus.stageIndex + 1}</span>
            <strong>{getStage(gameStatus.stageIndex).title[locale]}</strong>
            <span>{gameStatus.stageProgress} / {getStage(gameStatus.stageIndex).target}</span>
            <span>누적 클레임 {gameStatus.claims}회</span>
          </div>
        )}
        {screen === "stage-transition" && stageClear && (
          <div className="stage-clear-overlay" role="dialog" aria-modal="true" aria-labelledby="stage-clear-title">
            <section className="stage-clear-card">
              <p>STAGE {stageClear.completedStageIndex + 1} DELIVERY COMPLETE</p>
              <h2 id="stage-clear-title">{getStage(stageClear.completedStageIndex).title[locale]} 완료!</h2>
              <dl>
                <div><dt>납품</dt><dd>{stageClear.status.stageProgress} / {getStage(stageClear.completedStageIndex).target}</dd></div>
                <div><dt>점수</dt><dd>{stageClear.status.score}</dd></div>
              </dl>
              <span>다음 근무: {getStage(stageClear.completedStageIndex + 1).title[locale]}</span>
              <button type="button" onClick={continueToNextStage} aria-label="다음 스테이지로 이동 (Space 키)">
                다음 스테이지로 <small>Space</small>
              </button>
            </section>
          </div>
        )}
        {screen === "perk" && perkChoice && (
          <div className="perk-choice-overlay" role="dialog" aria-modal="true" aria-labelledby="perk-choice-title">
            <section className="perk-choice-card">
              <p>STAGE {perkChoice.stageIndex + 1} · {getStage(perkChoice.stageIndex).title[locale]}</p>
              <h2 id="perk-choice-title">보너스 성과급 선택</h2>
              <span>{perkChoice.phase === "tutorial" ? "성과급 보너스 상자가 도착했습니다" : perkChoice.phase === "start" ? "성과급 상자가 도착했습니다" : "중간 성과급 상자가 도착했습니다"}</span>
              <em className="perk-choice-keyboard-hint">{perkChoice.phase === "tutorial" ? copy.tutorialPerkSelectionGuide : "첫 분류 시간 제한 없음 · ↑↓ 이동 · Space 선택"}</em>
              <div className="perk-choice-options">
                {perkChoice.options.map((perk, index) => (
                  <button
                    type="button"
                    key={perk}
                    aria-pressed={perkCursor === index}
                    className={perkCursor === index ? "perk-choice-selected" : ""}
                    onClick={() => choosePerk(perk)}
                  >
                    {perkCursor === index && <b className="perk-choice-pointer" aria-hidden="true">▶</b>}
                    <strong>{perk}</strong>
                    <small>
                      {getPerkDetails(perk).map((detail) => <span key={detail}>{detail}</span>)}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
        {screen === "tutorial-result" && tutorialResult && (
          <div className="tutorial-result-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-result-title">
            <section className="tutorial-result-card">
              <p>TRAINING COMPLETE</p>
              <h2 id="tutorial-result-title">{copy.tutorialResultTitle}</h2>
              <strong>{copy.tutorialResultComplete(tutorialResult.total)}</strong>
              <span>{copy.tutorialResultAccuracy(tutorialResult.firstAttemptCorrect, tutorialResult.total)}</span>
              <em>{copy.tutorialResultMessage}</em>
              <small>{copy.tutorialTraitGuide}</small>
              <button type="button" onClick={startRegularShift}>{copy.tutorialContinue}</button>
            </section>
          </div>
        )}
        {screen === "game-over" && result && (
          <div className="game-over-overlay" role="status" aria-live="assertive">
            <section className="game-over-card">
              <p>CUSTOMER COMPLAINT SURGE</p>
              <h2>고객 불만 폭주!</h2>
              <strong>클레임 {result.claims}회를 받았습니다</strong>
              <span>노동 결과 영수증을 출력합니다...</span>
            </section>
          </div>
        )}
      </section>

      {screen === "result" && result && (
        <section className="market-result" aria-label={copy.resultLabel}>
          <div ref={resultRef} className="market-result-scrollable">
            <header className="settlement-header">
              <p>수박수박수박박수박 마트</p>
              <h1>{copy.resultLabel}</h1>
              <span>근무 정산 영수증</span>
            </header>
            <p className="market-result-scroll-hint" aria-label="아래로 스크롤하거나 아래 방향키를 눌러 영수증 전체 보기">
              <span aria-hidden="true">↓</span> 아래로 스크롤해 전체 보기 <kbd>↓</kbd><b>키</b>
            </p>
            <section className="settlement-receipt" aria-label="급여 명세서">
              <p className="settlement-receipt-eyebrow">WORK SETTLEMENT</p>
              <p className="market-result-reason">{result.reason === "complete" ? "정산 완료!" : "중도 정산 · 클레임 누적"}</p>
              <dl className="settlement-breakdown">
                <div><dt>분류 성과</dt><dd>{copy.score(result.score)}</dd></div>
                <div><dt>환산 단가</dt><dd>스테이지별 차등 적용</dd></div>
                <div><dt>분류 수당</dt><dd>{formatWon(settlementAmount)}</dd></div>
                <div><dt>클레임 공제 ({result.claims}회)</dt><dd className="settlement-claim-deduction">- {formatWon(claimDeductionAmount)}</dd></div>
                <div className="settlement-total"><dt>이번 근무 실수령</dt><dd>{formatWon(takeHomePay)}</dd></div>
              </dl>
              <ul className="settlement-stage-wages" aria-label="스테이지별 분류 수당">
                {result.stageScores.slice(0, result.stageIndex + 1).map((stageScore, stageIndex) => (
                  <li key={stageIndex}>
                    <span>STAGE {stageIndex + 1}</span>
                    <span>{stageScore}점 × {formatWon(getWonPerScore(stageIndex))}</span>
                    <strong>{formatWon(calculateStageSettlement(stageScore, stageIndex))}</strong>
                  </li>
                ))}
              </ul>
              <p className="market-result-stage">도달 스테이지 {result.stageIndex + 1} · 선택 특성 {result.selectedPerks.length}개</p>
            </section>

            {settlementComment && (
              <section className="settlement-comment" aria-labelledby="settlement-comment-title">
                <p>{settlementComment.label}</p>
                <h2 id="settlement-comment-title">{settlementComment.title}</h2>
                <strong>{settlementComment.summary}</strong>
                <span>{settlementComment.detail}</span>
                {settlementComment.perkHighlight && <small>{settlementComment.perkHighlight}</small>}
                <em>{settlementComment.closing}</em>
              </section>
            )}

            <section className="settlement-perks" aria-labelledby="settlement-perks-title">
              <p>오늘의 운영 지시</p>
              <h2 id="settlement-perks-title">선택한 특성</h2>
              {result.selectedPerks.length > 0 ? (
                <ul>
                  {result.selectedPerks.map((perk) => (
                    <li key={perk}>
                      <strong>{perk}</strong>
                      {getPerkDetails(perk).map((detail) => (
                        <span key={detail}>{detail}</span>
                      ))}
                      {getPerkDetails(perk).length === 0 && <span>이번 근무에 적용됨</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="settlement-perks-empty">선택한 특성이 없습니다.</span>
              )}
            </section>

            <section className="settlement-items" aria-labelledby="settlement-items-title">
              <p>오늘의 분류 실적</p>
              <h2 id="settlement-items-title">처리한 품목</h2>
              <dl>
                <div><dt>정상 수박</dt><dd>{result.sortedCounts.good}개</dd></div>
                <div><dt>썩은 수박</dt><dd>{result.sortedCounts.rotten}개</dd></div>
                {showsGoldenWatermelon && <div><dt>황금 수박</dt><dd>{result.sortedCounts.golden}개</dd></div>}
                {showsTrashBag && <div><dt>쓰레기봉투</dt><dd>{result.sortedCounts.trash}개</dd></div>}
              </dl>
            </section>
          </div>

          <footer className="market-result-footer">
            {shareMessage && <p className="market-result-share-message" role="status">{shareMessage}</p>}
            <div className="market-result-actions">
              <button type="button" onClick={startGame}>{copy.retry}</button>
              <button type="button" onClick={handleShare}>{copy.share}</button>
              <button type="button" onClick={goHome}>{copy.home}</button>
            </div>
            <a className="market-result-feedback" href={createFeedbackMailto("result", result)} onClick={() => trackFeedbackOpened("result")}>
              <span aria-hidden="true">✉</span>
              게임 피드백 보내기
            </a>
          </footer>
        </section>
      )}
    </main>
  );
}

export default App;
