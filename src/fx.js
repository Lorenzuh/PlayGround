// Particles, tracers, floating score text and enemy bullets.
import { W } from './background.js';
import { drawText } from './font.js';
import { drawHatParticle } from './sprites.js';

export function addText(g, x, y, text, color = '#ffe6a8', scale = 1, dur = 0.9) {
  g.texts.push({ x, y, text, color, scale, t: 0, dur });
}

export function burst(g, x, y, opts = {}) {
  const {
    n = 12, colors = ['#f0c98a', '#b98a5a', '#fff0c0'], speed = 90, spread = Math.PI * 2,
    angle = -Math.PI / 2, gravity = 260, life = 0.55, size = 2,
  } = opts;
  for (let i = 0; i < n; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const s = speed * (0.25 + Math.random() * 0.9);
    g.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      g: gravity, life: life * (0.55 + Math.random() * 0.6), maxLife: life,
      color: colors[(Math.random() * colors.length) | 0],
      size: Math.random() > 0.82 ? size + 1 : size,
    });
  }
}

export function dustPuff(g, x, y, n = 7) {
  burst(g, x, y - 3, {
    n, colors: ['#c99a6a', '#a8794f', '#e0b98a'], speed: 38, spread: Math.PI * 1.4,
    angle: -Math.PI / 2, gravity: 60, life: 0.5, size: 2,
  });
}

export function addHat(g, x, y, color) {
  g.hats.push({
    x, y, vx: (Math.random() - 0.5) * 90, vy: -90 - Math.random() * 60,
    rot: 0, vr: (Math.random() - 0.5) * 8, color, t: 0, dur: 1.5,
  });
}

export function addTracer(g, x0, y0, x1, y1, color = '#ffe6a8') {
  g.tracers.push({ x0, y0, x1, y1, t: 0, dur: 0.11, color });
}

export function addEnemyBullet(g, x0, y0, x1, y1) {
  g.enemyBullets.push({ x0, y0, x1, y1, t: 0, dur: 0.34, hit: false });
}

export function updateEffects(g, dt) {
  for (const p of g.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
    p.vx *= 0.98;
  }
  g.particles = g.particles.filter((p) => p.life > 0);

  for (const t of g.texts) {
    t.t += dt;
    t.y -= dt * 26;
  }
  g.texts = g.texts.filter((t) => t.t < t.dur);

  for (const h of g.hats) {
    h.t += dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.vy += 300 * dt;
    h.rot += h.vr * dt;
  }
  g.hats = g.hats.filter((h) => h.t < h.dur);

  for (const tr of g.tracers) tr.t += dt;
  g.tracers = g.tracers.filter((t) => t.t < t.dur);

}

export function drawEffects(ctx, g) {
  // tracers (player)
  for (const tr of g.tracers) {
    const a = 1 - tr.t / tr.dur;
    ctx.globalAlpha = a;
    const dx = tr.x1 - tr.x0, dy = tr.y1 - tr.y0;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(2, Math.floor(len / 4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = tr.x0 + dx * t, y = tr.y0 + dy * t;
      ctx.fillStyle = i % 2 ? '#ffcf6b' : '#fff4cc';
      const s = i < steps * 0.35 ? 2 : 1;
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    // impact
    ctx.fillStyle = '#fff4cc';
    ctx.fillRect(Math.round(tr.x1) - 2, Math.round(tr.y1) - 1, 5, 2);
    ctx.fillRect(Math.round(tr.x1) - 1, Math.round(tr.y1) - 2, 2, 5);
    ctx.globalAlpha = 1;
  }

  // particles
  for (const p of g.particles) {
    const a = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.7)));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // enemy bullets with trail
  for (const b of g.enemyBullets) {
    const t = Math.min(1, b.t / b.dur);
    const x = b.x0 + (b.x1 - b.x0) * t;
    const y = b.y0 + (b.y1 - b.y0) * t + Math.sin(t * Math.PI) * -12;
    for (let i = 1; i <= 3; i++) {
      const tt = Math.max(0, t - i * 0.07);
      const tx = b.x0 + (b.x1 - b.x0) * tt;
      const ty = b.y0 + (b.y1 - b.y0) * tt + Math.sin(tt * Math.PI) * -12;
      ctx.globalAlpha = 0.55 - i * 0.13;
      ctx.fillStyle = '#ff9a4a';
      ctx.fillRect(Math.round(tx), Math.round(ty), 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe6a8';
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
    ctx.fillStyle = '#3a1a1a';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  // hats
  for (const h of g.hats) {
    const a = Math.min(1, h.t * 6) * Math.min(1, (h.dur - h.t) * 2);
    drawHatParticle(ctx, h.x, h.y, h.rot, h.color, a);
  }

  // floating text
  for (const t of g.texts) {
    const a = Math.min(1, t.t * 8) * Math.min(1, (t.dur - t.t) * 4);
    drawText(ctx, t.text, t.x, t.y, {
      align: 'center', scale: t.scale, color: t.color, outline: 1, alpha: a,
    });
  }
}

export function drawEnemyFuse(ctx, e, x, y, width, danger) {
  const ratio = Math.max(0, Math.min(1, e.fuse / e.maxFuse));
  ctx.fillStyle = 'rgba(18,10,16,0.85)';
  ctx.fillRect(Math.round(x - width / 2) - 1, Math.round(y) - 1, width + 2, 6);
  let color = '#f0b04a';
  if (e.type === 'civil') color = '#6fc3b8';
  if (ratio < 0.45) color = '#e8893a';
  if (ratio < 0.22) color = '#e0524a';
  if (danger && ratio < 0.35 && Math.sin(e.t * 20) > 0) color = '#fff0b0';
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), Math.round(width * ratio), 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), Math.round(width * ratio), 1);
  // fuse spark on the left edge of what's left
  if (e.type !== 'civil' && ratio > 0) {
    ctx.fillStyle = ratio < 0.35 ? '#fff0b0' : '#ffcf6b';
    const sx = Math.round(x - width / 2 + width * ratio);
    ctx.fillRect(sx - 1, Math.round(y) + 1, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export function drawGold(ctx, g) {
  if (!g.gold) return;
  const gold = g.gold;
  const left = gold.dur - gold.t;
  const blink = left < 1.5 ? (Math.sin(left * 22) > 0 ? 1 : 0.35) : 1;
  ctx.globalAlpha = blink;
  drawGoldIcon(ctx, gold.x, gold.y + Math.sin(gold.t * 4) * 2, g.time);
  ctx.globalAlpha = 1;
}

function drawGoldIcon(ctx, x, y, t) {
  // imported lazily to keep module graph simple
  const bob = 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.globalAlpha *= 0.18 + 0.06 * Math.sin(t * 5);
  ctx.fillStyle = '#ffcf6b';
  ctx.fillRect(-14, -14, 28, 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8a5e2c';
  ctx.fillRect(-9, 4, 18, 3);
  ctx.fillStyle = '#a97a3a';
  ctx.fillRect(-8, -6, 16, 12);
  ctx.fillRect(-5, -10, 10, 6);
  ctx.fillStyle = '#c99a4a';
  ctx.fillRect(-6, -4, 12, 9);
  ctx.fillStyle = '#f4d98a';
  ctx.fillRect(-3, -1, 6, 4);
  ctx.fillStyle = '#7a5222';
  ctx.fillRect(-1, -1, 2, 4);
  ctx.fillStyle = '#f5c25c';
  ctx.fillRect(-12, 8, 3, 3);
  ctx.fillRect(9, 7, 3, 3);
  ctx.restore();
}

export { W };
