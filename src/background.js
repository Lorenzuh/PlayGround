// Scenery: sky, desert, saloon and street props. Everything is pixel-aligned.

export const W = 320;
export const H = 568;
export const GROUND_Y = 420;

// ---------- color helpers ----------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
export function lerpColor(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export function shade(hex, amount) {
  const A = hexToRgb(hex);
  if (amount >= 0) return rgbToHex(A[0] + (255 - A[0]) * amount, A[1] + (255 - A[1]) * amount, A[2] + (255 - A[2]) * amount);
  return rgbToHex(A[0] * (1 + amount), A[1] * (1 + amount), A[2] * (1 + amount));
}

// ---------- palettes by time of day ----------
const PALETTES = {
  sunset: {
    sky: ['#2a1a40', '#46234c', '#6d2f50', '#a33e4b', '#d46046', '#f18d4a', '#ffc36b'],
    sun: '#ffe9a8', sunGlow: '#ffb85c', cloud: '#7c3a55', cloudLit: '#e07a5f',
    far: '#8a4a52', mid: '#67323f', near: '#43222f',
    haze: '#e08a5a', lit: '#ffbd72',
    ground: '#6b3a33', groundLight: '#8f5138', groundDark: '#43242a',
    wood: '#5e3430', woodLight: '#8a4a35', woodDark: '#38202a',
    glow: '#ffb347',
  },
  dusk: {
    sky: ['#141a34', '#252144', '#402a4f', '#633a55', '#8f4a55', '#b96253', '#d98a5f'],
    sun: '#ffd9a0', sunGlow: '#e0895c', cloud: '#4d3150', cloudLit: '#a85c63',
    far: '#5c3a50', mid: '#442b40', near: '#2c1d31',
    haze: '#a8605f', lit: '#e09265',
    ground: '#51302f', groundLight: '#714132', groundDark: '#2f1d27',
    wood: '#4c2b2e', woodLight: '#744034', woodDark: '#2b1922',
    glow: '#ffc05a',
  },
  night: {
    sky: ['#070d20', '#0d1530', '#141f40', '#1d2b4d', '#2b3b58', '#3d4c63', '#58657a'],
    sun: '#dfe8ff', sunGlow: '#8496c4', cloud: '#232d49', cloudLit: '#52628a',
    far: '#2a3249', mid: '#1e2438', near: '#131927',
    haze: '#6a7899', lit: '#9fb0d4',
    ground: '#2a2431', groundLight: '#3d3039', groundDark: '#171520',
    wood: '#2e2430', woodLight: '#4a3537', woodDark: '#19131e',
    glow: '#ffcd6b',
  },
};

function mixPalette(a, b, t) {
  const out = {};
  for (const key of Object.keys(a)) {
    if (Array.isArray(a[key])) out[key] = a[key].map((c, i) => lerpColor(c, b[key][i], t));
    else out[key] = lerpColor(a[key], b[key], t);
  }
  return out;
}

/** dayT 0 = golden sunset, 0.5 = dusk, 1 = deep night */
export function paletteFor(dayT) {
  if (dayT <= 0.5) return mixPalette(PALETTES.sunset, PALETTES.dusk, dayT * 2);
  return mixPalette(PALETTES.dusk, PALETTES.night, (dayT - 0.5) * 2);
}

// ---------- deterministic randomness ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(1897);
const STARS = Array.from({ length: 46 }, () => ({
  x: Math.floor(rnd() * W),
  y: 40 + Math.floor(rnd() * 190),
  s: rnd() > 0.8 ? 2 : 1,
  phase: rnd() * Math.PI * 2,
  speed: 0.5 + rnd() * 1.5,
}));

const CLOUDS = [
  { x: 20, y: 88, w: 92, h: 12, drift: 2.2 },
  { x: 200, y: 132, w: 70, h: 10, drift: 3.1 },
  { x: 110, y: 58, w: 54, h: 8, drift: 1.5 },
  { x: 250, y: 70, w: 60, h: 9, drift: 2.6 },
];

const DUST = Array.from({ length: 30 }, () => ({
  x: rnd() * W, y: 220 + rnd() * 330, vx: 2 + rnd() * 6, vy: -1 + rnd() * 2,
  s: rnd() > 0.7 ? 2 : 1, phase: rnd() * 10,
}));

// ---------- primitives ----------
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Dithered horizontal bands -> soft pixel gradient.
function drawSky(ctx, pal, time) {
  const top = 46, bottom = 330;
  const colors = pal.sky;
  const bandH = (bottom - top) / (colors.length - 1);
  for (let i = 0; i < colors.length; i++) {
    const y = Math.round(top + i * bandH);
    const h = Math.ceil(bandH) + 1;
    rect(ctx, 0, y, W, h, colors[i]);
  }
  // checker dither between bands, 2px grid
  for (let i = 0; i < colors.length - 1; i++) {
    const y0 = Math.round(top + i * bandH) + Math.ceil(bandH) - 6;
    for (let x = 0; x < W; x += 2) {
      const row = (x / 2 + i) % 2;
      rect(ctx, x, y0 + (row ? 0 : 2), 2, 2, colors[i + 1]);
    }
  }

  // stars
  const starAlpha = Math.max(0, (pal === PALETTES.night ? 1 : 0));
  // derive alpha from sky darkness instead of identity
  const brightness = hexToRgb(pal.sky[0]);
  const dark = 1 - (brightness[0] + brightness[1] + brightness[2]) / 300;
  const sa = Math.max(0, Math.min(1, (dark - 0.55) * 3));
  if (sa > 0.02) {
    for (const s of STARS) {
      const tw = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase);
      ctx.globalAlpha = sa * tw;
      rect(ctx, s.x, s.y, s.s, s.s, '#fdf3cf');
    }
    ctx.globalAlpha = 1;
  }

  // sun / moon path
  const sunX = 246;
  const sunY = 132 + Math.pow(dayProgressFromPal(pal), 1.4) * 150;
  drawSun(ctx, sunX, sunY, pal, time);

  // clouds
  for (const c of CLOUDS) {
    const cx = ((c.x + time * c.drift) % (W + c.w + 40)) - c.w - 20;
    drawCloud(ctx, Math.round(cx), c.y, c.w, c.h, pal, time, c);
  }

  // vultures (day) or bats (night) far off
  const vAlpha = 0.35 + 0.4 * (1 - sa);
  for (let i = 0; i < 3; i++) {
    const bx = 40 + i * 78 + Math.sin(time * 0.23 + i * 2.1) * 24;
    const by = 78 + i * 15 + Math.sin(time * 0.55 + i) * 5;
    drawVulture(ctx, bx, by, time * 2.4 + i, `rgba(40,20,34,${vAlpha})`);
  }
}

