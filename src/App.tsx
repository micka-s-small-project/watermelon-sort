import { useEffect, useRef, useState } from "react";
import { Button } from "@toss/tds-mobile";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { getBestScore, saveBestScore } from "./lib/highScore";
import { shareScore } from "./lib/shareScore";
import type { Direction, GameResult } from "./game/types";
import "./App.css";

type Screen = "start" | "playing" | "result";
const MARKET_TITLE_LINES = ["7월의", "수박가게!"] as const;

function App() {
  const controllerRef = useRef<GameController>(null);
  const homeThemeRef = useRef<HTMLAudioElement | null>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [bestScore, setBestScore] = useState(() => getBestScore());
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
    controllerRef.current?.start();
    setScreen("playing");
  }

  function handleGameOver(nextResult: GameResult) {
    setResult(nextResult);
    setBestScore(saveBestScore(nextResult.score));
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
      {screen !== "start" && (
        <header className="game-header">
          <p className="eyebrow">WATERMELON FACTORY</p>
          <h1>Sort the Watermelons</h1>
        </header>
      )}

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

      <section className={`game-area ${screen === "playing" ? "" : "game-area-hidden"}`} aria-label="Watermelon sorting game">
        <GameCanvas ref={controllerRef} onGameOver={handleGameOver} />
        {screen === "playing" && <GameControls onSort={sort} />}
      </section>

      {screen === "result" && result && (
        <section className="card result-card">
          <p className="result-label">GAME OVER · {result.reason === "timeout" ? "Too slow" : "Wrong belt"}</p>
          <h2>{result.score}</h2>
          <p className="score-caption">watermelon score</p>
          <div className="result-stats">
            <div><span>Best score</span><strong>{bestScore}</strong></div>
            <div><span>Top combo</span><strong>{result.combo}</strong></div>
          </div>
          <div className="pixel-action"><Button color="primary" onClick={startGame}>Try again</Button></div>
          <div className="share-button-wrap"><Button variant="weak" onClick={handleShare}>Share score</Button></div>
          <div className="home-button-wrap"><Button variant="weak" onClick={goHome}>Main menu</Button></div>
          {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
        </section>
      )}
    </main>
  );
}

export default App;
