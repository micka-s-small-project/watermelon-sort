import { useEffect, useRef, useState } from "react";
import { Button } from "@toss/tds-mobile";
import { GameCanvas, type GameController } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { getBestScore, saveBestScore } from "./lib/highScore";
import { shareScore } from "./lib/shareScore";
import type { Direction, GameResult } from "./game/types";
import "./App.css";

type Screen = "start" | "playing" | "result";

function App() {
  const controllerRef = useRef<GameController>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [bestScore, setBestScore] = useState(() => getBestScore());
  const [result, setResult] = useState<GameResult | null>(null);
  const [shareMessage, setShareMessage] = useState("");

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

  async function handleShare() {
    if (!result) return;
    const outcome = await shareScore(result.score);
    setShareMessage(
      outcome === "shared" ? "Score shared!" : outcome === "copied" ? "Score copied to clipboard!" : "Sharing is unavailable on this device.",
    );
  }

  const sort = (direction: Direction) => controllerRef.current?.sort(direction);

  return (
    <main className="app-shell">
      <header className="game-header">
        <p className="eyebrow">WATERMELON FACTORY</p>
        <h1>Sort the Watermelons</h1>
      </header>

      {screen === "start" && (
        <section className="card start-card">
          <div className="watermelon-mark" aria-hidden="true">🍉</div>
          <h2>Healthy left. Rotten right.</h2>
          <p>Sort every watermelon before the 1.5-second belt timer ends.</p>
          <div className="rule-grid">
            <span>⌨️ Left arrow</span><strong>Healthy</strong>
            <span>⌨️ Right arrow</span><strong>Rotten</strong>
          </div>
          <p className="hint">On a phone, use the buttons below the conveyor.</p>
          <Button color="primary" onClick={startGame}>Start sorting</Button>
          <p className="best-score">Best score: <strong>{bestScore}</strong></p>
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
          <Button color="primary" onClick={startGame}>Try again</Button>
          <div className="share-button-wrap"><Button variant="weak" onClick={handleShare}>Share score</Button></div>
          {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
        </section>
      )}
    </main>
  );
}

export default App;