function dayProgressFromPal(pal) {
  // recover rough progress from sky top brightness: night is darkest
  const c = hexToRgb(pal.sky[0]);
  return 1 - Math.min(1, (c[0] + c[1] + c[2]) / 190);
}

function drawSun(ctx, x, y, pal, time) {
  const R = 30;
  // halo rings
  for (let ring = 4; ring >= 1; ring--) {
    ctx.globalAlpha = 0.055 * ring * 0.8;
    const r = R + ring * 9;
    for (let dy = -r; dy <= r; dy += 2) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
      ctx.fillStyle = pal.sunGlow;
      ctx.fillRect(Math.round(x - half), Math.round(y + dy), half * 2, 2);
    }
  }
  ctx.globalAlpha = 1;
  // pixel circle body
  for (let dy = -R; dy < R; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, R * R - dy * dy)));
    rect(ctx, x - half, y + dy, half * 2, 2, pal.sun);
  }
  // subtle banding on the sun
  ctx.globalAlpha = 0.16;
  for (let i = -1; i <= 1; i++) {
    const yy = y + i * 9;
    const half = Math.floor(Math.sqrt(Math.max(0, R * R - (i * 9) ** 2)));
    rect(ctx, x - half, yy, half * 2, 2, '#d98a5c');
  }
  ctx.globalAlpha = 1;
}

function drawCloud(ctx, x, y, w, h, pal, time, c) {
  const blocks = [
    [0, h * 0.5, w, h * 0.5],
    [w * 0.15, h * 0.25, w * 0.5, h * 0.5],
    [w * 0.4, 0, w * 0.38, h * 0.6],
    [w * 0.7, h * 0.3, w * 0.25, h * 0.4],
  ];
  // shadow layer
  for (const b of blocks) rect(ctx, x + b[0], y + b[1] + 2, b[2], b[3], pal.cloud);
  // lit top
  for (const b of blocks) rect(ctx, x + b[0], y + b[1], b[2], Math.max(2, b[3] * 0.45), pal.cloudLit);
  // highlights
  ctx.globalAlpha = 0.4;
  for (const b of blocks) rect(ctx, x + b[0], y + b[1], Math.max(2, b[2] * 0.7), 2, shade(pal.cloudLit, 0.3));
  ctx.globalAlpha = 1;
}

