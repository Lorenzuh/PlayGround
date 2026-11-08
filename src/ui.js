// HUD, overlays and full screens.
import { W, H, shade } from './background.js';
import { drawText, textWidth } from './font.js';
import {
  drawHeart, drawAmmoCylinder, drawEyeButton, drawGoldSack,
  drawSkull, drawPauseIcon, drawSoundIcon,
} from './sprites.js';

export const TOP_UI = {
  pause: { x: 6, y: 7, w: 24, h: 24 },
  mute: { x: 32, y: 7, w: 24, h: 24 },
  reload: { x: 6, y: 494, w: 66, h: 66 },
  deadeye: { x: 248, y: 494, w: 68, h: 66 },
};

export const TITLE_UI = {
  mute: { x: 284, y: 28, w: 28, h: 26 },
};

export const PAUSE_UI = {
  sound: { x: 82, y: 300, w: 156, h: 34 },
  restart: { x: 82, y: 348, w: 156, h: 34 },
  resume: { x: 82, y: 244, w: 156, h: 38 },
};

export const GAMEOVER_UI = {
  restart: { x: 38, y: 350, w: 244, h: 52 },
  home: { x: 98, y: 414, w: 124, h: 30 },
  mute: { x: 284, y: 28, w: 28, h: 26 },
};

function ribbon(ctx, x, y, w, h, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20,10,18,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#3a2026';
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillStyle = '#d9a24a';
  ctx.fillRect(x, y + 2, 2, h - 4);
  ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
  // corner notches
  ctx.fillStyle = 'rgba(8,4,10,0.9)';
  ctx.fillRect(x, y, 4, 3);
  ctx.fillRect(x + w - 4, y, 4, 3);
  ctx.fillRect(x, y + h - 3, 4, 3);
  ctx.fillRect(x + w - 4, y + h - 3, 4, 3);
  ctx.globalAlpha = 1;
}

function iconButton(ctx, r, active = false) {
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = active ? '#6a3f28' : '#1c1120';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(240,200,120,0.28)';
  ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
  ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
}

// ---------------------------------------------------------------- HUD
export function drawHUD(ctx, g) {
  const t = g.time;
  // top bar
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = '#160d18';
  ctx.fillRect(0, 0, W, 56);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,214,120,0.16)';
  ctx.fillRect(0, 0, W, 1);
  ctx.fillStyle = '#7a5232';
  ctx.fillRect(0, 54, W, 1);
  ctx.fillStyle = 'rgba(255,205,107,0.28)';
  ctx.fillRect(0, 55, W, 1);

  iconButton(ctx, TOP_UI.pause);
  drawPauseIcon(ctx, TOP_UI.pause.x + 12, TOP_UI.pause.y + 12, '#e8c98e');
  iconButton(ctx, TOP_UI.mute);
  drawSoundIcon(ctx, TOP_UI.mute.x + 12, TOP_UI.mute.y + 12, g.muted, g.muted ? '#c08a62' : '#e8c98e');

  // hearts
  for (let i = 0; i < g.maxHearts; i++) {
    const filled = i < g.hearts;
    drawHeart(ctx, 10 + i * 17, 34, 2, filled, filled ? 1 : 0.65);
  }

  // wave + combo
  drawText(ctx, `ONDA ${g.wave}`, W / 2, 8, { align: 'center', scale: 1, color: '#d8b98a', outline: 1 });
  if (g.combo >= 3) {
    const pulse = 1 + Math.sin(t * 8) * 0.04;
    drawText(ctx, `X${g.multiplier}`, W / 2, 22, {
      align: 'center', scale: 2, color: '#ffcf6b', outline: 1, alpha: 0.85 + 0.15 * Math.sin(t * 6),
    });
    drawText(ctx, 'COMBO', W / 2, 42, { align: 'center', scale: 1, color: '#b98a5a' });
    void pulse;
  } else {
    drawText(ctx, 'FAROESTE', W / 2, 25, { align: 'center', scale: 1, color: 'rgba(200,160,120,0.42)' });
  }

  // score
  const scoreStr = String(g.score).padStart(5, '0');
  drawText(ctx, scoreStr, W - 10, 9, { align: 'right', scale: 2, color: '#f4e3ba', outline: 1 });
  drawText(ctx, 'PONTOS', W - 10, 27, { align: 'right', scale: 1, color: '#a87a52' });
  if (g.best > 0) {
    drawText(ctx, `REC ${String(g.best).padStart(5, '0')}`, W - 10, 41, { align: 'right', scale: 1, color: 'rgba(190,150,105,0.55)' });
  }

  // bottom affordances
  // reload / cylinder
  const cyl = TOP_UI.reload;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#180e16';
  ctx.fillRect(cyl.x, cyl.y, cyl.w, cyl.h);
  ctx.globalAlpha = 1;
  if (g.ammo < g.maxAmmo && !g.reloading) {
    const a = 0.16 + 0.08 * Math.sin(t * 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffcf6b';
    ctx.fillRect(cyl.x, cyl.y, cyl.w, cyl.h);
    ctx.globalAlpha = 1;
  }
  drawAmmoCylinder(ctx, 39, 523, 19, g.reloading ? 0 : g.ammo, g.maxAmmo, t, g.reloading, g.reloadProgress);
  aLabel(ctx, g.reloading ? 'RECARGA' : g.ammo === 0 ? 'VAZIO!' : 'BALAS', 39, 548, g);

  // deadeye
  const eye = TOP_UI.deadeye;
  const ready = g.deadeEye >= 100 && !g.deadEyeActive;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#180e16';
  ctx.fillRect(eye.x, eye.y, eye.w, eye.h);
  ctx.globalAlpha = 1;
  drawEyeButton(ctx, 281, 518, 32, 18, g.deadEyeActive ? (g.deadEyeTimer / 5) * 100 : g.deadEye, t, ready);
  // meter bar
  ctx.fillStyle = '#241621';
  ctx.fillRect(263, 534, 37, 4);
  const fillW = Math.round(35 * Math.max(0, Math.min(1, (g.deadEyeActive ? g.deadEyeTimer / 5 : g.deadEye / 100))));
  ctx.fillStyle = ready || g.deadEyeActive ? '#ffcf6b' : '#a8743a';
  ctx.fillRect(264, 535, fillW, 2);
  aLabel(ctx, g.deadEyeActive ? 'LENTO' : ready ? 'PRONTO!' : 'OLHO', 281, 548, g, ready);

  // reload text centre
  if (g.reloading) {
    const dots = '.'.repeat(1 + Math.floor(t * 4) % 3);
    drawText(ctx, 'RECARREGANDO' + dots, W / 2, 450, {
      align: 'center', scale: 1, color: '#ffd98c', outline: 1, alpha: 0.9,
    });
  } else if (g.ammo === 0) {
    drawText(ctx, 'TOQUE NA CILINDRO!', W / 2, 450, {
      align: 'center', scale: 1, color: '#ff8a6a', outline: 1, alpha: 0.6 + 0.4 * Math.sin(t * 8),
    });
  }

  if (ready && g.readyHintT > 0) {
    drawText(ctx, 'OLHO DE FALCAO PRONTO', W / 2, 66, {
      align: 'center', scale: 1, color: '#ffe09a', outline: 1, alpha: Math.min(1, g.readyHintT) * (0.65 + 0.35 * Math.sin(t * 7)),
    });
  }
}

