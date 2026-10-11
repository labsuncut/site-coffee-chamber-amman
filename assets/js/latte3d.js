/* The Coffee Chamber: a 3D latte that turns as you scroll.

   How it works, in plain words:
   - three.js draws a cup, saucer and coffee in 3D on the <canvas> in #latte.
   - The #latte section is tall (3 screens). Its inside "sticks" to the screen,
     so while you scroll through it the cup stays put and we read how far you
     have scrolled (0 = top of the section, 1 = bottom).
   - That number turns the cup, tilts the camera, and "pours" the drink:
     espresso first, then milk, then the latte-art heart appears.
   - Nothing loads until you are close to the section, so the page stays fast.
   To change the cup colour, edit CUP_COLOR / SAUCER_COLOR below. */

const CUP_COLOR = 0x5b7fd6;    // their periwinkle-blue cup (from the café's own photo)
const SAUCER_COLOR = 0x4f73cc; // matching blue saucer
const EDGE_COLOR = 0xf7f4ee;   // the white lip on the cup and the white rim of the saucer

const section = document.getElementById('latte');
const canvas = document.getElementById('latte-canvas');
const steps = [...document.querySelectorAll('#latte-steps li')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll progress through the section, from 0 to 1.
function progress() {
  const r = section.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
}

// Highlight the step that matches how far you've scrolled (works even without 3D).
function updateSteps(p) {
  const i = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
  steps.forEach((li, n) => li.classList.toggle('is-active', n === i));
}
window.addEventListener('scroll', () => updateSteps(progress()), { passive: true });

function webglWorks() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

// Start loading three.js only when the section is about to come on screen.
if (section && canvas) {
  if (!webglWorks()) {
    section.classList.add('no-3d');
  } else {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '600px 0px' });
    io.observe(section);
  }
}