function drawVulture(ctx, x, y, flap, color) {
  const up = Math.sin(flap) > 0;
  ctx.fillStyle = color;
  const xs = Math.round(x), ys = Math.round(y);
  ctx.fillRect(xs - 6, ys + (up ? -1 : 1), 4, 1);
  ctx.fillRect(xs - 2, ys, 4, 1);
  ctx.fillRect(xs + 2, ys + (up ? -1 : 1), 4, 1);
  if (up) {
    ctx.fillRect(xs - 7, ys - 2, 2, 2);
    ctx.fillRect(xs + 5, ys - 2, 2, 2);
  }
}

// ---------- landscape ----------
function mesa(ctx, x, baseY, w, h, color, rim, seed) {
  const r = mulberry32(seed);
  // plateau silhouette
  const steps = Math.floor(w / 8);
  for (let i = 0; i < steps; i++) {
    const sx = x + i * 8;
    const edge = Math.min(i, steps - 1 - i);
    const jitter = Math.floor(r() * 14);
    const top = baseY - h + Math.min(18, edge * 9) + jitter;
    rect(ctx, sx, top, 8, baseY - top, color);
    if (edge > 1) rect(ctx, sx, top, 8, 2, rim);
  }
  // strata
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 3; i++) {
    rect(ctx, x + 10, baseY - h * 0.4 + i * 9, w - 20, 2, '#1b0f18');
  }
  ctx.globalAlpha = 1;
}

function drawMesas(ctx, pal) {
  mesa(ctx, -20, 348, 130, 96, pal.far, shade(pal.far, 0.16), 11);
  mesa(ctx, 88, 352, 120, 70, pal.far, shade(pal.far, 0.14), 22);
  mesa(ctx, 210, 350, 140, 108, pal.far, shade(pal.far, 0.18), 33);
  mesa(ctx, 30, 366, 90, 58, pal.mid, shade(pal.mid, 0.14), 44);
  mesa(ctx, 244, 368, 100, 62, pal.mid, shade(pal.mid, 0.14), 55);
  // haze line at the horizon
  ctx.globalAlpha = 0.25;
  rect(ctx, 0, 338, W, 10, pal.haze);
  ctx.globalAlpha = 1;
}

// ---------- saloon and town ----------
export const SCENE = {
  saloon: { x: 48, top: 168, w: 178, base: 420 },
  store: { x: 236, top: 296, w: 100, base: 420 },
  windows: [
    { x: 78, y: 238, w: 46, h: 54, slot: 'winL' },
    { x: 160, y: 238, w: 46, h: 54, slot: 'winR' },
  ],
  storeWindow: { x: 256, y: 330, w: 44, h: 54, slot: 'store' },
  slots: {
    winL: { x: 101, baseY: 292, scale: 1, cover: 'winL' },
    winR: { x: 183, baseY: 292, scale: 1, cover: 'winR' },
    street: { x: 160, baseY: 452, scale: 1.08 },
    barrel: { x: 44, baseY: 448, scale: 1 },
    wagon: { x: 276, baseY: 450, scale: 1 },
    store: { x: 278, baseY: 384, scale: 1, cover: 'store' },
  },
};

function drawPlankWall(ctx, x, y, w, h, pal, seed) {
  const r = mulberry32(seed);
  rect(ctx, x, y, w, h, pal.wood);
  // vertical boards
  for (let bx = x; bx < x + w; bx += 9) {
    rect(ctx, bx, y, 1, h, pal.woodDark);
    rect(ctx, bx + 1, y, 1, h, shade(pal.wood, 0.07));
    for (let i = 0; i < 3; i++) {
      const nx = bx + 3 + Math.floor(r() * 5);
      const ny = y + Math.floor(r() * h);
      rect(ctx, nx, ny, 1, 2, pal.woodDark);
    }
  }
  // top / bottom trim
  rect(ctx, x, y, w, 4, pal.woodDark);
  rect(ctx, x, y + 4, w, 2, pal.woodLight);
  rect(ctx, x, y + h - 3, w, 3, pal.woodDark);
  // horizontal beam
  ctx.globalAlpha = 0.5;
  rect(ctx, x, y + Math.floor(h * 0.52), w, 3, pal.woodDark);
  ctx.globalAlpha = 1;
}

