/* The Coffee Chamber: the barista's pour, played by your scroll.

   How it works, in plain words:
   - The café's video was cut into 127 still photos (assets/img/pour/001.webp ... 127.webp),
     like the pages of a flip-book.
   - The #pour section is 3 screens tall, but its inside "sticks" to the screen.
     While you scroll through it, we measure how far you are (0 = start, 1 = end)
     and draw the matching photo on the <canvas>. Scroll back and it plays backwards.
   - The three lines of text light up in step: espresso, then milk, then latte art.
   - The photos only start downloading when you get near the section. */

const FRAMES = 127;                    // how many photos are in assets/img/pour/
const STEP_AT = [0, 0.5, 0.83];        // where the milk and the latte-art lines start
const frameUrl = i => `assets/img/pour/${String(i + 1).padStart(3, '0')}.webp`;

(function () {
  const section = document.getElementById('pour');
  const canvas = document.getElementById('pour-canvas');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');
  const steps = [...section.querySelectorAll('.pour-steps li')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const images = [];
  let shown = -1;

  // How far you've scrolled through the section, from 0 to 1.
  function progress() {
    if (reduceMotion) return 1;
    const r = section.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  }

  // Make the canvas as sharp as the screen it's on.
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    shown = -1;
    update();
  }

  // Draw a photo so it fills the canvas without stretching (like CSS "object-fit: cover").
  function draw(img) {
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function update() {
    const p = progress();
    const step = p < STEP_AT[1] ? 0 : p < STEP_AT[2] ? 1 : 2;
    steps.forEach((li, n) => li.classList.toggle('is-active', n === step));

    // Use the wanted photo, or the nearest one that has already downloaded.
    const want = Math.round(p * (FRAMES - 1));
    for (let d = 0; d < FRAMES; d++) {
      for (const i of [want - d, want + d]) {
        const img = images[i];
        if (img && img.complete && img.naturalWidth) {
          if (i !== shown) { draw(img); shown = i; section.classList.add('is-ready'); }
          return;
        }
      }
    }
  }

  // Download every photo, a few at a time, starting with every 8th one so the
  // whole pour is roughly there fast, then filling the gaps.
  function load() {
    const order = [];
    for (let gap of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += gap) if (!order.includes(i)) order.push(i);
    order.forEach(i => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { if (Math.abs(i - Math.round(progress() * (FRAMES - 1))) < 6) update(); };
      img.src = frameUrl(i);
      images[i] = img;
    });
    resize();
    window.addEventListener('resize', resize);
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    }, { passive: true });
  }

  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); load(); }
  }, { rootMargin: '800px 0px' });
  io.observe(section);
})();
