import { useEffect, useRef, useState } from "react";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { saveBestScore } from "./lib/highScore";
import { shareScore } from "./lib/shareScore";
import type { Direction, GameResult } from "./game/types";
import "./App.css";

type Screen = "start" | "countdown" | "playing" | "result";
const MARKET_TITLE_LINES = ["수박수박", "수박박수박"] as const;
const RESULT_TITLE = "노 동 결 과!";
const COUNTDOWN_SECONDS = 3;

function App() {
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
    const outcome = await shareScore(result.score);
    setShareMessage(
      outcome === "shared" ? "Score shared!" : outcome === "copied" ? "Score copied to clipboard!" : "Sharing is unavailable on this device.",
    );
  }

  const sort = (direction: Direction) => controllerRef.current?.sort(direction);
  const toggleMusic = () => setIsMusicMuted((muted) => !muted);

  return (
    <main className={`app-shell app-shell-${screen}`}>
      {screen === "start" && (
        <section
          className="market-home"
          aria-labelledby="market-title"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/game/supermarket-home-no-sign-v3.png)` }}
        >
          <h1 id="market-title" className="market-title">
            {MARKET_TITLE_LINES.map((line, lineIndex) => (
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
          <button className="market-start-button" type="button" onClick={startGame}>수박 분류하기</button>
          <button
            className="market-mute-button"
            type="button"
            aria-label={isMusicMuted ? "배경 음악 켜기" : "배경 음악 끄기"}
            aria-pressed={isMusicMuted}
            onClick={toggleMusic}
          >
            <span aria-hidden="true">♪</span>
          </button>
        </section>
      )}

      <section className={`game-area ${screen === "playing" || screen === "countdown" ? "" : "game-area-hidden"}`} aria-label="Watermelon sorting game">
        <GameCanvas ref={controllerRef} onGameOver={handleGameOver} />
        {screen === "countdown" && (
          <div className="game-countdown" aria-label="게임 시작 카운트다운">
            <p key={countdown} className="game-countdown-number" aria-live="polite">{countdown}</p>
          </div>
        )}
        {screen === "playing" && <GameControls onSort={sort} />}
      </section>

      {screen === "result" && result && (
        <section
          className="market-result"
          aria-label="Labor result"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/game/game-over-market-background-v3.png)` }}
        >
          <h1 className="market-result-title">
            {Array.from(RESULT_TITLE).map((character, index) => (
              <span
                className="market-result-title-character"
                key={`${character}-${index}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {character}
              </span>
            ))}
          </h1>
          <div className="market-result-board">
            <strong className="market-result-score">{result.score}점</strong>
            <p className="market-result-reason">해고 사유 : {result.reason === "timeout" ? "too slow" : "wrong belt"}</p>
          </div>
          {shareMessage && <p className="market-result-share-message" role="status">{shareMessage}</p>}
          <div className="market-result-actions">
            <button type="button" onClick={startGame}>다시하기</button>
            <button type="button" onClick={handleShare}>공유하기</button>
            <button type="button" onClick={goHome}>메인메뉴</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