function drawWindow(ctx, wx, wy, ww, wh, pal, lit, time) {
  // outer frame
  rect(ctx, wx - 4, wy - 4, ww + 8, wh + 8, pal.woodDark);
  rect(ctx, wx - 2, wy - 2, ww + 4, wh + 4, shade(pal.woodLight, -0.1));
  // dark room
  rect(ctx, wx, wy, ww, wh, lit ? '#3a1a1c' : '#120d18');
  if (lit) {
    const flick = 0.82 + Math.sin(time * 7 + wx) * 0.06;
    ctx.globalAlpha = flick;
    for (let i = 0; i < wh; i += 2) {
      const halfW = Math.floor(ww * (0.28 + (i / wh) * 0.2));
      rect(ctx, wx + ww / 2 - halfW, wy + i, halfW * 2, 2, '#b26a30');
    }
    ctx.globalAlpha = flick * 0.8;
    rect(ctx, wx + ww / 2 - 6, wy + wh - 14, 12, 14, '#e89a42');
    ctx.globalAlpha = 1;
  }
  // mullions
  rect(ctx, wx + ww / 2 - 1, wy, 2, wh, pal.woodDark);
  rect(ctx, wx, wy + wh / 2 - 1, ww, 2, pal.woodDark);
  // glass glints
  ctx.globalAlpha = 0.18;
  rect(ctx, wx + 4, wy + 4, 10, 2, '#ffe6b0');
  rect(ctx, wx + 4, wy + 8, 4, 6, '#ffe6b0');
  ctx.globalAlpha = 1;
  // curtains
  rect(ctx, wx + 1, wy + 1, 5, wh - 2, '#7a2f35');
  rect(ctx, wx + ww - 6, wy + 1, 5, wh - 2, '#7a2f35');
  // sill
  rect(ctx, wx - 6, wy + wh + 2, ww + 12, 5, pal.woodLight);
  rect(ctx, wx - 6, wy + wh + 7, ww + 12, 2, pal.woodDark);
}

export function drawSaloon(ctx, pal, time, litWindows = true) {
  const s = SCENE.saloon;
  // body
  drawPlankWall(ctx, s.x, s.top, s.w, s.base - s.top, pal, 7);
  // false-front cornice
  rect(ctx, s.x - 4, s.top - 6, s.w + 8, 8, pal.woodDark);
  rect(ctx, s.x - 2, s.top - 2, s.w + 4, 3, pal.woodLight);
  // sign board
  const sx = s.x + 12, sy = s.top + 12, sw = s.w - 24, sh = 34;
  rect(ctx, sx - 3, sy - 3, sw + 6, sh + 6, pal.woodDark);
  rect(ctx, sx, sy, sw, sh, '#2a1720');
  rect(ctx, sx + 2, sy + 2, sw - 4, 1, '#b8803f');
  rect(ctx, sx + 2, sy + sh - 3, sw - 4, 1, '#b8803f');
  // SALOON letters (drawn by caller's font? no — tiny blocks here to avoid import cycle)
  drawTinySign(ctx, 'SALOON', sx + sw / 2, sy + 11, 3, '#f2b64e');
  drawTinySign(ctx, 'CANTINA DO ZE', sx + sw / 2, sy + 25, 1, '#b9875a');

  // upper windows
  for (const w of SCENE.windows) drawWindow(ctx, w.x, w.y, w.w, w.h, pal, litWindows, time);

  // porch awning
  const ay = 316;
  rect(ctx, s.x - 10, ay, s.w + 20, 5, pal.woodDark);
  for (let i = 0; i < s.w + 20; i += 12) {
    rect(ctx, s.x - 10 + i, ay + 5, 12, 8, i % 24 === 0 ? '#8f3a35' : '#e6c08a');
    rect(ctx, s.x - 10 + i, ay + 11, 12, 2, shade(pal.woodDark, 0.05));
  }
  rect(ctx, s.x - 12, ay + 13, s.w + 24, 3, pal.woodDark);
  // fascia board
  rect(ctx, s.x - 12, ay + 16, s.w + 24, 8, '#5c2f2c');
  drawTinySign(ctx, 'HOTEL  SALOON  WHISKY', s.x + s.w / 2, ay + 18, 1, '#d8a26a');

  // porch posts
  for (const px of [s.x - 6, s.x + s.w - 2]) {
    rect(ctx, px, ay + 24, 6, s.base - (ay + 24), pal.woodDark);
    rect(ctx, px + 1, ay + 24, 2, s.base - (ay + 24), pal.woodLight);
  }
  // porch floor shadow
  ctx.globalAlpha = 0.3;
  rect(ctx, s.x - 10, s.base - 8, s.w + 20, 8, '#150c14');
  ctx.globalAlpha = 1;

  // doors
  const dx = 116, dy = 344, dw = 42, dh = 62;
  rect(ctx, dx - 5, dy - 5, dw + 10, dh + 5, pal.woodDark);
  rect(ctx, dx, dy, dw, dh, '#241420');
  // swinging half doors
  rect(ctx, dx + 2, dy + dh - 30, dw / 2 - 3, 30, pal.woodLight);
  rect(ctx, dx + dw / 2 + 1, dy + dh - 30, dw / 2 - 3, 30, pal.woodLight);
  for (const dxx of [dx + 2, dx + dw / 2 + 1]) {
    rect(ctx, dxx, dy + dh - 30, dw / 2 - 3, 3, pal.woodDark);
    for (let i = 0; i < 5; i++) rect(ctx, dxx + 1, dy + dh - 26 + i * 5, dw / 2 - 5, 1, shade(pal.woodLight, -0.18));
  }
  // doorway glow spilling on the floor
  ctx.globalAlpha = 0.35;
  rect(ctx, dx + 4, dy + dh - 4, dw - 8, 6, '#e89a42');
  ctx.globalAlpha = 1;

  // lanterns
  for (const lx of [s.x + 2, s.x + s.w - 8]) {
    drawLantern(ctx, lx, 322, time, pal, 1);
  }

  // wanted poster between windows
  rect(ctx, 142, 246, 12, 16, '#d8b98a');
  rect(ctx, 143, 247, 10, 2, '#7a3a2f');
  rect(ctx, 145, 251, 6, 7, '#8a4a35');
  rect(ctx, 145, 260, 6, 1, '#5a3223');

  // sign hanging on right side
  const hx = s.x + s.w + 2, hy = 210;
  rect(ctx, hx, hy, 3, 26, pal.woodDark);
  rect(ctx, hx + 3, hy + 4, 18, 22, '#2a1720');
  drawTinySign(ctx, 'XERIFE', hx + 12, hy + 10, 1, '#e8c47c');
  // star
  drawStar(ctx, hx + 12, hy + 20, 3, '#e8c47e');
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  const pts = [
    [0, -r], [r * 0.3, -r * 0.3], [r, -r * 0.3], [r * 0.45, r * 0.15],
    [r * 0.65, r * 0.9], [0, r * 0.4], [-r * 0.65, r * 0.9], [-r * 0.45, r * 0.15],
    [-r, -r * 0.3], [-r * 0.3, -r * 0.3],
  ];
  // crude pixel star via tiny rows
  const rows = [
    [0, 1], [0, 1], [-1, 1], [-2, 5], [0, 1], [0, 1], [-1, 3],
  ];
  let y = Math.round(cy - r);
  for (let i = 0; i < rows.length; i++) {
    const [off, len] = rows[i];
    ctx.fillRect(Math.round(cx + off), y + i, len, 1);
  }
}

