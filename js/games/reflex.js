import { GameBase } from "./base.js";

export class ReflexGame extends GameBase {
  constructor(opts) {
    super(opts);
    this.logicalW = 800;
    this.logicalH = 500;
    this.phase = "wait";
    this.ring = 0;
    this.target = 0.75;
    this.tolerance = 0.08;
    this.combo = 0;
    this.score = 0;
    this.round = 0;
    this.maxRounds = 15;
    this.feedback = null;
    this.feedbackT = 0;
  }

  handleAction() {
    if (this.phase === "ready") {
      this.phase = "go";
      this.ring = 0;
      return;
    }
    if (this.phase !== "go") return;

    const diff = Math.abs(this.ring - this.target);
    if (diff <= this.tolerance) {
      const bonus = Math.floor((1 - diff / this.tolerance) * 50);
      this.combo++;
      const pts = 100 + bonus + this.combo * 10;
      this.score += pts;
      this.feedback = { text: "PERFECT!", color: "#39ff14", t: 30 };
    } else if (diff <= this.tolerance * 2) {
      this.combo = 0;
      this.score += 40;
      this.feedback = { text: "GOOD", color: "#ffe600", t: 30 };
    } else {
      this.combo = 0;
      this.feedback = { text: "MISS", color: "#ff00aa", t: 30 };
    }
    this.round++;
    this.onStats?.({ score: this.score, level: this.round });
    if (this.round >= this.maxRounds) {
      this.showOverlay("COMPLETE!", `Score: ${this.score} — Best combo streak included`);
      return;
    }
    this.nextRound();
  }

  nextRound() {
    this.phase = "wait";
    this.waitUntil = performance.now() + 800 + Math.random() * 1500;
    this.target = 0.55 + Math.random() * 0.35;
    this.tolerance = Math.max(0.04, 0.1 - this.round * 0.003);
    this.ring = 0;
  }

  update() {
    const now = performance.now();

    if (this.phase === "wait" && now >= this.waitUntil) {
      this.phase = "go";
    }

    if (this.phase === "go") {
      this.ring += 0.012 + this.round * 0.0008;
      if (this.ring > 1.15) {
        this.combo = 0;
        this.feedback = { text: "TOO LATE!", color: "#ff4466", t: 30 };
        this.round++;
        if (this.round >= this.maxRounds) {
          this.showOverlay("COMPLETE!", `Score: ${this.score}`);
          return;
        }
        this.nextRound();
      }
    }

    if (this.feedback) {
      this.feedback.t--;
      if (this.feedback.t <= 0) this.feedback = null;
    }
  }

  draw() {
    this.clear();
    this.withTransform((ctx) => {
      const cx = this.logicalW / 2;
      const cy = this.logicalH / 2;
      const R = 160;

      for (let i = 4; i >= 0; i--) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 245, 255, ${0.05 + i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.arc(cx, cy, R + i * 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.phase === "go") {
        const start = -Math.PI / 2;
        const end = start + Math.PI * 2 * this.target;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(57, 255, 20, 0.35)";
        ctx.lineWidth = 20;
        ctx.arc(cx, cy, R, start, end);
        ctx.stroke();

        const ringEnd = start + Math.PI * 2 * Math.min(this.ring, 1);
        ctx.beginPath();
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 20;
        ctx.arc(cx, cy, R, start, ringEnd);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const pulse = 0.85 + Math.sin(performance.now() / 100) * 0.15;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 230, 0, ${pulse})`;
        ctx.shadowColor = "#ffe600";
        ctx.shadowBlur = 30;
        const tx = cx + Math.cos(end) * R;
        const ty = cy + Math.sin(end) * R;
        ctx.arc(tx, ty, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (this.phase === "wait") {
        this.glowText("GET READY...", cx, cy, "#7a82b8", 28);
      } else if (this.phase === "ready") {
        this.glowText("TAP / SPACE", cx, cy - 20, "#00f5ff", 24);
        this.glowText("WHEN RING STARTS", cx, cy + 20, "#7a82b8", 16);
      } else {
        this.glowText("HIT THE GOLD ZONE!", cx, cy + R + 50, "#ffe600", 18);
      }

      if (this.feedback) {
        const a = this.feedback.t / 30;
        ctx.globalAlpha = a;
        this.glowText(this.feedback.text, cx, cy - 60, this.feedback.color, 36);
        ctx.globalAlpha = 1;
      }

      this.glowText(`SCORE ${this.score}`, cx, 40, "#ff00aa", 20);
      if (this.combo > 1) {
        this.glowText(`COMBO x${this.combo}`, cx, 68, "#39ff14", 16);
      }
      this.glowText(`ROUND ${this.round + 1}/${this.maxRounds}`, cx, this.logicalH - 30, "#7a82b8", 14);
    });
  }

  start() {
    this.score = 0;
    this.combo = 0;
    this.round = 0;
    this.phase = "ready";
    this.feedback = null;
    super.start();
    this.onStats?.({ score: 0, level: 1 });
  }
}
