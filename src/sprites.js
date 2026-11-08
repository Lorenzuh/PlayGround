// All characters and UI icons, drawn as chunky pixels.
import { shade } from './background.js';

function R(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function shadow(ctx, x, baseY, w, alpha = 0.28) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 4; i++) {
    const hw = (w / 2) * (1 - i * 0.18);
    R(ctx, x - hw, baseY - 2 + i * 2, hw * 2, 2, '#140a12');
  }
  ctx.globalAlpha = 1;
}

// ---------------- PLAYER (seen from behind) ----------------
export function playerGunTip(aim, cx, baseY) {
  const s = 2;
  const tx = cx + aim * 13 * s;
  const ty = baseY - 30 * s;
  return { x: tx, y: ty };
}

export function drawPlayer(ctx, cx, baseY, aim, time, opts = {}) {
  const s = 2;
  const flash = opts.flash || 0;
  const recoil = opts.recoil || 0;
  const bob = opts.moving ? Math.sin(time * 9) * 1 : 0;

  shadow(ctx, cx, baseY, 44, 0.3);

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(baseY + bob));

  const dark = '#241823';
  const pants = '#38303f';
  const pantsHi = '#4d4256';
  const poncho = '#9c3a3c';
  const ponchoDark = '#6f2630';
  const ponchoHi = '#c25a44';
  const gold = '#e0a34a';
  const teal = '#3f6f68';
  const hatDark = '#2a1c27';
  const hat = '#4a3030';
  const hatHi = '#74513f';
  const skin = '#a96b45';

  // legs
  R(ctx, -7, -12, 6, 10, pants);
  R(ctx, 1, -12, 6, 10, pants);
  R(ctx, -6, -12, 2, 10, pantsHi);
  R(ctx, 2, -12, 2, 10, pantsHi);
  // boots
  R(ctx, -9, -3, 8, 3, dark);
  R(ctx, 1, -3, 8, 3, dark);
  R(ctx, -9, -3, 8, 1, '#4a3238');
  R(ctx, 1, -3, 8, 1, '#4a3238');

  // serape body
  R(ctx, -13, -42, 26, 32, ponchoDark);
  R(ctx, -13, -42, 26, 4, ponchoHi);
  // jagged hem
  for (let i = 0; i < 5; i++) {
    R(ctx, -13 + i * 5, -12, 5, 3, i % 2 ? ponchoDark : poncho);
    R(ctx, -13 + i * 5, -10, 5, 2, ponchoDark);
  }
  // stripes
  R(ctx, -13, -34, 26, 3, gold);
  R(ctx, -13, -30, 26, 2, teal);
  R(ctx, -13, -25, 26, 2, '#e6d3a8');
  R(ctx, -13, -21, 26, 3, gold);
  R(ctx, -13, -16, 26, 2, teal);
  // side shading
  R(ctx, 9, -42, 4, 32, ponchoDark);
  R(ctx, -13, -42, 3, 32, ponchoHi);

  // left arm (relaxed)
  R(ctx, -17, -40, 5, 16, ponchoDark);
  R(ctx, -17, -34, 5, 8, poncho);
  R(ctx, -16, -26, 4, 3, skin);

  // head / neck
  R(ctx, -4, -50, 8, 10, '#7d4a34');
  R(ctx, -4, -48, 8, 7, '#2a1c27');
  R(ctx, -3, -48, 5, 2, '#3a2733');

  // right arm aiming
  const gunTip = playerGunTip(aim, 0, 0);
  const shoulderX = 11, shoulderY = -38;
  const ex = gunTip.x, ey = gunTip.y - 2;
  const mx = (shoulderX + ex) / 2, my = Math.min(shoulderY, ey) - 4;
  // draw arm as a thick pixel line
  pixelLine(ctx, shoulderX, shoulderY, ex, ey, 6, poncho);
  pixelLine(ctx, shoulderX, shoulderY, mx, my, 6, ponchoHi);
  R(ctx, ex - 3, ey - 3, 6, 6, skin);
  // sleeve cuff
  const ang = Math.atan2(ey - shoulderY, ex - shoulderX);
  R(ctx, ex - Math.cos(ang) * 7 - 2, ey - Math.sin(ang) * 7 - 2, 4, 4, gold);

  // revolver
  ctx.save();
  ctx.translate(ex + recoil * -3, ey + recoil * 1);
  R(ctx, -3, -1, 8, 4, '#5c6068');
  R(ctx, -3, -1, 8, 1, '#8b9099');
  R(ctx, 1, -4, 2, 3, '#3b3f48');
  R(ctx, 4, -2, 3, 6, '#3b3f48'); // grip
  R(ctx, 5, 1, 3, 4, '#6b4a34');
  // muzzle flash
  if (flash > 0) {
    const f = Math.min(1, flash * 6);
    ctx.globalAlpha = f;
    R(ctx, -10, -4, 8, 10, 'rgba(255,210,90,0.55)');
    R(ctx, -13, -2, 9, 6, '#ffcf5e');
    R(ctx, -17, 0, 8, 2, '#fff3c0');
    R(ctx, -12, -7, 3, 14, '#ffb23e');
    R(ctx, -16, -1, 4, 4, '#fff0b0');
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // hat
  R(ctx, -12, -58, 24, 6, hatDark);
  R(ctx, -12, -58, 24, 2, hat);
  R(ctx, -15, -55, 30, 3, hatDark);
  R(ctx, -15, -56, 30, 1, hat);
  R(ctx, -8, -68, 16, 11, hatDark);
  R(ctx, -7, -68, 14, 2, hat);
  R(ctx, -6, -66, 12, 2, '#8a6248');
  R(ctx, -8, -62, 16, 2, '#6a4438');
  R(ctx, -7, -62, 14, 2, '#c09055');
  R(ctx, -8, -61, 16, 1, '#3a2530');
  // rim light (sun behind)
  R(ctx, -15, -56, 3, 2, '#ffc06a');
  R(ctx, -8, -68, 2, 8, '#c89058');
  R(ctx, -13, -42, 2, 12, '#d07a4e');

  ctx.restore();
}