function drawTinySign(ctx, str, cx, y, scale, color) {
  // a tiny block font shared with the saloon signs, 3x5
  const F = {
    A: ['010','101','111','101','101'], B: ['110','101','110','101','110'],
    C: ['011','100','100','100','011'], D: ['110','101','101','101','110'],
    E: ['111','100','110','100','111'], F: ['111','100','110','100','100'],
    G: ['011','100','101','101','011'], H: ['101','101','111','101','101'],
    I: ['111','010','010','010','111'], J: ['001','001','001','101','010'],
    K: ['101','101','110','101','101'], L: ['100','100','100','100','111'],
    M: ['101','111','111','101','101'], N: ['101','111','111','111','101'],
    O: ['010','101','101','101','010'], P: ['110','101','110','100','100'],
    Q: ['010','101','101','110','011'], R: ['110','101','110','101','101'],
    S: ['011','100','010','001','110'], T: ['111','010','010','010','010'],
    U: ['101','101','101','101','011'], V: ['101','101','101','101','010'],
    W: ['101','101','111','111','101'], X: ['101','101','010','101','101'],
    Y: ['101','101','010','010','010'], Z: ['111','001','010','100','111'],
    ' ': ['000','000','000','000','000'],
  };
  const s = str.toUpperCase();
  const cw = 3 * scale + scale;
  let x = Math.round(cx - (s.length * cw - scale) / 2);
  ctx.fillStyle = color;
  for (const ch of s) {
    const g = F[ch] || F[' '];
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        if (g[gy][gx] === '1') ctx.fillRect(x + gx * scale, y + gy * scale, scale, scale);
      }
    }
    x += cw;
  }
}

