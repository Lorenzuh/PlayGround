// Frame composition: world, characters, effects, HUD and screens.
import {
  W, H, SCENE, paletteFor, drawScene, drawForegroundVignette,
} from './background.js';
import { drawText } from './font.js';
import { drawPlayer, drawBandit } from './sprites.js';
import {
  drawHUD, drawBanner, drawHint, drawDeadEyeOverlay, drawDamage,
  drawTitle, drawGameOver, drawPause,
} from './ui.js';
import { drawEffects, drawEnemyFuse, drawGold } from './fx.js';

const WINDOW_OFFSET = 22;
const PLAYER_X = 160;
const PLAYER_BASE = 544;

function slotClip(e) {
  if (e.slot === 'winL') return SCENE.windows[0];
  if (e.slot === 'winR') return SCENE.windows[1];
  if (e.slot === 'store') return SCENE.storeWindow;
  return null;
}

function drawEnemy(ctx, g, e) {
  const clip = slotClip(e);
  const base = e.baseY + (clip ? WINDOW_OFFSET : 0);
  const rise = e.state === 'rise' ? (1 - easeOut(Math.min(1, e.t / e.riseDur))) * (clip ? 24 : 14) : 0;
  const sink = e.state === 'leaving' ? e.leaveT * 34 : 0;
  const dying = e.state === 'dying' ? e.deadT : 0;
  const dustAlpha = e.state === 'dying' ? Math.max(0, 1 - dying / 0.55) : 1;

  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(clip.x - 1, clip.y, clip.w + 2, clip.h);
    ctx.clip();
  }
  if (dying > 0 && !clip) {
    const dir = e.knockDir || 1;
    ctx.translate(e.x, base);
    ctx.rotate(dying * 2.4 * dir);
    ctx.translate(-e.x, -base);
    ctx.globalAlpha = dustAlpha;
  }
  if (dying > 0 && clip) {
    ctx.globalAlpha = Math.max(0, 1 - dying / 0.45);
  }
  if (e.state === 'rise' && !clip) ctx.globalAlpha = 0.5 + 0.5 * (1 - rise / 14);
  drawBandit(ctx, e.x, base + rise + sink, e.unit, {
    time: e.animT,
    pal: e.pal,
    flash: e.flash,
    type: e.type,
    firing: e.state === 'firing' ? 1 : 0,
    cigar: e.cigar,
    seed: e.seed,
    skin: e.skin,
  });
  ctx.restore();
}

function easeOut(t) { return 1 - Math.pow(1 - t, 2); }

function drawEnemies(ctx, g) {
  const list = [...g.enemies].sort((a, b) => a.baseY - b.baseY);
  for (const e of list) {
    drawEnemy(ctx, g, e);
    if (e.state === 'active') {
      const clip = slotClip(e);
      let bx = e.x;
      let by;
      let barW;
      if (clip) {
        by = clip.y - 11;
        barW = clip.w - 6;
      } else if (e.type === 'boss') {
        by = e.baseY - e.unit * 38 - 12;
        barW = 46;
      } else {
        by = e.baseY - e.unit * 38 - 10;
        barW = 30;
      }
      drawEnemyFuse(ctx, e, bx, by, barW, e.fuse < 0.9);
      if (e.type === 'civil') {
        drawText(ctx, '!', bx + barW / 2 + 5, by - 1, { align: 'center', scale: 1, color: '#8fe0d4' });
      }
    }
  }
}

function drawPlayerSprite(ctx, g) {
  // soft long shadow
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#140a12';
  ctx.fillRect(PLAYER_X - 24, PLAYER_BASE - 2, 48, 5);
  ctx.fillRect(PLAYER_X - 16, PLAYER_BASE + 3, 32, 3);
  ctx.globalAlpha = 1;
  drawPlayer(ctx, PLAYER_X, PLAYER_BASE, g.aim, g.time, {
    flash: g.muzzle,
    recoil: g.recoil,
    moving: false,
  });
}

function drawTitleAmbience(ctx, g) {
  // one outlaw peeking through the saloon window, purely decorative
  const win = SCENE.windows[0];
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x - 1, win.y, win.w + 2, win.h);
  ctx.clip();
  drawBandit(ctx, 101, 292 + WINDOW_OFFSET, 2, {
    time: g.time * 0.5, pal: { poncho: '#b8443c', ponchoDark: '#7d2a30', ponchoHi: '#dc6a4c', band: '#e0a34a', trim: '#3f6f68' },
    cigar: true, seed: 3, skin: '#b97b50',
  });
  ctx.restore();
}

export function renderGame(ctx, g) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0d0710';
  ctx.fillRect(0, 0, W, H);

  const sx = g.shake > 0.2 ? Math.round((Math.random() - 0.5) * g.shake) : 0;
  const sy = g.shake > 0.2 ? Math.round((Math.random() - 0.5) * g.shake) : 0;

  ctx.save();
  ctx.translate(sx, sy);

  const pal = paletteFor(g.dayT);
  drawScene(ctx, pal, g.time, g.dayT, { tumbleweed: g.tumbleweed });

  if (g.mode === 'title') drawTitleAmbience(ctx, g);

  drawGold(ctx, g);

  if (g.mode !== 'title') drawEnemies(ctx, g);

  if (g.mode !== 'title') drawPlayerSprite(ctx, g);

  drawEffects(ctx, g);
  ctx.restore();

  drawForegroundVignette(ctx);

  if (g.mode === 'play' || g.mode === 'paused') {
    drawDeadEyeOverlay(ctx, g);
    drawDamage(ctx, g);
    drawHUD(ctx, g);
    drawBanner(ctx, g);
    drawHint(ctx, g);
  }

  if (g.mode === 'title') drawTitle(ctx, g);
  else if (g.mode === 'gameover') drawGameOver(ctx, g);
  else if (g.mode === 'paused') drawPause(ctx, g);
}