function pixelLine(ctx, x0, y0, x1, y1, thickness, color) {
  ctx.fillStyle = color;
  const steps = Math.max(2, Math.floor(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    ctx.fillRect(Math.round(x - thickness / 2), Math.round(y - thickness / 2), thickness, thickness);
  }
}

// ---------------- BANDIT ----------------
const BANDIT_PALS = [
  { poncho: '#b8443c', ponchoDark: '#7d2a30', ponchoHi: '#dc6a4c', band: '#e0a34a', trim: '#3f6f68' },
  { poncho: '#c2913e', ponchoDark: '#8a5f2a', ponchoHi: '#e3b95c', band: '#5b3a2a', trim: '#7a3a3a' },
  { poncho: '#3f726b', ponchoDark: '#28504d', ponchoHi: '#5f988a', band: '#e0a34a', trim: '#8a3a34' },
  { poncho: '#77506f', ponchoDark: '#51374f', ponchoHi: '#9a708d', band: '#e8c27a', trim: '#3f5c58' },
];

export function drawBandit(ctx, cx, baseY, unit, opts = {}) {
  const s = unit;
  const t = opts.time || 0;
  const pal = opts.pal || BANDIT_PALS[0];
  const flash = opts.flash || 0;
  const type = opts.type || 'bandit';
  const bob = opts.bob || 0;
  const firing = opts.firing || 0;
  const dead = opts.dead || 0;

  const skin = opts.skin || '#b97b50';
  const skinDark = shade(skin, -0.25);
  const hat = '#2b1b26';
  const hatHi = '#5a3a30';
  const pants = '#3a2c33';
  const pantsHi = '#514049';

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(baseY + bob));
  if (opts.rot) ctx.rotate(opts.rot);
  shadow(ctx, 0, 0, 34 * (unit / 2), 0.24);

  const fp = flash > 0;
  const C = (c) => (fp ? '#fff2d0' : c);
  const P = pal;

  if (type === 'civil') {
    drawCivilian(ctx, s, t, fp, opts);
    ctx.restore();
    return;
  }

  const boss = type === 'boss';
  const p = boss
    ? { poncho: '#8e2f33', ponchoDark: '#5f1c28', ponchoHi: '#c44a43', band: '#f0c15c', trim: '#e0a34a' }
    : P;

  // legs
  R(ctx, -7 * s / 2, -11 * s, 6 * s / 2, 9 * s, C(pants));
  R(ctx, 1 * s / 2, -11 * s, 6 * s / 2, 9 * s, C(pants));
  R(ctx, -6 * s / 2, -11 * s, 2 * s / 2, 9 * s, C(pantsHi));
  R(ctx, 2 * s / 2, -11 * s, 2 * s / 2, 9 * s, C(pantsHi));
  // boots
  R(ctx, -5 * s, -2 * s, 5 * s, 2 * s, C('#1d151c'));
  R(ctx, 0, -2 * s, 5 * s, 2 * s, C('#1d151c'));
  R(ctx, -5 * s, -2 * s, 5 * s, s, C('#4a3238'));
  R(ctx, 0, -2 * s, 5 * s, s, C('#4a3238'));

  // poncho
  const bodyTop = boss ? -23 * s : -22 * s;
  const bodyBottom = -9 * s;
  R(ctx, -8 * s / 2 * 2, bodyTop, 16 * s, -bodyTop + bodyBottom, C(p.ponchoDark));
  R(ctx, -8 * s, bodyTop, 16 * s, 3 * s, C(p.ponchoHi));
  // jagged hem
  for (let i = 0; i < 4; i++) {
    R(ctx, (-8 + i * 4) * s, bodyBottom, 4 * s, 2 * s, C(i % 2 ? p.poncho : p.ponchoDark));
  }
  // stripes
  R(ctx, -8 * s, bodyTop + 4 * s, 16 * s, 2 * s, C(p.band));
  R(ctx, -8 * s, bodyTop + 8 * s, 16 * s, s, C(p.trim));
  R(ctx, -8 * s, bodyTop + 12 * s, 16 * s, 2 * s, C(p.band));
  // belt
  R(ctx, -8 * s, bodyBottom + 1 * s, 16 * s, 2 * s, C('#2a1a20'));
  if (boss) {
    R(ctx, -2 * s, bodyBottom + s, 4 * s, 3 * s, C('#f0c15c'));
    R(ctx, -1 * s, bodyBottom + 1.4 * s, 2 * s, 1.4 * s, C('#8a2f2f'));
  }

  // arms
  const armSwing = Math.sin(t * 2.2 + (opts.seed || 0)) * 1;
  R(ctx, -11 * s, bodyTop + 3 * s + armSwing, 3 * s, 10 * s, C(p.ponchoDark));
  R(ctx, -11 * s, bodyTop + 3 * s + armSwing, 2 * s, 6 * s, C(p.poncho));
  // gun arm extended toward the player (down-left)
  R(ctx, -13 * s, bodyTop + 8 * s, 6 * s, 3 * s, C(p.poncho));
  R(ctx, -14 * s, bodyTop + 9 * s, 2 * s, 2 * s, C(skin));
  // revolver
  R(ctx, -17 * s, bodyTop + 9 * s, 5 * s, s, C('#5c6068'));
  R(ctx, -17 * s, bodyTop + 9 * s, 3 * s, s, C('#8b9099'));
  R(ctx, -14 * s, bodyTop + 10 * s, s, 2 * s, C('#3b3f48'));
  // muzzle flash when firing
  if (firing > 0) {
    ctx.globalAlpha = Math.min(1, firing * 5);
    R(ctx, -23 * s, bodyTop + 7 * s, 7 * s, 5 * s, '#ffcf5e');
    R(ctx, -26 * s, bodyTop + 9 * s, 8 * s, s, '#fff3c0');
    R(ctx, -22 * s, bodyTop + 6 * s, 4 * s, 7 * s, '#ffb23e');
    ctx.globalAlpha = 1;
  }

  // bandolier
  if (boss || (opts.seed || 0) % 2 > 1) {
    ctx.save();
    ctx.translate(0, 0);
    ctx.strokeStyle = fp ? '#fff2d0' : '#e0a34a';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-7 * s, bodyTop + 2 * s);
    ctx.lineTo(7 * s, bodyBottom);
    ctx.stroke();
    ctx.restore();
  }

  // head
  R(ctx, -4 * s, -30 * s, 8 * s, 9 * s, C(skin));
  R(ctx, -4 * s, -30 * s, 2 * s, 9 * s, C(skinDark));
  // eyes
  const blink = Math.sin(t * 1.7 + (opts.seed || 0) * 3) > 0.985;
  if (!blink) {
    R(ctx, -3 * s, -27.5 * s, 2 * s, s, C('#1a1116'));
    R(ctx, 1 * s, -27.5 * s, 2 * s, s, C('#1a1116'));
    R(ctx, -3 * s, -27.5 * s, s, s, C('#f4d6a0'));
    R(ctx, 1 * s, -27.5 * s, s, s, C('#f4d6a0'));
  }
  // bandana / beard
  R(ctx, -4 * s, -24 * s, 8 * s, 3 * s, C('#8a2f35'));
  R(ctx, -4 * s, -24 * s, 8 * s, s, C('#b8443c'));
  R(ctx, -2 * s, -22 * s, 4 * s, s, C('#5a2028'));
  if (boss) {
    // scar + gold tooth
    R(ctx, 2 * s, -29 * s, s, 4 * s, C('#8a5a48'));
    R(ctx, -1 * s, -21.5 * s, s, s, C('#f0e0a0'));
  }

  // sombrero
  const brimW = boss ? 13 : 11;
  R(ctx, -brimW * s, -33 * s, brimW * 2 * s, 2 * s, C(hat));
  R(ctx, -brimW * s, -33 * s, brimW * 2 * s, s, C(hatHi));
  R(ctx, -brimW * s + s, -34 * s, brimW * 2 * s - 2 * s, 2 * s, C(hat));
  R(ctx, -4.5 * s, -37 * s, 9 * s, 5 * s, C(hat));
  R(ctx, -4.5 * s, -37 * s, 3 * s, 2 * s, C(hatHi));
  R(ctx, -5 * s, -34 * s, 10 * s, 2 * s, C('#c59450'));
  R(ctx, -5 * s, -34 * s, 10 * s, s, C('#7a5a3a'));
  if (boss) {
    // bandit king crown pin
    R(ctx, -2 * s, -36.5 * s, 4 * s, 2 * s, C('#f0c15c'));
    R(ctx, -s, -36 * s, 2 * s, s, C('#8e2f33'));
  }
  // cigar ember
  if (opts.cigar) {
    const glow = 0.6 + 0.4 * Math.sin(t * 6 + (opts.seed || 0) * 4);
    ctx.globalAlpha = glow;
    R(ctx, 2 * s, -21 * s, 3 * s, s, '#e86a3a');
    R(ctx, 5 * s, -21 * s, s, s, '#ffcf5e');
    ctx.globalAlpha = 0.16 * glow;
    R(ctx, 1 * s, -23 * s, 7 * s, 8 * s, '#ff8a3a');
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ---------------- CIVILIAN ----------------
function drawCivilian(ctx, s, t, fp, opts) {
  const C = (c) => (fp ? '#fff2d0' : c);
  const dress = '#4f7d8c';
  const dressDark = '#335a69';
  const dressHi = '#7aa8b2';
  const apron = '#e8dcc0';
  const skin = '#d9a077';
  const bonnet = '#efe3c6';
  const bonnetShade = '#c9b08c';

  // skirt
  R(ctx, -8 * s, -12 * s, 16 * s, 10 * s, C(dressDark));
  R(ctx, -7 * s, -15 * s, 14 * s, 12 * s, C(dress));
  R(ctx, -6 * s, -15 * s, 3 * s, 10 * s, C(dressHi));
  R(ctx, -4 * s, -12 * s, 8 * s, 9 * s, C(apron));
  R(ctx, -4 * s, -12 * s, 8 * s, s, C('#f4ecd8'));
  // hem
  for (let i = 0; i < 4; i++) R(ctx, (-8 + i * 4) * s, -2 * s, 4 * s, 2 * s, C(dressDark));

  // torso
  R(ctx, -4 * s, -22 * s, 8 * s, 8 * s, C(dress));
  R(ctx, -4 * s, -22 * s, 2 * s, 8 * s, C(dressHi));
  // arms raised, waving
  const wave = Math.sin(t * 6 + (opts.seed || 0)) * 2;
  R(ctx, -7 * s, -24 * s, 3 * s, 7 * s, C(dress));
  R(ctx, 4 * s, -24 * s, 3 * s, 7 * s, C(dress));
  R(ctx, -7 * s, -27 * s + wave, 3 * s, 4 * s, C(skin));
  R(ctx, 4 * s, -27 * s - wave, 3 * s, 4 * s, C(skin));

  // head
  R(ctx, -3.5 * s, -30 * s, 7 * s, 7 * s, C(skin));
  R(ctx, -3.5 * s, -30 * s, 2 * s, 7 * s, C('#bd7f58'));
  R(ctx, -2 * s, -27.5 * s, s, s, C('#2a1a20'));
  R(ctx, 2 * s, -27.5 * s, s, s, C('#2a1a20'));
  R(ctx, -s, -26 * s, 2 * s, s, C('#b05a4a'));
  // bonnet
  R(ctx, -5 * s, -34 * s, 10 * s, 4 * s, C(bonnet));
  R(ctx, -5 * s, -31 * s, 10 * s, 2 * s, C(bonnetShade));
  R(ctx, -5 * s, -34 * s, 3 * s, 3 * s, C('#fbf3dd'));
  R(ctx, -5 * s, -31 * s, s, 5 * s, C(bonnetShade));
  R(ctx, 4 * s, -31 * s, s, 5 * s, C(bonnetShade));
  // flower
  R(ctx, 3 * s, -34 * s, 2 * s, 2 * s, C('#d86a78'));
  R(ctx, 3.5 * s, -34.5 * s, s, s, C('#f4c0b0'));
  // basket
  R(ctx, -10 * s, -13 * s, 4 * s, 5 * s, C('#8a5a35'));
  R(ctx, -10 * s, -13 * s, 4 * s, s, C('#b9814a'));
  R(ctx, -9 * s, -15 * s, 2 * s, 2 * s, C('#8a5a35'));
}

// ---------------- PROPS / UI ICONS ----------------
export function drawHeart(ctx, x, y, scale, filled, alpha = 1) {
  const map = [
    '0110110',
    '1111111',
    '1111111',
    '0111110',
    '0011100',
    '0001000',
  ];
  ctx.globalAlpha = alpha;
  const c = filled ? '#e0524a' : 'rgba(40,22,30,0.75)';
  const hi = filled ? '#ff8a6a' : 'rgba(70,40,48,0.7)';
  for (let gy = 0; gy < map.length; gy++) {
    for (let gx = 0; gx < map[gy].length; gx++) {
      if (map[gy][gx] === '1') {
        R(ctx, x + gx * scale, y + gy * scale, scale, scale, c);
      }
    }
  }
  if (filled) {
    R(ctx, x + scale, y + scale, scale, scale, hi);
    R(ctx, x + scale * 2, y + scale, scale, scale, hi);
  }
  // outline bottom for depth
  ctx.globalAlpha = alpha * 0.5;
  R(ctx, x + scale * 2, y + 6 * scale, scale * 3, scale, '#5a1a24');
  ctx.globalAlpha = 1;
}

export function drawAmmoCylinder(ctx, cx, cy, r, ammo, maxAmmo, time, reloading, progress) {
  // outer dark rim with pixel ring
  for (let dy = -r; dy < r; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    R(ctx, cx - half, cy + dy, half * 2, 2, '#2a1a22');
  }
  for (let dy = -r + 3; dy < r - 3; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, (r - 3) * (r - 3) - dy * dy)));
    R(ctx, cx - half, cy + dy, half * 2, 2, '#8a6c50');
  }
  for (let dy = -r + 6; dy < r - 6; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, (r - 6) * (r - 6) - dy * dy)));
    R(ctx, cx - half, cy + dy, half * 2, 2, '#5d4a3c');
  }
  // chambers
  const spin = reloading ? progress * Math.PI * 4 : 0;
  for (let i = 0; i < maxAmmo; i++) {
    const a = (i / maxAmmo) * Math.PI * 2 - Math.PI / 2 + spin;
    const px = cx + Math.cos(a) * (r - 8);
    const py = cy + Math.sin(a) * (r - 8);
    const loaded = i < ammo;
    R(ctx, px - 3, py - 3, 6, 6, loaded ? '#f5c25c' : '#241820');
    if (loaded) {
      R(ctx, px - 2, py - 2, 2, 2, '#fff0b0');
      R(ctx, px + 1, py + 1, 2, 2, '#a8742c');
    }
  }
  // center pin
  R(ctx, cx - 3, cy - 3, 6, 6, '#3a2a2a');
  R(ctx, cx - 1, cy - 1, 2, 2, '#b9975e');
  // reload sweep
  if (reloading) {
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 6; i++) {
      const a = progress * Math.PI * 2 + (i / 6) * Math.PI * 2;
      R(ctx, cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), 2, 2, '#ffe08a');
    }
    ctx.globalAlpha = 1;
  }
  // full glow
  if (ammo === maxAmmo && !reloading) {
    ctx.globalAlpha = 0.14 + 0.06 * Math.sin(time * 3);
    for (let dy = -r - 2; dy < r + 2; dy += 2) {
      const half = Math.floor(Math.sqrt(Math.max(0, (r + 2) * (r + 2) - dy * dy)));
      R(ctx, cx - half, cy + dy, half * 2, 2, '#ffcf6b');
    }
    ctx.globalAlpha = 1;
  }
}