function drawLantern(ctx, x, y, time, pal, scale = 1) {
  const flick = 0.75 + Math.sin(time * 9 + x) * 0.12 + Math.sin(time * 23 + x) * 0.06;
  rect(ctx, x - 1, y, 3, 14, pal.woodDark);
  rect(ctx, x - 4, y + 12, 9, 3, pal.woodDark);
  ctx.globalAlpha = 0.16 * flick;
  rect(ctx, x - 12, y + 8, 25, 25, pal.glow);
  ctx.globalAlpha = 1;
  rect(ctx, x - 2, y + 15, 5, 6, '#ffcf6b');
  rect(ctx, x - 1, y + 16, 3, 4, '#fff0b8');
  rect(ctx, x - 2, y + 21, 5, 1, pal.woodDark);
}

export function drawStore(ctx, pal, time, lit = true) {
  const s = SCENE.store;
  drawPlankWall(ctx, s.x, s.top, s.w, s.base - s.top, pal, 19);
  // parapet
  rect(ctx, s.x - 2, s.top - 6, s.w + 2, 8, pal.woodDark);
  rect(ctx, s.x, s.top, s.w, 3, pal.woodLight);
  // sign
  rect(ctx, s.x + 8, s.top + 10, s.w - 16, 22, '#2a1720');
  rect(ctx, s.x + 8, s.top + 10, s.w - 16, 2, '#b8803f');
  drawTinySign(ctx, 'ARMAZEM', s.x + s.w / 2, s.top + 16, 2, '#e8c47c');
  // window
  drawWindow(ctx, SCENE.storeWindow.x, SCENE.storeWindow.y, SCENE.storeWindow.w, SCENE.storeWindow.h, pal, lit, time);
  // door
  rect(ctx, s.x + 6, 386, 26, 34, '#20131c');
  rect(ctx, s.x + 6, 386, 26, 3, pal.woodLight);
  rect(ctx, s.x + 8, 390, 22, 2, '#5a3223');
  // awning
  rect(ctx, s.x + 2, 322, 72, 4, pal.woodDark);
  for (let i = 0; i < 72; i += 10) {
    rect(ctx, s.x + 2 + i, 326, 10, 6, i % 20 === 0 ? '#3f5c58' : '#d7c39a');
  }
  // barrels by door
  drawBarrel(ctx, 224, 396, 0.9, pal);
  drawCrate(ctx, 303, 394, 0.9, pal);
}

function drawBarrel(ctx, x, baseY, scale, pal, front = true) {
  const w = Math.round(16 * scale), h = Math.round(22 * scale);
  const top = baseY - h;
  rect(ctx, x - w / 2, top + 2, w, h - 2, '#6b3a2b');
  rect(ctx, x - w / 2 + 1, top + 2, 3, h - 2, '#8f5138');
  rect(ctx, x + w / 2 - 3, top + 2, 2, h - 2, '#48241f');
  // hoops
  for (const yy of [top + 3, top + h * 0.45, top + h - 5]) {
    rect(ctx, x - w / 2, yy, w, 2, '#3a2a28');
    rect(ctx, x - w / 2 + 1, yy, w - 2, 1, '#7d6a52');
  }
  // lid
  rect(ctx, x - w / 2 + 1, top, w - 2, 4, '#8a4a35');
  rect(ctx, x - w / 2 + 3, top + 1, w - 6, 2, '#a86745');
  // highlight
  ctx.globalAlpha = 0.25;
  rect(ctx, x - w / 2 + 2, top + 5, 2, h - 10, '#ffd6a0');
  ctx.globalAlpha = 1;
  if (front) {
    ctx.globalAlpha = 0.25;
    rect(ctx, x - w / 2, baseY - 1, w, 3, '#1d1118');
    ctx.globalAlpha = 1;
  }
}

function drawCrate(ctx, x, baseY, scale, pal) {
  const s = Math.round(20 * scale);
  rect(ctx, x - s / 2, baseY - s, s, s, '#6a3c2c');
  rect(ctx, x - s / 2, baseY - s, s, 3, '#8a5137');
  rect(ctx, x - s / 2, baseY - 3, s, 3, '#3f231f');
  // cross planks
  ctx.strokeStyle = '#4a2922';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s / 2 + 2, baseY - s + 2);
  ctx.lineTo(x + s / 2 - 2, baseY - 2);
  ctx.moveTo(x + s / 2 - 2, baseY - s + 2);
  ctx.lineTo(x - s / 2 + 2, baseY - 2);
  ctx.stroke();
  rect(ctx, x - s / 2, baseY - s + 2, 2, s - 4, '#8a5137');
  rect(ctx, x + s / 2 - 2, baseY - s + 2, 2, s - 4, '#4a2922');
}

