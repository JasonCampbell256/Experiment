import { GameBase } from "./base.js";

const DIR = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export class SnakeGame extends GameBase {
  constructor(opts) {
    super(opts);
    this.grid = 20;
    this.cols = 40;
    this.rows = 25;
    this.logicalW = this.cols * this.grid;
    this.logicalH = this.rows * this.grid;
    this.resetState();
    this.tickMs = 95;
    this.lastTick = 0;
  }

  resetState() {
    this.snake = [
      { x: 20, y: 12 },
      { x: 19, y: 12 },
      { x: 18, y: 12 },
    ];
    this.dir = DIR.right;
    this.nextDir = DIR.right;
    this.score = 0;
    this.trail = [];
    this.spawnFood();
  }

  spawnFood() {
    let spot;
    do {
      spot = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
    } while (this.snake.some((s) => s.x === spot.x && s.y === spot.y));
    this.food = spot;
    this.foodPulse = 0;
  }

  handleKey(e) {
    const map = {
      ArrowUp: DIR.up,
      ArrowDown: DIR.down,
      ArrowLeft: DIR.left,
      ArrowRight: DIR.right,
      w: DIR.up,
      s: DIR.down,
      a: DIR.left,
      d: DIR.right,
    };
    const nd = map[e.key];
    if (!nd) return;
    e.preventDefault();
    const opp = this.dir.x + nd.x === 0 && this.dir.y + nd.y === 0;
    if (!opp) this.nextDir = nd;
  }

  setDir(d) {
    const nd = DIR[d];
    if (!nd) return;
    const opp = this.dir.x + nd.x === 0 && this.dir.y + nd.y === 0;
    if (!opp) this.nextDir = nd;
  }

  update() {
    const now = performance.now();
    if (now - this.lastTick < this.tickMs) return;
    this.lastTick = now;
    this.dir = this.nextDir;
    const head = this.snake[0];
    const nh = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    if (nh.x < 0 || nh.x >= this.cols || nh.y < 0 || nh.y >= this.rows) {
      this.gameOver();
      return;
    }
    if (this.snake.some((s) => s.x === nh.x && s.y === nh.y)) {
      this.gameOver();
      return;
    }

    this.trail.push({ ...head, life: 12 });
    this.snake.unshift(nh);

    if (nh.x === this.food.x && nh.y === this.food.y) {
      this.score += 10;
      this.tickMs = Math.max(45, this.tickMs - 3);
      this.onStats?.({ score: this.score });
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    this.trail = this.trail
      .map((t) => ({ ...t, life: t.life - 1 }))
      .filter((t) => t.life > 0);
    this.foodPulse += 0.15;
  }

  gameOver() {
    this.showOverlay("GAME OVER", `Score: ${this.score} — Space to retry`);
    this.onStats?.({ score: this.score });
  }

  draw() {
    this.clear();
    this.withTransform((ctx) => {
      ctx.strokeStyle = "rgba(0, 245, 255, 0.06)";
      for (let x = 0; x <= this.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * this.grid, 0);
        ctx.lineTo(x * this.grid, this.logicalH);
        ctx.stroke();
      }
      for (let y = 0; y <= this.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * this.grid);
        ctx.lineTo(this.logicalW, y * this.grid);
        ctx.stroke();
      }

      for (const t of this.trail) {
        const a = t.life / 12;
        ctx.fillStyle = `rgba(57, 255, 20, ${a * 0.35})`;
        ctx.fillRect(t.x * this.grid, t.y * this.grid, this.grid, this.grid);
      }

      const pulse = 0.7 + Math.sin(this.foodPulse) * 0.3;
      ctx.shadowColor = "#ff00aa";
      ctx.shadowBlur = 25;
      ctx.fillStyle = `rgba(255, 0, 170, ${pulse})`;
      ctx.beginPath();
      ctx.arc(
        this.food.x * this.grid + this.grid / 2,
        this.food.y * this.grid + this.grid / 2,
        (this.grid / 2) * pulse,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      this.snake.forEach((seg, i) => {
        const t = 1 - i / this.snake.length;
        const hue = 160 + t * 80;
        ctx.fillStyle = `hsl(${hue}, 100%, ${45 + t * 25}%)`;
        ctx.shadowColor = "#39ff14";
        ctx.shadowBlur = i === 0 ? 18 : 8;
        const pad = i === 0 ? 1 : 2;
        ctx.fillRect(
          seg.x * this.grid + pad,
          seg.y * this.grid + pad,
          this.grid - pad * 2,
          this.grid - pad * 2
        );
      });
      ctx.shadowBlur = 0;

      this.glowText(`SCORE ${this.score}`, this.logicalW / 2, 28, "#00f5ff", 18);
    });
  }

  start() {
    this.resetState();
    this.tickMs = 95;
    super.start();
  }
}