function aLabel(ctx, text, cx, y, g, flash = false) {
  drawText(ctx, text, cx, y, {
    align: 'center', scale: 1,
    color: flash ? '#ffe09a' : 'rgba(210,170,120,0.7)',
    outline: 1,
    alpha: flash ? 0.7 + 0.3 * Math.sin(g.time * 8) : 1,
  });
}

// ---------------------------------------------------------------- banner / hint
export function drawBanner(ctx, g) {
  if (!g.banner || g.banner.t <= 0) return;
  const b = g.banner;
  const total = b.dur;
  const t = b.t;
  const fadeIn = Math.min(1, (total - t) / 0.25);
  const fadeOut = Math.min(1, t / 0.45);
  const a = Math.min(fadeIn, fadeOut);
  const y = 218 + (1 - fadeIn) * 8;
  ribbon(ctx, 40, y, 240, 72, a * 0.96);
  ctx.globalAlpha = a;
  drawText(ctx, b.title, W / 2, y + 12, { align: 'center', scale: 3, color: '#f4d08a', outline: 1 });
  drawText(ctx, b.sub, W / 2, y + 48, { align: 'center', scale: 1, color: b.warn ? '#ff8a6a' : '#c9a06c' });
  ctx.globalAlpha = 1;
}

export function drawHint(ctx, g) {
  if (!g.hint || g.hint.t <= 0) return;
  const h = g.hint;
  const a = Math.min(1, h.t, (h.dur - h.t) * 5);
  const w = textWidth(h.text, 1) + 22;
  ctx.globalAlpha = a * 0.85;
  ctx.fillStyle = '#1a0f18';
  ctx.fillRect(W / 2 - w / 2, 436, w, 16);
  ctx.fillStyle = 'rgba(240,200,120,0.35)';
  ctx.fillRect(W / 2 - w / 2, 436, w, 1);
  ctx.globalAlpha = a;
  drawText(ctx, h.text, W / 2, 440, { align: 'center', scale: 1, color: '#f0d6a6' });
  ctx.globalAlpha = 1;
}