function drawWagon(ctx, pal) {
  // foreground wagon wheel + axle on the right
  const cx = 296, cy = 438, r = 30;
  ctx.strokeStyle = '#3a2222';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#7a4a32';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.strokeStyle = i % 2 ? '#5a3223' : '#8a5137';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
  }
  rect(ctx, cx - 5, cy - 5, 10, 10, '#2f2024');
  rect(ctx, cx - 2, cy - 2, 4, 4, '#8a5137');
  // wagon body behind
  rect(ctx, 250, 402, 70, 18, '#5a3223');
  rect(ctx, 250, 402, 70, 4, '#8a5137');
  for (let i = 0; i < 70; i += 12) rect(ctx, 250 + i, 406, 6, 12, '#6b3d2b');
  // canvas cover ribs
  ctx.strokeStyle = '#d7c39a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(252, 402);
  ctx.quadraticCurveTo(285, 378, 318, 402);
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  rect(ctx, 256, 386, 58, 16, '#d7c39a');
  ctx.globalAlpha = 1;
}

function drawCactus(ctx, x, baseY, scale, pal, night) {
  const s = scale;
  ctx.fillStyle = '#3f5c3f';
  const arm = (ax, ay, w, h) => {
    ctx.fillRect(x + ax * s, baseY - (ay + h) * s, w * s, h * s);
  };
  // trunk
  ctx.fillRect(x - 4 * s, baseY - 46 * s, 8 * s, 46 * s);
  arm(-11, 20, 7, 15); arm(4, 27, 7, 13);
  // pads (rounded edges)
  ctx.fillStyle = '#34503a';
  ctx.fillRect(x - 3 * s, baseY - 53 * s, 6 * s, 7 * s);
  ctx.fillRect(x - 12 * s, baseY - 37 * s, 5 * s, 4 * s);
  ctx.fillRect(x + 9 * s, baseY - 30 * s, 5 * s, 4 * s);
  // highlights / spines
  ctx.fillStyle = '#5f7a4f';
  ctx.fillRect(x - 3 * s, baseY - 46 * s, 2 * s, 46 * s);
  ctx.fillRect(x - 10 * s, baseY - 35 * s, 2 * s, 15 * s);
  ctx.fillRect(x + 5 * s, baseY - 40 * s, 2 * s, 13 * s);
  ctx.fillStyle = '#c8b06a';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(x - 5 * s, baseY - (6 + i * 5) * s, s, s);
    if (i % 2 === 0) ctx.fillRect(x + 4 * s, baseY - (9 + i * 5) * s, s, s);
  }
  // flowers at night
  if (night) {
    ctx.fillStyle = '#e8a1b0';
    ctx.fillRect(x - 2 * s, baseY - 53 * s, 2 * s, 2 * s);
    ctx.fillRect(x - 4 * s, baseY - 51 * s, 2 * s, 2 * s);
  }
}

function drawTrough(ctx, pal) {
  rect(ctx, -8, 410, 58, 6, '#5a3223');
  rect(ctx, -8, 410, 58, 2, '#8a5137');
  rect(ctx, -6, 416, 54, 10, '#4a2922');
  rect(ctx, -4, 412, 50, 3, '#3f5c58');
  ctx.globalAlpha = 0.3;
  rect(ctx, -2, 413, 46, 2, '#a9c9c0');
  ctx.globalAlpha = 1;
  // hooves / hitching post
  rect(ctx, 40, 392, 4, 30, '#4a2922');
  rect(ctx, 40, 394, 38, 3, '#6b3d2b');
  rect(ctx, 76, 390, 4, 32, '#4a2922');
}