export function drawEyeButton(ctx, cx, cy, w, h, fill, time, ready) {
  // pixel eye outline
  const rows = [
    { y: -h / 2, from: -w * 0.2, to: w * 0.2, t: 2 },
    { y: -h / 2 + 2, from: -w * 0.34, to: w * 0.34, t: 2 },
    { y: -h / 2 + 4, from: -w * 0.44, to: w * 0.44, t: 2 },
    { y: -2, from: -w / 2, to: w / 2, t: 2 },
    { y: 2, from: -w * 0.44, to: w * 0.44, t: 2 },
    { y: 4, from: -w * 0.34, to: w * 0.34, t: 2 },
    { y: h / 2 - 2, from: -w * 0.2, to: w * 0.2, t: 2 },
  ];
  for (const r of rows) R(ctx, cx + r.from, cy + r.y, r.to - r.from, r.t, '#2a1a22');
  // inner sclera
  for (let i = 1; i < rows.length - 1; i++) {
    const r = rows[i];
    R(ctx, cx + r.from + 2, cy + r.y, r.to - r.from - 4, 2, '#d8cbb0');
  }
  // iris fill = meter
  const irisR = 5;
  const fillN = Math.max(0, Math.min(1, fill / 100));
  for (let dy = -irisR; dy <= irisR; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, irisR * irisR - dy * dy)));
    R(ctx, cx - half, cy + dy, half * 2, 2, '#3f2a24');
  }
  const irisH = Math.round(irisR * 2 * fillN);
  if (irisH > 0) {
    for (let dy = irisR - irisH; dy <= irisR; dy += 2) {
      if (dy < -irisR) continue;
      const half = Math.floor(Math.sqrt(Math.max(0, irisR * irisR - dy * dy)));
      R(ctx, cx - half, cy + dy, half * 2, 2, ready ? '#ffd76a' : '#c98a3e');
    }
  }
  // pupil
  R(ctx, cx - 2, cy - 2, 4, 4, '#100b12');
  R(ctx, cx - 1, cy - 1, 2, 2, '#ffedb0');
  // sparkle when ready
  if (ready) {
    const tw = 0.55 + 0.45 * Math.sin(time * 6);
    ctx.globalAlpha = tw;
    R(ctx, cx + 4, cy - 6, 2, 2, '#fff4c8');
    R(ctx, cx + 3, cy - 7, 1, 4, '#fff4c8');
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.16 + 0.08 * tw;
    R(ctx, cx - w / 2 - 3, cy - h / 2 - 3, w + 6, h + 6, '#ffcf6b');
    ctx.globalAlpha = 1;
  }
}

