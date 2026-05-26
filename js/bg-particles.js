export function initBackground(canvas) {
  const ctx = canvas.getContext("2d");
  const stars = [];
  const count = 120;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 1.5 + 0.2,
      hue: Math.random() > 0.5 ? 185 : 310,
    });
  }

  resize();
  window.addEventListener("resize", resize);

  function tick() {
    ctx.fillStyle = "rgba(5, 5, 16, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      s.y += 0.0008 * s.z;
      if (s.y > 1) {
        s.y = 0;
        s.x = Math.random();
      }
      const px = s.x * canvas.width;
      const py = s.y * canvas.height;
      const size = s.z * 2;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue}, 100%, 70%, ${0.3 + s.z * 0.4})`;
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  tick();
}