async function start() {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('./vendor/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;   // keeps their blue true to life
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // A soft "room" reflected in the glaze, so the porcelain looks shiny.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // Warm key light from the top left, plus a gold back light for the rim glow.
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(-3, 5, 4); scene.add(key);
  const back = new THREE.DirectionalLight(0xc6a768, 2.5); back.position.set(3, 2, -4); scene.add(back);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x2a2420, 0.6));

  const latte = new THREE.Group();   // everything that turns together
  scene.add(latte);

  const glaze = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const blue = glaze(CUP_COLOR), white = glaze(EDGE_COLOR);
  const lathe = (pts, mat, seg = 120) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

  // Cup: a 2D outline spun around the middle (a "lathe"), like a potter's wheel.
  // A round bowl on a small foot, like their cup.
  latte.add(lathe([
    [0.00, 0.00], [0.40, 0.00], [0.43, 0.03], [0.42, 0.07], [0.56, 0.14], [0.74, 0.30],
    [0.88, 0.52], [0.96, 0.76], [0.99, 0.96], [1.00, 1.06],
    [0.965, 1.06], [0.955, 0.96], [0.92, 0.77], [0.84, 0.54], [0.70, 0.33], [0.52, 0.18], [0.00, 0.13],
  ], blue));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.983, 0.019, 16, 120), white);
  lip.rotation.x = Math.PI / 2; lip.position.y = 1.062;
  latte.add(lip);

  // Handle: most of a ring stuck to the side of the cup.
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 20, 48, Math.PI * 1.2), blue);
  handle.position.set(0.98, 0.6, 0);
  handle.rotation.z = -Math.PI * 0.6;
  latte.add(handle);

  // Saucer: blue on top, white underneath and around the edge.
  latte.add(lathe([[0.00, 0.00], [0.62, 0.00], [1.30, 0.05], [1.56, 0.15], [1.58, 0.155]], glaze(SAUCER_COLOR)));
  latte.add(lathe([[0.00, -0.05], [0.66, -0.05], [1.34, 0.01], [1.60, 0.12], [1.62, 0.16]], white));
  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.028, 12, 160), white);
  saucerRim.rotation.x = Math.PI / 2; saucerRim.position.y = 0.155;
  latte.add(saucerRim);

  // Their round "The Chamber" badge on the front of the cup, where you see it as the scroll ends.
  const badgeTex = new THREE.TextureLoader().load('assets/img/logo-badge.webp');
  badgeTex.colorSpace = THREE.SRGBColorSpace;
  badgeTex.anisotropy = 8;
  const badge = new THREE.Mesh(
    // a thin slice of the cup's own outline (heights 0.40 to 0.80), lifted just off the wall
    new THREE.LatheGeometry([[0.74, 0.30], [0.79, 0.37], [0.84, 0.45], [0.88, 0.52], [0.92, 0.62], [0.945, 0.70], [0.96, 0.76], [0.975, 0.86]]
      .map(([x, y]) => new THREE.Vector2(x + 0.006, y - 0.6)), 32, 0.35 - 0.3, 0.6),
    new THREE.MeshStandardMaterial({ map: badgeTex, transparent: true, roughness: 0.35, side: THREE.FrontSide }));
  badge.position.y = 0.60;
  latte.add(badge);

  // The drink's surface is a flat circle with a picture we paint ourselves.
  const art = document.createElement('canvas');
  art.width = art.height = 1024;
  const artTex = new THREE.CanvasTexture(art);
  artTex.colorSpace = THREE.SRGBColorSpace;
  artTex.anisotropy = 8;
  const surface = new THREE.Mesh(new THREE.CircleGeometry(0.9, 96),
    new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.45 }));
  surface.rotation.x = -Math.PI / 2;
  latte.add(surface);

  // How wide the inside of the cup is at a given height (from the cup outline above).
  const inner = [[0.13, 0.30], [0.18, 0.52], [0.33, 0.70], [0.54, 0.84], [0.77, 0.92], [0.96, 0.955], [1.06, 0.965]];
  function innerRadius(y) {
    for (let i = 1; i < inner.length; i++) {
      const [y0, r0] = inner[i - 1], [y1, r1] = inner[i];
      if (y <= y1) return (r0 + (r1 - r0) * (y - y0) / (y1 - y0)) - 0.015;
    }
    return 0.93;
  }

  // Soft shadow under the saucer (a blurred dark circle).
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const sg = sh.getContext('2d'), grd = sg.createRadialGradient(128, 128, 20, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.07;
  latte.add(shadow);

  // Steam: a few soft white puffs that drift up and fade.
  const puffCanvas = document.createElement('canvas'); puffCanvas.width = puffCanvas.height = 128;
  const pg = puffCanvas.getContext('2d'), pgr = pg.createRadialGradient(64, 64, 0, 64, 64, 64);
  pgr.addColorStop(0, 'rgba(255,255,255,0.5)'); pgr.addColorStop(1, 'rgba(255,255,255,0)');
  pg.fillStyle = pgr; pg.fillRect(0, 0, 128, 128);
  const puffTex = new THREE.CanvasTexture(puffCanvas);
  const puffs = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { offset: i / 14, x: (Math.random() - 0.5) * 0.7, z: (Math.random() - 0.5) * 0.7 };
    scene.add(s);
    return s;
  });

  // Paint the drink for scroll progress p, in step with the three lines of text:
  // espresso until 0.30, milk goes in until 0.60, the heart is drawn until 0.90.
  let lastStage = -1;
  function paintDrink(p) {
    const stage = Math.round(p * 60) / 60;        // only repaint when it visibly changes
    if (stage === lastStage) return;
    lastStage = stage;
    const g = art.getContext('2d'), c = 512;
    const ramp = (a, b) => Math.min(1, Math.max(0, (stage - a) / (b - a)));
    const milk = ramp(0.25, 0.55);                 // how much milk is in
    const heart = ramp(0.6, 0.9);                  // how far the heart is drawn

    // Coffee base: dark espresso turning caramel as milk goes in.
    const mix = (a, b) => Math.round(a + (b - a) * milk);
    const base = g.createRadialGradient(c, c, 0, c, c, c);
    base.addColorStop(0, `rgb(${mix(70, 196)},${mix(38, 146)},${mix(18, 96)})`);
    base.addColorStop(0.75, `rgb(${mix(92, 168)},${mix(52, 110)},${mix(24, 62)})`);
    base.addColorStop(1, `rgb(${mix(48, 120)},${mix(26, 72)},${mix(12, 38)})`);
    g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);

    // Crema speckles so it doesn't look flat.
    g.globalAlpha = 0.18;
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * c;
      g.fillStyle = Math.random() < 0.5 ? '#2a160a' : '#f2d7a8';
      g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, Math.random() * 3 + 1, 0, 7); g.fill();
    }
    g.globalAlpha = 1;

    if (heart > 0) {
      // A foam heart that grows out of the middle, with a soft edge.
      const s = 0.25 + 0.75 * heart;
      g.save();
      g.translate(c, c + 40); g.scale(s, s);
      g.shadowColor = 'rgba(255,248,235,0.9)'; g.shadowBlur = 30;
      g.fillStyle = `rgba(255,250,240,${Math.min(1, heart * 1.4)})`;
      g.beginPath();
      g.moveTo(0, 250);
      g.bezierCurveTo(-60, 170, -330, 60, -300, -110);
      g.bezierCurveTo(-280, -260, -70, -280, 0, -130);
      g.bezierCurveTo(70, -280, 280, -260, 300, -110);
      g.bezierCurveTo(330, 60, 60, 170, 0, 250);
      g.fill();
      // The "pull-through" line down the middle of a poured heart.
      g.shadowBlur = 0;
      g.strokeStyle = `rgba(190,130,80,${0.5 * heart})`; g.lineWidth = 10;
      g.beginPath(); g.moveTo(0, -150); g.lineTo(0, 240); g.stroke();
      g.restore();
    }
    artTex.needsUpdate = true;
  }

  // Fit the canvas to its box and keep the cup a good size on phones and desktop.
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(section);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const p = reduceMotion ? 1 : progress();
    const narrow = camera.aspect < 0.9;

    paintDrink(p);
    updateSteps(p);

    // Turn the cup once around, plus a slow idle drift so it never looks frozen.
    latte.rotation.y = -0.6 + p * Math.PI * 2 + (reduceMotion ? 0 : Math.sin(t * 0.5) * 0.06);
    // Liquid level rises as it's "poured", and the disc widens to fit the cup's inside wall.
    const level = 0.6 + 0.38 * Math.min(1, p * 1.6);
    surface.position.y = level;
    surface.scale.setScalar(innerRadius(level) / 0.9);

    // Camera starts looking down into the cup, ends at a low hero angle.
    const tilt = 1.0 - p * 0.68;                  // radians above the table
    const dist = narrow ? 11.5 : 7.6;
    camera.position.set(0, Math.sin(tilt) * dist + 0.4, Math.cos(tilt) * dist);
    camera.lookAt(0, 0.55, 0);
    // On wide screens the cup sits to the side of the text; on phones, below it.
    latte.position.set(narrow ? 0 : (document.documentElement.dir === 'rtl' ? -1.5 : 1.5), narrow ? -1.6 : 0, 0);

    // Steam rises from the cup and only shows once the drink is in.
    const steamOn = Math.min(1, p * 3) * (reduceMotion ? 0 : 1);
    puffs.forEach(s => {
      const k = (t * 0.18 + s.userData.offset) % 1;
      s.position.set(latte.position.x + s.userData.x + Math.sin(t + s.userData.offset * 9) * 0.12,
        latte.position.y + 1.2 + k * 1.6, s.userData.z);
      s.scale.setScalar(0.5 + k * 0.9);
      s.material.opacity = Math.sin(k * Math.PI) * 0.35 * steamOn;
    });

    renderer.render(scene, camera);
  }
  section.classList.add('has-3d');
  frame();
}
