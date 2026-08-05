import { useEffect, useRef, useState } from "react";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { saveBestScore } from "./lib/highScore";
import { getBrowserLocale, getCopy } from "./lib/i18n";
import { shareScore } from "./lib/shareScore";
import { getStage } from "./game/stages";
import { getPerkDetails } from "./game/perks";
import type { Direction, GameResult, GameStatus, PerkChoice, StageClear } from "./game/types";
import "./App.css";

type Screen = "start" | "countdown" | "playing" | "perk" | "stage-transition" | "result";
const COUNTDOWN_SECONDS = 3;

function App() {
  const [locale] = useState(getBrowserLocale);
  const copy = getCopy(locale);
  const controllerRef = useRef<GameController>(null);
  const homeThemeRef = useRef<HTMLAudioElement | null>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [perkChoice, setPerkChoice] = useState<PerkChoice | null>(null);
  const [stageClear, setStageClear] = useState<StageClear | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [isMusicMuted, setIsMusicMuted] = useState(false);

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
        controllerRef.current?.start();
        return;
      }
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, screen]);

  useEffect(() => {
    if (homeThemeRef.current) homeThemeRef.current.muted = isMusicMuted;
    controllerRef.current?.setMusicMuted(isMusicMuted);
  }, [isMusicMuted]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
  }, [gameStatus?.bonusBoxActive, gameStatus?.goldenWatermelonActive, gameStatus?.trashCollectorActive, screen]);

  function startGame() {
    homeThemeRef.current?.pause();
    if (homeThemeRef.current) homeThemeRef.current.currentTime = 0;
    setResult(null);
    setGameStatus(null);
    setPerkChoice(null);
    setStageClear(null);
    setShareMessage("");
    controllerRef.current?.preview();
    setCountdown(COUNTDOWN_SECONDS);
    setScreen("countdown");
  }

  function handleGameOver(nextResult: GameResult) {
    setResult(nextResult);
    setStageClear(null);
    saveBestScore(nextResult.score);
    setScreen("result");
  }

  function handlePerkChoice(choice: PerkChoice) {
    setPerkChoice(choice);
    setStageClear(null);
    setScreen("perk");
  }

  function handleStageClear(nextStageClear: StageClear) {
    setStageClear(nextStageClear);
    setPerkChoice(null);
    setScreen("stage-transition");
  }

  function continueToNextStage() {
    controllerRef.current?.continueToNextStage();
  }

  function choosePerk(perk: string) {
    controllerRef.current?.choosePerk(perk);
    setPerkChoice(null);
    setScreen("playing");
  }

  function goHome() {
    setResult(null);
    setGameStatus(null);
    setPerkChoice(null);
    setStageClear(null);
    setShareMessage("");
    setScreen("start");
  }

  async function handleShare() {
    if (!result) return;
    const outcome = await shareScore(copy.documentTitle, copy.shareText(result.score));
    setShareMessage(
      outcome === "shared" ? copy.shared : outcome === "copied" ? copy.copied : copy.sharingUnavailable,
    );
  }

  const sort = (direction: Direction) => controllerRef.current?.sort(direction);
  const toggleMusic = () => setIsMusicMuted((muted) => !muted);
  const visibleGame = screen === "playing" || screen === "countdown" || screen === "perk" || screen === "stage-transition";
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
        />
        <div className="stage-tint" aria-hidden="true" />
        {screen === "countdown" && (
          <div className="game-countdown" aria-label={copy.countdownLabel}>
            <p key={countdown} className="game-countdown-number" aria-live="polite">{countdown}</p>
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
        {gameStatus && (screen === "playing" || screen === "perk" || screen === "stage-transition") && (
          <div className="stage-hud" aria-live="polite">
            <span>STAGE {gameStatus.stageIndex + 1}</span>
            <strong>{getStage(gameStatus.stageIndex).title[locale]}</strong>
            <span>{gameStatus.stageProgress} / {getStage(gameStatus.stageIndex).target}</span>
            <span>클레임 {gameStatus.claims} / 3</span>
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
              <button type="button" onClick={continueToNextStage}>다음 스테이지로</button>
            </section>
          </div>
        )}
        {screen === "perk" && perkChoice && (
          <div className="perk-choice-overlay" role="dialog" aria-modal="true" aria-labelledby="perk-choice-title">
            <section className="perk-choice-card">
              <p>STAGE {perkChoice.stageIndex + 1} · {getStage(perkChoice.stageIndex).title[locale]}</p>
              <h2 id="perk-choice-title">보너스 성과급 선택</h2>
              <span>{perkChoice.phase === "start" ? "성과급 상자가 도착했습니다" : "중간 성과급 상자가 도착했습니다"}</span>
              <div className="perk-choice-options">
                {perkChoice.options.map((perk) => (
                  <button type="button" key={perk} onClick={() => choosePerk(perk)}>
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
      </section>

      {screen === "result" && result && (
        <section
          className="market-result"
          aria-label={copy.resultLabel}
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/game/game-over-market-background-v3.png)` }}
        >
          <h1 className="market-result-title">
            {copy.resultTitleLines.map((line, lineIndex) => (
              <span className="market-result-title-line" key={line}>
                {Array.from(line).map((character, characterIndex) => (
                  <span
                    className="market-result-title-character"
                    key={`${line}-${characterIndex}`}
                    style={{ animationDelay: `${(lineIndex * line.length + characterIndex) * 80}ms` }}
                  >
                    {character}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <div className="market-result-board">
            <strong className="market-result-score">{copy.score(result.score)}</strong>
            <p className="market-result-reason">{result.reason === "complete" ? "정산 완료!" : "해고 사유: 클레임 누적"}</p>
            <p className="market-result-stage">도달 스테이지: {result.stageIndex + 1} · 선택 특성: {result.selectedPerks.length}개</p>
          </div>
          {shareMessage && <p className="market-result-share-message" role="status">{shareMessage}</p>}
          <div className="market-result-actions">
            <button type="button" onClick={startGame}>{copy.retry}</button>
            <button type="button" onClick={handleShare}>{copy.share}</button>
            <button type="button" onClick={goHome}>{copy.home}</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
