// Лёгкий конфетти-эффект на canvas без внешних библиотек (офлайн-safe)

function launchConfetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#9d4edd', '#06d6a0', '#ffd166', '#00b4d8', '#ef476f', '#ffffff'];
  const parts = [];
  for (let i = 0; i < 140; i++) {
    parts.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
      y: canvas.height * 0.25,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -11 - 4,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1
    });
  }
  const start = performance.now();
  function frame(t) {
    const elapsed = (t - start) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life = 1 - elapsed / 1.8;
      if (p.life <= 0 || p.y > canvas.height + 20) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive && elapsed < 2.2) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}
