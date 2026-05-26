import { initBackground } from "./bg-particles.js";
import { SnakeGame } from "./games/snake.js";
import { BreakoutGame } from "./games/breakout.js";
import { MemoryGame } from "./games/memory.js";
import { ReflexGame } from "./games/reflex.js";
import { DodgeGame } from "./games/dodge.js";

const GAMES = [
  {
    id: "snake",
    title: "Neon Serpent",
    icon: "🐍",
    accent: "#39ff14",
    tag: "ARCADE",
    hint: "Arrow keys or WASD · Eat pink orbs · Don't hit walls or yourself",
    controls: ["← → ↑ ↓", "W A S D"],
    Game: SnakeGame,
    touchPad: true,
  },
  {
    id: "breakout",
    title: "Cosmic Breakout",
    icon: "💥",
    accent: "#00f5ff",
    tag: "CLASSIC",
    hint: "Move paddle · Smash neon bricks · Catch the golden ball",
    controls: ["← →", "Mouse / touch drag"],
    Game: BreakoutGame,
    touchPad: false,
  },
  {
    id: "memory",
    title: "Memory Matrix",
    icon: "🧠",
    accent: "#b24bf3",
    tag: "PUZZLE",
    hint: "Click cards · Match all 8 pairs · Fewer moves = higher score",
    controls: ["Click / tap cards"],
    Game: MemoryGame,
    touchPad: false,
  },
  {
    id: "reflex",
    title: "Pulse Reflex",
    icon: "⚡",
    accent: "#ffe600",
    tag: "SKILL",
    hint: "Space or tap when the cyan ring hits the gold zone · Build combos",
    controls: ["Space", "Tap / click"],
    Game: ReflexGame,
    touchPad: false,
  },
  {
    id: "dodge",
    title: "Asteroid Drift",
    icon: "🛸",
    accent: "#ff00aa",
    tag: "SURVIVAL",
    hint: "Dodge rocks · Collect golden stars · Survive as long as you can",
    controls: ["WASD", "Arrow keys"],
    Game: DodgeGame,
    touchPad: true,
  },
];

const $ = (sel) => document.querySelector(sel);

const viewHome = $("#view-home");
const viewGame = $("#view-game");
const gameGrid = $("#game-grid");
const gameCanvas = $("#game-canvas");
const gameOverlay = $("#game-overlay");
const overlayTitle = $("#overlay-title");
const overlayMsg = $("#overlay-msg");
const overlayBtn = $("#overlay-btn");
const gameTitle = $("#game-title");
const gameHint = $("#game-hint");
const gameControls = $("#game-controls");
const headerStats = $("#header-stats");
const statScore = $("#stat-score strong");
const statLevel = $("#stat-level");
const statLevelVal = $("#stat-level strong");
const statLives = $("#stat-lives");
const statLivesVal = $("#stat-lives strong");

let currentGame = null;
let currentMeta = null;
let keyHandler = null;
let keyUpHandler = null;
let pointerHandler = null;

initBackground($("#bg-canvas"));

function renderHomeCards() {
  gameGrid.innerHTML = GAMES.map(
    (g) => `
    <button type="button" class="game-card" data-id="${g.id}" style="--card-accent: ${g.accent}">
      <span class="game-card-icon">${g.icon}</span>
      <h3>${g.title}</h3>
      <p>Instant play. Glowing visuals. Addictive loops.</p>
      <span class="tag">${g.tag}</span>
    </button>`
  ).join("");

  gameGrid.querySelectorAll(".game-card").forEach((btn) => {
    btn.addEventListener("click", () => launchGame(btn.dataset.id));
  });
}

function updateStats({ score, level, lives }) {
  statScore.textContent = score ?? 0;
  if (level != null) {
    statLevel.hidden = false;
    statLevelVal.textContent = level;
  } else {
    statLevel.hidden = true;
  }
  if (lives != null) {
    statLives.hidden = false;
    statLivesVal.textContent = lives;
  } else {
    statLives.hidden = true;
  }
}