export function drawGround(ctx, pal, time, dayT) {
  // base street
  rect(ctx, 0, GROUND_Y - 4, W, H - GROUND_Y + 4, pal.ground);
  // perspective path
  const pathTop = GROUND_Y - 2, pathBot = H;
  for (let y = pathTop; y < pathBot; y += 4) {
    const t = (y - pathTop) / (pathBot - pathTop);
    const w = 80 + t * 240;
    const x = W / 2 - w / 2 + Math.sin(t * 3) * 8;
    rect(ctx, x, y, w, 4, pal.groundLight);
  }
  // horizontal dirt bands
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 6; i++) {
    const y = GROUND_Y + 12 + i * 26;
    rect(ctx, 0, y, W, 2, '#1c1016');
  }
  ctx.globalAlpha = 1;

  // wheel ruts
  ctx.globalAlpha = 0.25;
  for (const off of [-34, 12]) {
    for (let y = GROUND_Y + 6; y < H; y += 6) {
      const t = (y - GROUND_Y) / (H - GROUND_Y);
      const x = W / 2 + off * (0.5 + t * 1.4) + Math.sin(t * 4) * 4;
      rect(ctx, x, y, 2 + t * 4, 4, '#2f1b21');
    }
  }
  ctx.globalAlpha = 1;

  // pebbles & grass
  const r = mulberry32(77);
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = GROUND_Y + r() * (H - GROUND_Y);
    const big = r() > 0.9;
    rect(ctx, x, y, big ? 2 : 1, big ? 2 : 1, r() > 0.5 ? pal.groundDark : shade(pal.groundLight, 0.12));
  }
  // tufts
  for (let i = 0; i < 12; i++) {
    const x = r() * W, y = GROUND_Y + 30 + r() * 110;
    const c = '#7d6a3a';
    ctx.globalAlpha = 0.55;
    rect(ctx, x, y, 1, 4, c);
    rect(ctx, x + 2, y + 1, 1, 3, c);
    rect(ctx, x - 2, y + 2, 1, 2, c);
    ctx.globalAlpha = 1;
  }

  // long shadows from buildings
  const dark = 'rgba(25,12,20,0.25)';
  rect(ctx, 0, GROUND_Y, 70, 16, dark);
  rect(ctx, 220, GROUND_Y, 100, 14, dark);

  // night: window light pools on street
  if (dayT > 0.45) {
    const a = (dayT - 0.45) * 0.5;
    ctx.globalAlpha = Math.min(0.22, a);
    rect(ctx, 60, GROUND_Y + 4, 92, 44, '#c5813a');
    rect(ctx, 190, GROUND_Y + 4, 80, 40, '#c5813a');
    ctx.globalAlpha = 1;
  }
}

function drawDust(ctx, pal, time, dt) {
  for (const d of DUST) {
    const x = (d.x + time * d.vx) % (W + 20) - 10;
    const y = d.y + Math.sin(time * 0.8 + d.phase) * 3;
    ctx.globalAlpha = 0.16 + 0.1 * Math.sin(time + d.phase);
    rect(ctx, x, y, d.s, d.s, pal.haze);
  }
  ctx.globalAlpha = 1;
}

export function drawScene(ctx, pal, time, dayT, opts = {}) {
  drawSky(ctx, pal, time);
  drawMesas(ctx, pal);
  drawGround(ctx, pal, time, dayT);
  drawStore(ctx, pal, time, true);
  drawSaloon(ctx, pal, time, true);
  // street props
  drawBarrel(ctx, 18, 452, 1.15, pal);
  drawTrough(ctx, pal);
  drawCrate(ctx, 292, 452, 1.1, pal);
  drawWagon(ctx, pal);
  drawCactus(ctx, 296, 470, 0.8, pal, dayT > 0.6);
  drawCactus(ctx, 12, 466, 0.6, pal, dayT > 0.6);
  drawDust(ctx, pal, time);
  if (opts.tumbleweed) drawTumbleweed(ctx, opts.tumbleweed, pal);
}

export function drawTumbleweed(ctx, tw, pal) {
  const x = Math.round(tw.x), y = Math.round(tw.y), r = tw.r || 9;
  ctx.globalAlpha = tw.alpha ?? 1;
  // tangled pixel ball
  const pts = [
    [-r, 0], [-r + 2, -r / 2], [-2, -r], [r / 2, -r + 2], [r, -2], [r - 2, r / 2],
    [2, r], [-r / 2, r - 2], [-r + 3, 3], [4, -2], [-2, 3],
  ];
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 3) % pts.length];
    ctx.moveTo(x + p[0], y + p[1]);
    ctx.lineTo(x + q[0], y + q[1]);
  }
  ctx.stroke();
  ctx.fillStyle = '#a8895a';
  for (let i = 0; i < 6; i++) {
    const a = tw.spin + (i / 6) * Math.PI * 2;
    ctx.fillRect(Math.round(x + Math.cos(a) * r * 0.7), Math.round(y + Math.sin(a) * r * 0.7), 1, 1);
  }
  ctx.globalAlpha = 1;
}

export function drawForegroundVignette(ctx) {
  // darkened bottom corners to frame the play field
  ctx.fillStyle = 'rgba(12,6,12,0.32)';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 80);
  ctx.lineTo(42, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.lineTo(W, H - 80);
  ctx.lineTo(W - 42, H);
  ctx.closePath();
  ctx.fill();
}
