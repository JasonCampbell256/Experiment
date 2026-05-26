import { GameBase } from "./base.js";

export class DodgeGame extends GameBase {
  constructor(opts) {
    super(opts);
    this.logicalW = 800;
    this.logicalH = 500;
    this.player = { x: 400, y: 400, r: 16, vx: 0 };
    this.asteroids = [];
    this.stars = [];
    this.score = 0;
    this.spawnTimer = 0;
    this.keys = {};
    this.trail = [];
  }

  resetState() {
    this.player = { x: 400, y: 400, r: 16, vx: 0 };
    this.asteroids = [];
    this.stars = [];
    this.score = 0;
    this.spawnTimer = 0;
    this.trail = [];
  }

  spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 2 + Math.random() * 3 + this.score / 500;
    if (edge === 0) {
      x = Math.random() * this.logicalW;
      y = -30;
      vx = (Math.random() - 0.5) * 2;
      vy = speed;
    } else if (edge === 1) {
      x = this.logicalW + 30;
      y = Math.random() * this.logicalH;
      vx = -speed;
      vy = (Math.random() - 0.5) * 2;
    } else if (edge === 2) {
      x = Math.random() * this.logicalW;
      y = this.logicalH + 30;
      vx = (Math.random() - 0.5) * 2;
      vy = -speed;
    } else {
      x = -30;
      y = Math.random() * this.logicalH;
      vx = speed;
      vy = (Math.random() - 0.5) * 2;
    }
    this.asteroids.push({
      x,
      y,
      vx,
      vy,
      r: 14 + Math.random() * 22,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.08,
      verts: this.randomVerts(),
    });
  }

  randomVerts() {
    const n = 6 + Math.floor(Math.random() * 4);
    const v = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = 0.6 + Math.random() * 0.4;
      v.push({ cos: Math.cos(a) * rad, sin: Math.sin(a) * rad });
    }
    return v;
  }

  spawnStar() {
    this.stars.push({
      x: Math.random() * this.logicalW,
      y: Math.random() * this.logicalH,
      vy: 0.5 + Math.random(),
      pulse: Math.random() * Math.PI * 2,
    });
  }

  handleKey(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = true;
    if (e.key === "ArrowUp" || e.key === "w") this.keys.up = true;
    if (e.key === "ArrowDown" || e.key === "s") this.keys.down = true;
    e.preventDefault();
  }

  handleKeyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
    if (e.key === "ArrowUp" || e.key === "w") this.keys.up = false;
    if (e.key === "ArrowDown" || e.key === "s") this.keys.down = false;
  }

  setMove(dx, dy) {
    this.keys.left = dx < 0;
    this.keys.right = dx > 0;
    this.keys.up = dy < 0;
    this.keys.down = dy > 0;
  }

  dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  update() {
    const speed = 5.5;
    let dx = 0;
    let dy = 0;
    if (this.keys.left) dx -= speed;
    if (this.keys.right) dx += speed;
    if (this.keys.up) dy -= speed;
    if (this.keys.down) dy += speed;
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }
    this.player.x = Math.max(this.player.r, Math.min(this.logicalW - this.player.r, this.player.x + dx));
    this.player.y = Math.max(this.player.r, Math.min(this.logicalH - this.player.r, this.player.y + dy));

    this.trail.push({ x: this.player.x, y: this.player.y, life: 20 });
    this.trail = this.trail.map((t) => ({ ...t, life: t.life - 1 })).filter((t) => t.life > 0);

    this.spawnTimer++;
    if (this.spawnTimer > Math.max(25, 60 - this.score / 80)) {
      this.spawnAsteroid();
      this.spawnTimer = 0;
    }
    if (Math.random() < 0.02) this.spawnStar();

    for (const a of this.asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotV;
    }
    this.asteroids = this.asteroids.filter(
      (a) => a.x > -80 && a.x < this.logicalW + 80 && a.y > -80 && a.y < this.logicalH + 80
    );

    for (const s of this.stars) {
      s.pulse += 0.1;
      if (this.dist(this.player, s) < this.player.r + 14) {
        this.score += 25;
        this.onStats?.({ score: this.score });
        s.collected = true;
      }
    }
    this.stars = this.stars.filter((s) => !s.collected);

    for (const a of this.asteroids) {
      if (this.dist(this.player, a) < this.player.r + a.r * 0.85) {
        this.showOverlay("CRASHED!", `You survived with ${this.score} points`);
        return;
      }
    }

    this.score += 0.15;
    this.onStats?.({ score: Math.floor(this.score) });
  }

  draw() {
    this.clear();
    this.withTransform((ctx) => {
      for (const t of this.trail) {
        const a = t.life / 20;
        ctx.fillStyle = `rgba(0, 245, 255, ${a * 0.25})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.player.r * a, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of this.stars) {
        const p = 0.6 + Math.sin(s.pulse) * 0.4;
        ctx.fillStyle = `rgba(255, 230, 0, ${p})`;
        ctx.shadowColor = "#ffe600";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 10 * p);
        ctx.lineTo(s.x + 3, s.y);
        ctx.lineTo(s.x, s.y + 10 * p);
        ctx.lineTo(s.x - 3, s.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      for (const a of this.asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.fillStyle = "#4a4a5a";
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ff4466";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < a.verts.length; i++) {
          const v = a.verts[i];
          const px = v.cos * a.r;
          const py = v.sin * a.r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.fillStyle = "#00f5ff";
      ctx.shadowColor = "#00f5ff";
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(0, -this.player.r * 1.4);
      ctx.lineTo(this.player.r, this.player.r);
      ctx.lineTo(0, this.player.r * 0.5);
      ctx.lineTo(-this.player.r, this.player.r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      this.glowText(`SCORE ${Math.floor(this.score)}`, this.logicalW / 2, 32, "#00f5ff", 18);
    });
  }

  start() {
    this.keys = {};
    this.resetState();
    super.start();
    this.onStats?.({ score: 0 });
  }
}
