import { GameBase } from "./base.js";

export class BreakoutGame extends GameBase {
  constructor(opts) {
    super(opts);
    this.logicalW = 800;
    this.logicalH = 500;
    this.particles = [];
    this.resetState();
  }

  resetState() {
    this.paddle = { x: 340, w: 120, h: 14 };
    this.ball = { x: 400, y: 350, vx: 4, vy: -4, r: 8 };
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.bricks = this.makeBricks();
  }

  makeBricks() {
    const bricks = [];
    const cols = 10;
    const rows = 5 + Math.min(this.level - 1, 3);
    const bw = 70;
    const bh = 22;
    const gap = 8;
    const offsetX = (this.logicalW - cols * (bw + gap) + gap) / 2;
    const colors = ["#00f5ff", "#ff00aa", "#ffe600", "#39ff14", "#b24bf3"];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetX + c * (bw + gap),
          y: 50 + r * (bh + gap),
          w: bw,
          h: bh,
          hp: 1 + (r < 2 && this.level > 2 ? 1 : 0),
          color: colors[(r + c) % colors.length],
          alive: true,
        });
      }
    }
    return bricks;
  }

  burst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.5;
      const sp = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 40 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  handleKey(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = true;
    e.preventDefault();
  }

  handleKeyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
  }

  handlePointer(x) {
    this.pointerX = x;
  }

  update() {
    this.keys = this.keys || {};
    const speed = 9;
    if (this.keys.left) this.paddle.x -= speed;
    if (this.keys.right) this.paddle.x += speed;
    if (this.pointerX != null) {
      this.paddle.x = this.pointerX / this.scaleX - this.paddle.w / 2;
    }
    this.paddle.x = Math.max(0, Math.min(this.logicalW - this.paddle.w, this.paddle.x));

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > this.logicalW) {
      this.ball.vx *= -1;
      this.ball.x = Math.max(this.ball.r, Math.min(this.logicalW - this.ball.r, this.ball.x));
    }
    if (this.ball.y - this.ball.r < 0) {
      this.ball.vy *= -1;
      this.ball.y = this.ball.r;
    }

    const py = this.logicalH - 40;
    if (
      this.ball.y + this.ball.r >= py &&
      this.ball.y - this.ball.r <= py + this.paddle.h &&
      this.ball.x >= this.paddle.x &&
      this.ball.x <= this.paddle.x + this.paddle.w
    ) {
      const hit = (this.ball.x - this.paddle.x) / this.paddle.w - 0.5;
      this.ball.vy = -Math.abs(this.ball.vy);
      this.ball.vx = hit * 10;
      this.ball.y = py - this.ball.r;
    }

    if (this.ball.y > this.logicalH + 20) {
      this.lives--;
      this.onStats?.({ score: this.score, lives: this.lives, level: this.level });
      if (this.lives <= 0) {
        this.showOverlay("GAME OVER", `Final score: ${this.score}`);
        return;
      }
      this.ball = { x: this.paddle.x + this.paddle.w / 2, y: 350, vx: 4, vy: -4, r: 8 };
    }

    for (const b of this.bricks) {
      if (!b.alive) continue;
      if (
        this.ball.x + this.ball.r > b.x &&
        this.ball.x - this.ball.r < b.x + b.w &&
        this.ball.y + this.ball.r > b.y &&
        this.ball.y - this.ball.r < b.y + b.h
      ) {
        b.hp--;
        if (b.hp <= 0) {
          b.alive = false;
          this.score += 15;
          this.burst(b.x + b.w / 2, b.y + b.h / 2, b.color);
        } else {
          this.score += 5;
        }
        this.ball.vy *= -1;
        this.onStats?.({ score: this.score, lives: this.lives, level: this.level });
        break;
      }
    }

    if (this.bricks.every((b) => !b.alive)) {
      this.level++;
      this.bricks = this.makeBricks();
      this.ball.vx *= 1.08;
      this.ball.vy *= 1.08;
      this.onStats?.({ score: this.score, lives: this.lives, level: this.level });
    }

    this.particles = this.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.12,
        life: p.life - 1,
      }))
      .filter((p) => p.life > 0);
  }

  draw() {
    this.clear();
    this.withTransform((ctx) => {
      for (const p of this.particles) {
        ctx.globalAlpha = p.life / 60;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      for (const b of this.bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.hp > 1 ? 12 : 18;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.hp > 1) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
        }
      }
      ctx.shadowBlur = 0;

      const py = this.logicalH - 40;
      const grad = ctx.createLinearGradient(this.paddle.x, py, this.paddle.x + this.paddle.w, py);
      grad.addColorStop(0, "#00f5ff");
      grad.addColorStop(1, "#ff00aa");
      ctx.fillStyle = grad;
      ctx.shadowColor = "#00f5ff";
      ctx.shadowBlur = 20;
      ctx.fillRect(this.paddle.x, py, this.paddle.w, this.paddle.h);
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.fillStyle = "#ffe600";
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 25;
      ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  start() {
    this.keys = {};
    this.pointerX = null;
    this.resetState();
    super.start();
    this.onStats?.({ score: 0, lives: 3, level: 1 });
  }
}