export function drawHudPanel(ctx, x, y, w, h, pal) {
  ctx.globalAlpha = 0.82;
  R(ctx, x, y, w, h, '#1b1020');
  ctx.globalAlpha = 1;
  R(ctx, x, y + h - 2, w, 2, '#6b4a32');
  R(ctx, x, y + h - 3, w, 1, '#a8753e');
}

export function drawGoldSack(ctx, cx, cy, t) {
  const bob = Math.sin(t * 4) * 2;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy + bob));
  // glow
  ctx.globalAlpha = 0.15 + 0.06 * Math.sin(t * 5);
  R(ctx, -14, -14, 28, 28, '#ffcf6b');
  ctx.globalAlpha = 1;
  // bag
  R(ctx, -8, -6, 16, 14, '#a97a3a');
  R(ctx, -7, -8, 14, 4, '#c79a52');
  R(ctx, -4, -11, 8, 5, '#8a5e2c');
  R(ctx, -2, -12, 4, 3, '#6b4520');
  R(ctx, -6, -5, 12, 10, '#c99a4a');
  R(ctx, -2, -3, 4, 6, '#7a5222');
  R(ctx, -3, -1, 6, 3, '#f4d98a');
  // gold coins
  R(ctx, -12, 8, 3, 3, '#f5c25c');
  R(ctx, 8, 7, 3, 3, '#f5c25c');
  R(ctx, 10, 10, 2, 2, '#e0a34a');
  ctx.restore();
}