export function drawDeadEyeOverlay(ctx, g) {
  if (!g.deadEyeActive) return;
  const p = Math.max(0, Math.min(1, g.deadEyeTimer / 5));
  ctx.fillStyle = 'rgba(24,10,44,0.30)';
  ctx.fillRect(0, 0, W, H);
  // golden frame breathing
  const inset = 3 + Math.round((1 - p) * 2);
  ctx.strokeStyle = `rgba(255,205,107,${0.16 + 0.1 * Math.sin(g.time * 5)})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  // speed streaks
  const rand = pseudo(g.time * 30);
  for (let i = 0; i < 8; i++) {
    const y = 80 + ((rand(i) * 340 + g.time * 40 * (0.4 + rand(i + 9))) % 360);
    const len = 30 + rand(i + 3) * 90;
    const x = ((rand(i + 5) * W + g.time * 90 * (i % 2 ? 1 : -1)) % (W + 100)) - 50;
    ctx.globalAlpha = 0.06 + rand(i + 7) * 0.05;
    ctx.fillStyle = '#ffe6a8';
    ctx.fillRect(x, y, len, 1);
  }
  ctx.globalAlpha = 1;
  drawText(ctx, 'OLHO DE FALCAO', W / 2, 66, {
    align: 'center', scale: 1, color: '#ffe09a', outline: 1, alpha: 0.8,
  });
  ctx.fillStyle = '#241621';
  ctx.fillRect(120, 78, 80, 3);
  ctx.fillStyle = '#ffcf6b';
  ctx.fillRect(121, 79, Math.round(78 * p), 1);
}

export function drawDamage(ctx, g) {
  if (g.hitFlash <= 0) return;
  const a = Math.min(1, g.hitFlash * 1.8);
  // red edge vignette built from frames
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = '#c22a34';
  for (let i = 0; i < 7; i++) {
    const inset = i * 4;
    ctx.globalAlpha = a * (0.16 - i * 0.021);
    ctx.fillRect(0, inset, W, 4);
    ctx.fillRect(0, H - inset - 4, W, 4);
    ctx.fillRect(inset, 0, 4, H);
    ctx.fillRect(W - inset - 4, 0, 4, H);
  }
  ctx.globalAlpha = 1;
}

function pseudo(seed) {
  return (i) => {
    const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
}

// ---------------------------------------------------------------- TITLE
export function drawTitle(ctx, g) {
  const t = g.time;
  // subtle darkening so the lettering sits on the sky
  const grad = ctx.createLinearGradient(0, 0, 0, 210);
  grad.addColorStop(0, 'rgba(10,5,14,0.55)');
  grad.addColorStop(1, 'rgba(10,5,14,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 210);

  drawText(ctx, 'POEIRA', W / 2, 62, {
    align: 'center', scale: 4, color: '#f5c25c', outline: 2, outlineColor: '#2a1018', shadow: 3, shadowColor: '#7c2634',
  });
  drawText(ctx, '& CHUMBO', W / 2, 104, {
    align: 'center', scale: 3, color: '#f4e3ba', outline: 1, outlineColor: '#2a1018', shadow: 2, shadowColor: '#7c2634',
  });
  // decorative bullet line
  ctx.fillStyle = 'rgba(245,194,92,0.7)';
  ctx.fillRect(W / 2 - 74, 136, 148, 1);
  for (let i = 0; i < 3; i++) ctx.fillRect(W / 2 - 2 + i * 3, 134, 1, 5);
  drawText(ctx, 'UM DUELO NO VELHO OESTE', W / 2, 145, {
    align: 'center', scale: 1, color: '#d8a26a', outline: 1,
  });

  // start ribbon
  const blink = 0.62 + 0.38 * (Math.sin(t * 3.2) * 0.5 + 0.5);
  ribbon(ctx, 46, 454, 228, 46, 1);
  drawText(ctx, 'TOQUE PARA JOGAR', W / 2, 466, {
    align: 'center', scale: 2, color: '#f6d99b', outline: 1, alpha: blink,
  });
  drawText(ctx, `MELHOR  ${String(g.best).padStart(5, '0')}`, W / 2, 508, {
    align: 'center', scale: 1, color: '#b98a5a', outline: 1,
  });
  drawText(ctx, '3 CORACOES  ·  6 BALAS  ·  1 REVOLVER', W / 2, 524, {
    align: 'center', scale: 1, color: 'rgba(200,160,115,0.62)',
  });
  drawText(ctx, 'POUPE OS CIVIS.  MIR E OS BANDIDOS.', W / 2, 540, {
    align: 'center', scale: 1, color: 'rgba(200,160,115,0.62)',
  });

  // mute button
  const m = TITLE_UI.mute;
  iconButton(ctx, m, g.muted);
  drawSoundIcon(ctx, m.x + 14, m.y + 13, g.muted, g.muted ? '#b07a52' : '#e8c98e');

  // little sunbeam sparkle
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2.3);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(36, 32, 2, 2);
  ctx.fillRect(288, 56, 1, 1);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- GAME OVER
export function drawGameOver(ctx, g) {
  ctx.fillStyle = 'rgba(12,6,12,0.82)';
  ctx.fillRect(0, 0, W, H);
  const red = ctx.createLinearGradient(0, 0, 0, H);
  red.addColorStop(0, 'rgba(90,16,26,0.25)');
  red.addColorStop(0.5, 'rgba(20,8,14,0)');
  red.addColorStop(1, 'rgba(90,16,26,0.2)');
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);

  drawSkull(ctx, W / 2, 86, 4);
  drawText(ctx, 'FIM DA LINHA', W / 2, 112, {
    align: 'center', scale: 3, color: '#f2c473', outline: 2, outlineColor: '#2a1018', shadow: 2, shadowColor: '#7c2634',
  });
  drawText(ctx, 'O VELHO OESTE NAO PERDOA', W / 2, 146, {
    align: 'center', scale: 1, color: '#b9835f',
  });

  drawText(ctx, 'PONTUACAO', W / 2, 180, { align: 'center', scale: 1, color: '#a87a52' });
  drawText(ctx, String(g.score).padStart(5, '0'), W / 2, 194, {
    align: 'center', scale: 4, color: '#f6e3b8', outline: 2, outlineColor: '#2a1018',
  });
  drawText(ctx, `ONDA ${g.wave}   ·   MELHOR ${String(g.best).padStart(5, '0')}`, W / 2, 244, {
    align: 'center', scale: 1, color: '#c9a06c',
  });
  if (g.newRecord) {
    drawText(ctx, 'NOVO RECORDE!', W / 2, 270, {
      align: 'center', scale: 2, color: '#ffcf6b', outline: 1, alpha: 0.7 + 0.3 * Math.sin(g.time * 7),
    });
  }

  const r = GAMEOVER_UI.restart;
  ribbon(ctx, r.x, r.y, r.w, r.h, 1);
  const blink = 0.65 + 0.35 * Math.sin(g.time * 3.4);
  drawText(ctx, 'TOQUE PARA RECOMEÇAR', W / 2, r.y + 14, {
    align: 'center', scale: 2, color: '#f6d99b', outline: 1, alpha: blink,
  });
  drawText(ctx, 'O RECOMEÇO', W / 2, r.y + 32, {
    align: 'center', scale: 1, color: '#a87a52',
  });

  const h = GAMEOVER_UI.home;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#1a0f18';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = 'rgba(240,200,120,0.25)';
  ctx.fillRect(h.x, h.y, h.w, 1);
  ctx.globalAlpha = 1;
  drawText(ctx, 'VOLTAR AO INICIO', W / 2, h.y + 8, {
    align: 'center', scale: 1, color: '#d8b98a',
  });
  const m = GAMEOVER_UI.mute;
  iconButton(ctx, m, g.muted);
  drawSoundIcon(ctx, m.x + 14, m.y + 13, g.muted, g.muted ? '#b07a52' : '#e8c98e');
}

// ---------------------------------------------------------------- PAUSE
export function drawPause(ctx, g) {
  ctx.fillStyle = 'rgba(12,6,12,0.78)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'PAUSA', W / 2, 172, {
    align: 'center', scale: 4, color: '#f2c473', outline: 2, outlineColor: '#2a1018', shadow: 2, shadowColor: '#7c2634',
  });
  drawText(ctx, 'O VELHO OESTE ESPERA', W / 2, 212, {
    align: 'center', scale: 1, color: '#b9835f',
  });

  const btn = (rect, label, sub) => {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#1c111c';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(240,200,120,0.3)';
    ctx.fillRect(rect.x, rect.y, rect.w, 1);
    ctx.fillRect(rect.x, rect.y + rect.h - 1, rect.w, 1);
    drawText(ctx, label, W / 2, rect.y + 7, { align: 'center', scale: 1, color: '#e8c98e' });
    if (sub) drawText(ctx, sub, W / 2, rect.y + 19, { align: 'center', scale: 1, color: '#a87a52' });
  };
  btn(PAUSE_UI.resume, 'CONTINUAR', 'TOQUE AQUI');
  btn(PAUSE_UI.sound, `SOM: ${g.muted ? 'DESLIGADO' : 'LIGADO'}`, null);
  btn(PAUSE_UI.restart, 'REINICIAR', null);
  drawText(ctx, 'P PARA PAUSAR', W / 2, 470, { align: 'center', scale: 1, color: 'rgba(190,150,105,0.45)' });
}

// a gold nugget prompt on title / gameover backgrounds could use this later
export { drawGoldSack, shade };
