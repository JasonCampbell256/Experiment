export class GameBase {
  constructor({ canvas, overlay, overlayTitle, overlayMsg, overlayBtn, onStats }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.overlay = overlay;
    this.overlayTitle = overlayTitle;
    this.overlayMsg = overlayMsg;
    this.overlayBtn = overlayBtn;
    this.onStats = onStats;
    this.running = false;
    this.raf = null;
    this._boundLoop = () => this.loop();
    this._resizeObserver = null;
    this.logicalW = 800;
    this.logicalH = 500;
  }

  setupCanvas() {
    const wrap = this.canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayW = rect.width;
    this.displayH = rect.height;
    this.scaleX = this.displayW / this.logicalW;
    this.scaleY = this.displayH / this.logicalH;
  }

  showOverlay(title, msg, btnText = "PLAY") {
    this.overlay.hidden = false;
    this.overlayTitle.textContent = title;
    this.overlayMsg.textContent = msg;
    this.overlayBtn.textContent = btnText;
    this.running = false;
  }

  hideOverlay() {
    this.overlay.hidden = true;
  }

  start() {
    this.setupCanvas();
    this.hideOverlay();
    this.running = true;
    this.onStats?.({ score: 0, level: 1, lives: 3 });
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this._boundLoop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(this._boundLoop);
  }

  update() {}
  draw() {}

  clear() {
    this.ctx.fillStyle = "#0a0a18";
    this.ctx.fillRect(0, 0, this.displayW, this.displayH);
  }

  withTransform(fn) {
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);
    fn(this.ctx);
    this.ctx.restore();
  }

  glowText(text, x, y, color, size = 24) {
    this.ctx.save();
    this.ctx.font = `bold ${size}px Orbitron, sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
}