export function drawHatParticle(ctx, x, y, rot, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(rot);
  R(ctx, -8, 0, 16, 4, color);
  R(ctx, -5, -5, 10, 5, color);
  R(ctx, -5, -5, 10, 1, shade(color, 0.25));
  ctx.restore();
}

export function drawSkull(ctx, cx, cy, s) {
  const map = [
    '0111110',
    '1111111',
    '1101011',
    '1101011',
    '1111111',
    '0111110',
    '0101010',
    '0101010',
  ];
  for (let gy = 0; gy < map.length; gy++) {
    for (let gx = 0; gx < 7; gx++) {
      if (map[gy][gx] === '1') R(ctx, cx + (gx - 3.5) * s, cy + (gy - 4) * s, s, s, '#e8dcc0');
    }
  }
  R(ctx, cx - s * 1.5, cy - s * 1.5, s, s, '#2a1a20');
  R(ctx, cx + s * 0.5, cy - s * 1.5, s, s, '#2a1a20');
}

export function drawPauseIcon(ctx, cx, cy, color) {
  R(ctx, cx - 4, cy - 6, 3, 12, color);
  R(ctx, cx + 1, cy - 6, 3, 12, color);
}

export function drawSoundIcon(ctx, cx, cy, muted, color) {
  R(ctx, cx - 7, cy - 2, 4, 5, color);
  R(ctx, cx - 3, cy - 4, 2, 9, color);
  if (muted) {
    R(ctx, cx + 2, cy - 4, 2, 2, color);
    R(ctx, cx + 4, cy - 2, 2, 2, color);
    R(ctx, cx + 4, cy, 2, 2, color);
    R(ctx, cx + 2, cy + 2, 2, 2, color);
  } else {
    R(ctx, cx + 1, cy - 4, 1, 2, color);
    R(ctx, cx + 3, cy - 2, 1, 4, color);
    R(ctx, cx + 5, cy - 4, 1, 8, color);
  }
}
