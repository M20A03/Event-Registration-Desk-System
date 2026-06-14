(function () {
  const canvas = document.querySelector("[data-hyper-scene]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || prefersReducedMotion) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const points = [];
  const edges = [];
  const particleCount = 44;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frameId = 0;
  let time = 0;

  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        for (let w = -1; w <= 1; w += 2) {
          points.push([x, y, z, w]);
        }
      }
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const diff = points[i].reduce((total, value, index) => total + (value !== points[j][index] ? 1 : 0), 0);
      if (diff === 1) {
        edges.push([i, j]);
      }
    }
  }

  const particles = Array.from({ length: particleCount }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    radius: 1.2 + Math.random() * 2.4,
    speed: 0.12 + Math.random() * 0.34,
    phase: index * 0.37
  }));

  function rotate(a, b, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [a * cos - b * sin, a * sin + b * cos];
  }

  function project(point) {
    let [x, y, z, w] = point;
    [x, w] = rotate(x, w, time * 0.55);
    [y, z] = rotate(y, z, time * 0.42);
    [x, z] = rotate(x, z, time * 0.28);
    [y, w] = rotate(y, w, time * 0.31);

    const wDepth = 2.8 / (3.8 - w);
    x *= wDepth;
    y *= wDepth;
    z *= wDepth;

    const zDepth = 360 / (420 - z * 120);
    const scale = Math.min(width, height) * 0.16;

    return {
      x: width * 0.78 + x * scale * zDepth,
      y: height * 0.42 + y * scale * zDepth,
      alpha: 0.28 + zDepth * 0.6
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawParticles() {
    particles.forEach((particle) => {
      const x = particle.x * width + Math.sin(time + particle.phase) * 24;
      const y = ((particle.y + time * particle.speed * 0.02) % 1) * height;
      const glow = 0.2 + Math.sin(time * 1.8 + particle.phase) * 0.12;

      ctx.beginPath();
      ctx.fillStyle = `rgba(23, 107, 99, ${glow})`;
      ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawTesseract() {
    const projected = points.map(project);

    edges.forEach(([from, to]) => {
      const start = projected[from];
      const end = projected[to];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(23, 107, 99, ${Math.min(start.alpha, end.alpha)})`;
      ctx.stroke();
    });

    projected.forEach((point) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(15, 79, 73, ${point.alpha})`;
      ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    time += 0.014;
    ctx.clearRect(0, 0, width, height);
    drawParticles();
    drawTesseract();
    frameId = window.requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(frameId);
  });
})();