function buildTouchPad(show) {
  if (!show) {
    gameControls.querySelector(".touch-pad")?.remove();
    return;
  }
  if (gameControls.querySelector(".touch-pad")) return;
  const pad = document.createElement("div");
  pad.className = "touch-pad show";
  pad.innerHTML = `
    <span class="empty"></span>
    <button type="button" data-dir="up">▲</button>
    <span class="empty"></span>
    <button type="button" data-dir="left">◀</button>
    <button type="button" data-dir="down">▼</button>
    <button type="button" data-dir="right">▶</button>
  `;
  gameControls.appendChild(pad);
  pad.querySelectorAll("button").forEach((b) => {
    const dir = b.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      if (currentGame?.setDir) currentGame.setDir(dir);
      if (currentGame?.setMove) {
        const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
        const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
        currentGame.setMove(dx, dy);
      }
    };
    const release = () => {
      if (currentGame?.setMove) currentGame.setMove(0, 0);
    };
    b.addEventListener("touchstart", press, { passive: false });
    b.addEventListener("mousedown", press);
    b.addEventListener("touchend", release);
    b.addEventListener("mouseup", release);
    b.addEventListener("mouseleave", release);
  });
}

function teardownGame() {
  if (keyHandler) {
    window.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
  if (keyUpHandler) {
    window.removeEventListener("keyup", keyUpHandler);
    keyUpHandler = null;
  }
  if (pointerHandler) {
    gameCanvas.removeEventListener("pointermove", pointerHandler);
    gameCanvas.removeEventListener("click", pointerHandler);
    pointerHandler = null;
  }
  currentGame?._resizeCleanup?.();
  currentGame?.destroy();
  currentGame = null;
}

function showHome() {
  teardownGame();
  viewGame.hidden = true;
  viewHome.hidden = false;
  viewHome.classList.add("active");
  viewGame.classList.remove("active");
  headerStats.hidden = true;
}

function launchGame(id) {
  const meta = GAMES.find((g) => g.id === id);
  if (!meta) return;

  teardownGame();
  currentMeta = meta;

  viewHome.hidden = true;
  viewHome.classList.remove("active");
  viewGame.hidden = false;
  viewGame.classList.add("active");

  gameTitle.textContent = meta.title;
  gameHint.textContent = meta.hint;
  headerStats.hidden = false;
  updateStats({ score: 0, level: 1, lives: meta.id === "breakout" ? 3 : undefined });

  gameControls.innerHTML = meta.controls
    .map((c) => `<span class="control-hint">${c}</span>`)
    .join("");
  buildTouchPad(meta.touchPad);

  currentGame = new meta.Game({
    canvas: gameCanvas,
    overlay: gameOverlay,
    overlayTitle,
    overlayMsg,
    overlayBtn,
    onStats: updateStats,
  });

  gameOverlay.hidden = false;
  overlayTitle.textContent = meta.title.toUpperCase();
  overlayMsg.textContent = "Press Space or tap PLAY to start";
  overlayBtn.textContent = "PLAY";

  const startPlay = () => {
    if (!currentGame.running && gameOverlay.hidden === false) {
      currentGame.start();
    } else if (!currentGame.running) {
      currentGame.start();
    }
  };

  overlayBtn.onclick = startPlay;

  keyHandler = (e) => {
    if (e.code === "Space" && !gameOverlay.hidden) {
      e.preventDefault();
      startPlay();
      return;
    }
    if (e.code === "Space" && meta.id === "reflex") {
      e.preventDefault();
      currentGame.handleAction?.();
      return;
    }
    currentGame.handleKey?.(e);
  };

  keyUpHandler = (e) => currentGame.handleKeyUp?.(e);

  pointerHandler = (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    const x = ((e.clientX ?? e.x) - rect.left) / rect.width;
    const y = ((e.clientY ?? e.y) - rect.top) / rect.height;
    const lx = x * currentGame.logicalW;
    const ly = y * currentGame.logicalH;

    if (meta.id === "breakout" && e.type === "pointermove") {
      currentGame.handlePointer?.(e.clientX - rect.left);
    }
    if (meta.id === "memory" && e.type === "click") {
      currentGame.handleClick?.(lx, ly);
    }
    if (meta.id === "reflex" && e.type === "click") {
      if (currentGame.phase === "ready") currentGame.handleAction?.();
      else if (currentGame.running) currentGame.handleAction?.();
    }
  };

  window.addEventListener("keydown", keyHandler);
  window.addEventListener("keyup", keyUpHandler);
  gameCanvas.addEventListener("pointermove", pointerHandler);
  gameCanvas.addEventListener("click", pointerHandler);

  const resize = () => currentGame?.setupCanvas?.();
  window.addEventListener("resize", resize);
  currentGame._resizeCleanup = () => window.removeEventListener("resize", resize);
}

$("#btn-home").addEventListener("click", showHome);

renderHomeCards();
