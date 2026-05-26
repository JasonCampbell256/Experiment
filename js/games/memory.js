import { GameBase } from "./base.js";

const EMOJIS = ["🚀", "👾", "⚡", "🌟", "🎮", "💎", "🔥", "🛸"];

export class MemoryGame extends GameBase {
  constructor(opts) {
    super(opts);
    this.logicalW = 800;
    this.logicalH = 500;
    this.cards = [];
    this.flipped = [];
    this.lock = false;
    this.moves = 0;
    this.matches = 0;
    this.time = 0;
    this.lastTime = 0;
  }

  buildDeck() {
    const pairs = EMOJIS.slice(0, 8);
    const deck = [...pairs, ...pairs]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({
        id: i,
        emoji,
        faceUp: false,
        matched: false,
        wobble: 0,
      }));
    const cols = 4;
    const rows = 4;
    const cw = 140;
    const ch = 100;
    const gap = 16;
    const totalW = cols * cw + (cols - 1) * gap;
    const totalH = rows * ch + (rows - 1) * gap;
    const ox = (this.logicalW - totalW) / 2;
    const oy = (this.logicalH - totalH) / 2 + 20;
    deck.forEach((card, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      card.x = ox + c * (cw + gap);
      card.y = oy + r * (ch + gap);
      card.w = cw;
      card.h = ch;
    });
    return deck;
  }

  handleClick(logicalX, logicalY) {
    if (this.lock) return;
    const card = this.cards.find(
      (c) =>
        !c.matched &&
        !c.faceUp &&
        logicalX >= c.x &&
        logicalX <= c.x + c.w &&
        logicalY >= c.y &&
        logicalY <= c.y + c.h
    );
    if (!card) return;
    card.faceUp = true;
    card.wobble = 1;
    this.flipped.push(card);
    if (this.flipped.length === 2) {
      this.moves++;
      this.lock = true;
      const [a, b] = this.flipped;
      if (a.emoji === b.emoji) {
        a.matched = b.matched = true;
        this.matches++;
        this.score = (this.matches * 100) - this.moves * 5 + Math.max(0, 300 - Math.floor(this.time));
        this.onStats?.({ score: Math.max(0, this.score) });
        this.flipped = [];
        this.lock = false;
        if (this.matches === 8) {
          this.showOverlay("YOU WIN!", `${this.moves} moves in ${Math.floor(this.time)}s`);
        }
      } else {
        setTimeout(() => {
          a.faceUp = b.faceUp = false;
          this.flipped = [];
          this.lock = false;
        }, 700);
      }
    }
  }

  update() {
    const now = performance.now();
    if (!this.lastTime) this.lastTime = now;
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (this.matches < 8) this.time += dt;

    for (const c of this.cards) {
      if (c.wobble > 0) c.wobble = Math.max(0, c.wobble - 0.08);
    }
  }

  draw() {
    this.clear();
    this.withTransform((ctx) => {
      this.glowText(`MOVES ${this.moves}`, this.logicalW / 2, 36, "#b24bf3", 18);

      for (const card of this.cards) {
        const flip = card.faceUp || card.matched ? 1 : 0;
        const wob = Math.sin(card.wobble * Math.PI) * 6 * card.wobble;

        ctx.save();
        ctx.translate(card.x + card.w / 2 + wob, card.y + card.h / 2);
        const scaleX = flip ? 1 : 0.08;
        ctx.scale(scaleX, 1);

        if (flip) {
          const g = ctx.createLinearGradient(-card.w / 2, 0, card.w / 2, 0);
          g.addColorStop(0, "#1a1a40");
          g.addColorStop(1, "#2a1050");
          ctx.fillStyle = g;
          ctx.shadowColor = card.matched ? "#39ff14" : "#b24bf3";
          ctx.shadowBlur = card.matched ? 25 : 15;
          ctx.fillRect(-card.w / 2, -card.h / 2, card.w, card.h);
          ctx.shadowBlur = 0;
          ctx.font = "48px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(card.emoji, 0, 4);
        } else {
          ctx.fillStyle = "#12122a";
          ctx.strokeStyle = "#00f5ff";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#00f5ff";
          ctx.shadowBlur = 12;
          ctx.fillRect(-card.w / 2, -card.h / 2, card.w, card.h);
          ctx.strokeRect(-card.w / 2, -card.h / 2, card.w, card.h);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#00f5ff";
          ctx.font = "bold 28px Orbitron";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", 0, 0);
        }
        ctx.restore();
      }
    });
  }

  start() {
    this.cards = this.buildDeck();
    this.flipped = [];
    this.lock = false;
    this.moves = 0;
    this.matches = 0;
    this.score = 0;
    this.time = 0;
    this.lastTime = 0;
    super.start();
    this.onStats?.({ score: 0 });
  }
}
