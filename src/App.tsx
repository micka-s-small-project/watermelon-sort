import { useEffect, useRef, useState } from "react";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { saveBestScore } from "./lib/highScore";
import { getBrowserLocale, getCopy } from "./lib/i18n";
import { shareScore } from "./lib/shareScore";
import type { Direction, GameResult } from "./game/types";
import "./App.css";

type Screen = "start" | "countdown" | "playing" | "result";
const COUNTDOWN_SECONDS = 3;

function App() {
  const [locale] = useState(getBrowserLocale);
  const copy = getCopy(locale);
  const controllerRef = useRef<GameController>(null);
  const homeThemeRef = useRef<HTMLAudioElement | null>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<GameResult | null>(null);
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
        controllerRef.current?.start();
        setScreen("playing");
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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  function startGame() {
    homeThemeRef.current?.pause();
    if (homeThemeRef.current) homeThemeRef.current.currentTime = 0;
    setResult(null);
    setShareMessage("");
    controllerRef.current?.preview();
    setCountdown(COUNTDOWN_SECONDS);
    setScreen("countdown");
  }

  function handleGameOver(nextResult: GameResult) {
    setResult(nextResult);
    saveBestScore(nextResult.score);
    setScreen("result");
  }

  function goHome() {
    setResult(null);
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

      <section className={`game-area ${screen === "playing" || screen === "countdown" ? "" : "game-area-hidden"}`} aria-label={copy.gameAreaLabel}>
        <GameCanvas
          ref={controllerRef}
          onGameOver={handleGameOver}
        />
        {screen === "countdown" && (
          <div className="game-countdown" aria-label={copy.countdownLabel}>
            <p key={countdown} className="game-countdown-number" aria-live="polite">{countdown}</p>
          </div>
        )}
        {screen === "playing" && <GameControls copy={copy} onSort={sort} />}
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
            <p className="market-result-reason">{result.reason === "timeout" ? copy.timeoutReason : copy.wrongBeltReason}</p>
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
