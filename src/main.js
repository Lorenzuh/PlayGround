// POEIRA & CHUMBO — a tiny western shoot-out for thumbs.
import {
  W, H, SCENE, GROUND_Y, paletteFor,
} from './background.js';
import { drawText } from './font.js';
import { drawPlayer, playerGunTip } from './sprites.js';
import {
  updateEffects, addText, burst, dustPuff, addHat, addTracer, addEnemyBullet,
} from './fx.js';
import { renderGame } from './render.js';
import {
  TOP_UI, TITLE_UI, PAUSE_UI, GAMEOVER_UI,
} from './ui.js';
import { AudioEngine } from './audio.js';

const PLAYER_X = 160;
const PLAYER_BASE = 544;
const SLOT_KEYS = ['winL', 'winR', 'street', 'barrel', 'wagon', 'store'];
const BANDIT_PALS = [
  { poncho: '#b8443c', ponchoDark: '#7d2a30', ponchoHi: '#dc6a4c', band: '#e0a34a', trim: '#3f6f68' },
  { poncho: '#c2913e', ponchoDark: '#8a5f2a', ponchoHi: '#e3b95c', band: '#5b3a2a', trim: '#7a3a3a' },
  { poncho: '#3f726b', ponchoDark: '#28504d', ponchoHi: '#5f988a', band: '#e0a34a', trim: '#8a3a34' },
  { poncho: '#77506f', ponchoDark: '#51374f', ponchoHi: '#9a708d', band: '#e8c27a', trim: '#3f5c58' },
];
const SKINS = ['#b97b50', '#a56a42', '#c98e62', '#8f5a3a', '#d29a6e'];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const audio = new AudioEngine();

function loadBest() {
  try {
    const v = parseInt(localStorage.getItem('poeira_best') || '0', 10);
    return Number.isFinite(v) ? v : 0;
  } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('poeira_best', String(v)); } catch { /* ignore */ }
}

const g = {
  mode: 'title',
  time: 0,
  dayT: 0.06,
  score: 0,
  best: loadBest(),
  newRecord: false,
  hearts: 3,
  maxHearts: 5,
  ammo: 6,
  maxAmmo: 6,
  reloading: false,
  reloadT: 0,
  reloadDuration: 1.15,
  reloadProgress: 0,
  autoReloadT: 0,
  combo: 0,
  multiplier: 1,
  deadEye: 0,
  deadEyeActive: false,
  deadEyeTimer: 0,
  shake: 0,
  hitFlash: 0,
  freeze: 0,
  wave: 1,
  waveState: 'intermission',
  waveTimer: 2.6,
  waveTarget: 6,
  waveSpawned: 0,
  waveClearT: 0,
  spawnTimer: 0.4,
  maxActive: 2,
  fuseBase: 3.2,
  spawnDelay: 1.1,
  civilChance: 0,
  bossWave: false,
  bossSpawned: false,
  enemies: [],
  enemyBullets: [],
  particles: [],
  texts: [],
  tracers: [],
  hats: [],
  gold: null,
  goldTimer: 9,
  banner: null,
  hint: null,
  readyHintT: 0,
  deathT: 0,
  aim: 0,
  muzzle: 0,
  recoil: 0,
  muted: audio.muted,
  tumbleweed: { x: -24, y: 520, baseY: 520, vx: 26, r: 9, spin: 0, alpha: 0.95 },
  tumbleTimer: 7,
  hidden: false,
};

// ---------------------------------------------------------------- setup
function prepareWave(w) {
  g.bossWave = w % 5 === 0;
  g.waveTarget = 5 + Math.floor(w * 0.9);
  g.maxActive = Math.min(4, 2 + Math.floor((w - 1) / 3));
  g.fuseBase = Math.max(1.0, 3.2 - (w - 1) * 0.13);
  g.spawnDelay = Math.max(0.42, 1.15 - (w - 1) * 0.055);
  g.civilChance = w < 2 ? 0 : Math.min(0.24, 0.05 + w * 0.02);
  g.waveSpawned = 0;
  g.bossSpawned = false;
  g.waveClearT = 0;
  g.spawnTimer = 0.5;
  g.waveState = 'intermission';
}

function setHint(text, dur = 3) {
  g.hint = { text, t: dur, dur };
}

function startGame() {
  audio.init();
  audio.startWind();
  g.mode = 'play';
  g.score = 0;
  g.hearts = 3;
  g.maxHearts = 5;
  g.ammo = 6;
  g.reloading = false;
  g.reloadT = 0;
  g.autoReloadT = 0;
  g.combo = 0;
  g.multiplier = 1;
  g.deadEye = 0;
  g.deadEyeActive = false;
  g.deadEyeTimer = 0;
  g.enemies = [];
  g.enemyBullets = [];
  g.particles = [];
  g.texts = [];
  g.tracers = [];
  g.hats = [];
  g.gold = null;
  g.goldTimer = 10;
  g.deathT = 0;
  g.banner = null;
  g.hint = null;
  g.readyHintT = 0;
  g.shake = 0;
  g.hitFlash = 0;
  g.freeze = 0;
  g.aim = 0;
  g.muzzle = 0;
  g.recoil = 0;
  g.wave = 1;
  g.best = loadBest();
  g.newRecord = false;
  g.dayT = 0.03;
  g.tumbleweed = null;
  g.tumbleTimer = 6;
  prepareWave(1);
  g.banner = { title: 'ONDA 1', sub: 'BANDIDOS A VISTA', t: 2.6, dur: 2.6, warn: false };
  g.waveState = 'intermission';
  g.waveTimer = 2.6;
  setHint('TOQUE NOS BANDIDOS', 3.8);
  audio.waveStart();
}

function goHome() {
  g.mode = 'title';
  g.enemies = [];
  g.enemyBullets = [];
  g.bullets = [];
  g.gold = null;
  g.score = 0;
  g.wave = 1;
  g.hearts = 3;
  g.ammo = 6;
  g.reloading = false;
  g.deadEye = 0;
  g.deadEyeActive = false;
  g.hint = null;
  g.banner = null;
  g.dayT = 0.06;
  if (!g.tumbleweed) g.tumbleweed = { x: -24, y: 520, baseY: 520, vx: 26, r: 9, spin: 0, alpha: 0.95 };
  audio.ui();
}

function toggleMute() {
  audio.init();
  g.muted = audio.toggleMute();
  audio.ui();
}

function togglePause() {
  if (g.mode === 'play') {
    g.mode = 'paused';
    audio.ui();
  } else if (g.mode === 'paused') {
    g.mode = 'play';
    audio.ui();
  }
}

// ---------------------------------------------------------------- combat
function startReload() {
  if (g.mode !== 'play' || g.reloading || g.ammo >= g.maxAmmo) return;
  if (g.deadEyeActive) return;
  g.reloading = true;
  g.reloadT = 0;
  g.reloadProgress = 0;
  g.autoReloadT = 0;
  audio.reload();
}

function activateDeadeye() {
  if (g.mode !== 'play' || g.deadEye < 100 || g.deadEyeActive) return;
  g.deadEyeActive = true;
  g.deadEyeTimer = 5;
  g.deadEye = 100;
  g.ammo = g.maxAmmo;
  g.reloading = false;
  g.shake = Math.max(g.shake, 3);
  audio.deadeye();
  setHint('TEMPO LENTO — 5 SEGUNDOS', 2.2);
}

function enemyRect(e) {
  if (e.slot === 'winL' || e.slot === 'winR' || e.slot === 'store') {
    const clip = e.slot === 'winL' ? SCENE.windows[0] : e.slot === 'winR' ? SCENE.windows[1] : SCENE.storeWindow;
    return { x: clip.x - 3, y: clip.y - 3, w: clip.w + 6, h: clip.h + 6 };
  }
  const halfW = e.unit * 11;
  const top = e.baseY - e.unit * 37;
  return { x: e.x - halfW, y: top, w: halfW * 2, h: e.baseY - top + 4 };
}

function pickEnemyAt(x, y) {
  const list = [...g.enemies].reverse();
  for (const e of list) {
    if (e.state === 'dying' || e.state === 'leaving' || e.state === 'rise') continue;
    const r = enemyRect(e);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return e;
  }
  return null;
}

function shootAt(x, y) {
  if (g.mode !== 'play' || g.deathT > 0) return;

  // aim arm first, so the tracer leaves the correct hand
  g.aim = x < 128 ? -1 : x > 192 ? 1 : 0;

  const enemy = pickEnemyAt(x, y);
  if (!enemy && g.gold) {
    const dx = x - g.gold.x, dy = y - g.gold.y;
    if (Math.hypot(dx, dy) < 26) {
      collectGold();
      return;
    }
  }

  if (g.reloading) {
    audio.dryFire();
    return;
  }
  if (!g.deadEyeActive && g.ammo <= 0) {
    audio.dryFire();
    startReload();
    return;
  }

  if (!g.deadEyeActive) g.ammo--;
  g.muzzle = 0.15;
  g.recoil = 1;
  g.shake = Math.max(g.shake, 2.4);
  audio.shoot();

  const tip = playerGunTip(g.aim, PLAYER_X, PLAYER_BASE);

  if (enemy) {
    const wr = enemyRect(enemy);
    const hx = enemy.slot === 'winL' || enemy.slot === 'winR' || enemy.slot === 'store'
      ? enemy.x
      : enemy.x;
    const hy = wr.y + wr.h * 0.42;
    addTracer(g, tip.x, tip.y, hx, hy);
    hitEnemy(enemy);
  } else {
    addTracer(g, tip.x, tip.y, x, y);
    if (y > GROUND_Y - 6) dustPuff(g, x, y, 7);
    else {
      burst(g, x, y, { n: 5, colors: ['#d9a26a', '#8a5a3a', '#f0c98a'], speed: 70, gravity: 180, life: 0.35 });
    }
    // a miss breaks the chain
    if (g.combo > 0) {
      addText(g, x, y - 10, 'ERROU', '#c98a6a', 1, 0.6);
    }
    g.combo = 0;
    g.multiplier = 1;
  }

  if (!g.deadEyeActive && g.ammo === 0) {
    g.autoReloadT = 0.3;
    setHint('RECARREGUE! TOQUE NA CILINDRO', 2.2);
  }
}

function hitEnemy(e) {
  if (e.state === 'dying' || e.state === 'leaving') return;
  if (e.type === 'civil') {
    civilianPenalty(e);
    return;
  }
  e.flash = 0.16;
  e.fuse = Math.max(e.fuse, 0.35);
  if (e.type === 'boss' && e.hp > 1) {
    e.hp--;
    g.score += 60 * g.multiplier;
    addText(g, e.x + (Math.random() - 0.5) * 16, e.baseY - e.unit * 26, `+${60 * g.multiplier}`, '#ffe6a8', 1, 0.7);
    burst(g, e.x, e.baseY - e.unit * 22, {
      n: 10, colors: ['#f0c98a', '#e0524a', '#fff0c0'], speed: 90, gravity: 240, life: 0.5,
    });
    g.shake = Math.max(g.shake, 4);
    g.freeze = Math.max(g.freeze, 0.025);
    audio.hit();
    audio.ricochet();
    return;
  }
  killEnemy(e);
}

function killEnemy(e) {
  e.state = 'dying';
  e.deadT = 0;
  e.knockDir = Math.random() < 0.5 ? -1 : 1;
  e.fuse = 0;
  const mult = g.multiplier;
  const basePts = e.type === 'boss' ? 600 : 100;
  const pts = basePts * mult;
  g.score += pts;
  g.combo++;
  g.multiplier = Math.min(5, 1 + Math.floor(g.combo / 3));
  g.deadEye = Math.min(100, g.deadEye + (e.type === 'boss' ? 28 : 11));
  if (g.deadEye >= 100 && g.readyHintT <= 0) {
    g.readyHintT = 3.5;
    audio.coin();
  }
  const clip = e.slot === 'winL' || e.slot === 'winR' || e.slot === 'store';
  const cy = e.baseY - (clip ? 18 : e.unit * 22);
  addText(g, e.x, cy - 22, `+${pts}`, '#ffe6a8', e.type === 'boss' ? 2 : 1, 0.9);
  if (g.combo > 0 && g.combo % 5 === 0) {
    addText(g, e.x, cy - 42, `COMBO X${g.multiplier}`, '#ffcf6b', 2, 1.1);
  }
  addHat(g, e.x, cy, e.type === 'boss' ? '#8e2f33' : '#4a3030');
  burst(g, e.x, cy, {
    n: e.type === 'boss' ? 30 : 16,
    colors: ['#e8c98a', '#b98a5a', '#8a5a3a', '#ffcf6b'],
    speed: e.type === 'boss' ? 150 : 110, gravity: 300, life: 0.65,
  });
  g.shake = Math.max(g.shake, e.type === 'boss' ? 9 : 3.2);
  g.freeze = Math.max(g.freeze, e.type === 'boss' ? 0.07 : 0.035);
  audio.hit();
  audio.ricochet();
}

function civilianPenalty(e) {
  e.state = 'dying';
  e.deadT = 0;
  e.fuse = 0;
  g.score = Math.max(0, g.score - 150);
  g.combo = 0;
  g.multiplier = 1;
  g.hitFlash = Math.max(g.hitFlash, 0.5);
  g.shake = Math.max(g.shake, 4.5);
  addText(g, e.x, e.baseY - 64, 'CIVIL! -150', '#ff8a6a', 2, 1.1);
  burst(g, e.x, e.baseY - 40, {
    n: 12, colors: ['#8fe0d4', '#d8f0e8', '#e0524a'], speed: 70, gravity: 180, life: 0.6,
  });
  audio.civil();
  setHint('POUPE OS CIVIS!', 2.4);
}

function collectGold() {
  if (!g.gold) return;
  const { x, y } = g.gold;
  g.gold = null;
  g.goldTimer = 12 + Math.random() * 8;
  g.score += 250;
  g.deadEye = Math.min(100, g.deadEye + 8);
  addText(g, x, y - 18, '+250', '#ffcf6b', 2, 1.1);
  burst(g, x, y, {
    n: 18, colors: ['#ffcf6b', '#fff0b0', '#e8a23a'], speed: 100, gravity: 160, life: 0.7, size: 2,
  });
  audio.coin();
  g.shake = Math.max(g.shake, 1.5);
}

function spawnGold() {
  const left = Math.random() < 0.5;
  const x = left ? 62 + Math.random() * 52 : 206 + Math.random() * 52;
  const y = 470 + Math.random() * 18;
  g.gold = { x, y, t: 0, dur: 5.5 };
}

function damagePlayer() {
  if (g.mode !== 'play' || g.deathT > 0) return;
  g.hearts--;
  g.hitFlash = 0.9;
  g.shake = Math.max(g.shake, 11);
  g.combo = 0;
  g.multiplier = 1;
  g.aim = 0;
  g.deadEye = Math.max(0, g.deadEye - 12);
  audio.hurt();
  burst(g, PLAYER_X, PLAYER_BASE - 34, {
    n: 8, colors: ['#e0524a', '#ff8a6a', '#e8c98a'], speed: 80, gravity: 220, life: 0.45,
  });
  if (g.hearts <= 0) {
    g.hearts = 0;
    g.deathT = 1.35;
    g.enemies = [];
    g.enemyBullets = [];
    g.gold = null;
    audio.gameOver();
  }
}

function endGame() {
  g.newRecord = g.score > g.best;
  if (g.newRecord) {
    g.best = g.score;
    saveBest(g.best);
  }
  g.mode = 'gameover';
  g.overAt = g.time;
  g.hint = null;
  g.banner = null;
  g.enemies = [];
  g.enemyBullets = [];
}

// ---------------------------------------------------------------- enemies
function spawnEnemy(slot, type) {
  const s = SCENE.slots[slot];
  const fuse = type === 'civil'
    ? 2.1 + Math.random() * 0.8
    : type === 'boss'
      ? 4.7
      : g.fuseBase * (0.85 + Math.random() * 0.3);
  const e = {
    slot,
    type,
    x: s.x,
    baseY: s.baseY,
    unit: type === 'boss' ? 3 : 2,
    t: 0,
    animT: 0,
    riseDur: type === 'boss' ? 0.5 : 0.28,
    state: 'rise',
    fuse,
    maxFuse: fuse,
    hp: type === 'boss' ? 3 : 1,
    flash: 0,
    fireT: 0,
    leaveT: 0,
    deadT: 0,
    seed: Math.random() * 10,
    knockDir: 1,
    cigar: type === 'bandit' && Math.random() < 0.3,
    pal: type === 'boss'
      ? { poncho: '#8e2f33', ponchoDark: '#5f1c28', ponchoHi: '#c44a43', band: '#f0c15c', trim: '#e0a34a' }
      : BANDIT_PALS[(Math.random() * BANDIT_PALS.length) | 0],
    skin: SKINS[(Math.random() * SKINS.length) | 0],
  };
  g.enemies.push(e);
  dustPuff(g, s.x, s.baseY - 4, 5);
  if (type === 'civil') setHint('NAO ATIRE NOS CIVIS', 2.6);
  if (type === 'boss') setHint('O CHEFE! TRES TIROS!', 3);
}

function trySpawn() {
  if (g.waveSpawned >= g.waveTarget) return;
  const active = g.enemies.filter((e) => e.state === 'rise' || e.state === 'active' || e.state === 'firing').length;
  if (active >= g.maxActive + (g.bossWave && !g.bossSpawned ? 1 : 0)) return;

  if (g.bossWave && !g.bossSpawned && g.waveSpawned >= Math.floor(g.waveTarget * 0.35)) {
    const streetBusy = g.enemies.some((e) => e.slot === 'street' && e.state !== 'dying' && e.state !== 'leaving');
    if (streetBusy) return;
    spawnEnemy('street', 'boss');
    g.bossSpawned = true;
    g.waveSpawned++;
    g.spawnTimer = g.spawnDelay;
    return;
  }

  const free = SLOT_KEYS.filter((k) => !g.enemies.some((e) => e.slot === k && e.state !== 'dying' && e.state !== 'leaving'));
  if (!free.length) return;
  // prefer windows a little, they read best
  const key = free[(Math.random() * free.length) | 0];
  const type = Math.random() < g.civilChance ? 'civil' : 'bandit';
  spawnEnemy(key, type);
  g.waveSpawned++;
  g.spawnTimer = g.spawnDelay * (0.7 + Math.random() * 0.6);
}

function fireEnemy(e) {
  e.state = 'firing';
  e.fireT = 0.42;
  e.fuse = 0;
  audio.enemyShoot();
  const clip = e.slot === 'winL' || e.slot === 'winR' || e.slot === 'store';
  const base = e.baseY + (clip ? 22 : 0);
  const ox = clip ? Math.max(SCENE.windows[0].x, Math.min(W - 40, e.x - 8)) : e.x - 17 * e.unit;
  const oy = clip ? base - 10 : base - 13 * e.unit;
  addEnemyBullet(g, ox, oy, PLAYER_X + (Math.random() - 0.5) * 18, PLAYER_BASE - 36);
  burst(g, ox, oy, {
    n: 4, colors: ['#ffcf6b', '#ff8a3a', '#fff0b0'], speed: 50, gravity: 80, life: 0.25,
  });
  g.shake = Math.max(g.shake, 1.4);
}

function updateEnemies(dt) {
  for (const e of g.enemies) {
    e.flash = Math.max(0, e.flash - dt * 7);
    if (e.state === 'rise') {
      e.t += dt;
      e.animT += dt;
      if (e.t >= e.riseDur) {
        e.state = 'active';
        e.t = 0;
      }
      continue;
    }
    if (e.state === 'active') {
      e.t += dt;
      e.animT += dt;
      e.fuse -= dt;
      if (e.fuse <= 0) {
        if (e.type === 'civil') {
          e.state = 'leaving';
          e.leaveT = 0;
          g.score += 25;
          addText(g, e.x, e.baseY - 58, '+25', '#8fe0d4', 1, 0.8);
        } else {
          fireEnemy(e);
        }
      }
    } else if (e.state === 'firing') {
      e.animT += dt;
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.state = 'leaving';
        e.leaveT = 0;
      }
    } else if (e.state === 'leaving') {
      e.leaveT += dt;
    } else if (e.state === 'dying') {
      e.deadT += dt;
    }
  }
  g.enemies = g.enemies.filter((e) => {
    if (e.state === 'leaving' && e.leaveT > 0.55) return false;
    if (e.state === 'dying' && e.deadT > 0.6) return false;
    return true;
  });
}

function updateEnemyBullets(dt) {
  for (const b of g.enemyBullets) {
    b.t += dt;
    if (!b.hit && b.t >= b.dur) {
      b.hit = true;
      damagePlayer();
    }
  }
  g.enemyBullets = g.enemyBullets.filter((b) => !b.hit);
}

// ---------------------------------------------------------------- flow
function beginWave() {
  g.waveState = 'fight';
  g.spawnTimer = 0.35;
  g.waveClearT = 0;
  audio.waveStart();
}

function finishWave() {
  if (g.wave % 3 === 0 && g.hearts < g.maxHearts) {
    g.hearts++;
    addText(g, PLAYER_X, 430, 'VIDA +1', '#e0524a', 2, 1.4);
    audio.coin();
  }
  g.wave++;
  prepareWave(g.wave);
  g.waveState = 'intermission';
  g.waveTimer = 2.6;
  const subs = ['BANDIDOS A VISTA', 'A CIDADE PRECISA DE VOCE', 'POEIRA E CHUMBO', 'NAO BAIXE A GUARDA'];
  g.banner = {
    title: `ONDA ${g.wave}`,
    sub: g.bossWave ? 'CHEFE A VISTA!' : subs[(Math.random() * subs.length) | 0],
    t: 2.6,
    dur: 2.6,
    warn: g.bossWave,
  };
}

function updateTumbleweed(dt) {
  if (g.mode === 'title') {
    if (!g.tumbleweed) {
      g.tumbleweed = {
        x: -24, y: 514, baseY: 514, vx: 26 + Math.random() * 12,
        r: 8 + Math.random() * 4, spin: Math.random() * 6, alpha: 0.95,
      };
    }
    const tw = g.tumbleweed;
    tw.x += tw.vx * dt;
    tw.spin += dt * 4;
    tw.y = tw.baseY + Math.sin(tw.spin * 0.8) * 2;
    if (tw.x > W + 30) g.tumbleweed = null;
    return;
  }
  if (g.tumbleweed) {
    const tw = g.tumbleweed;
    tw.x += tw.vx * dt;
    tw.spin += dt * 4;
    tw.y = tw.baseY + Math.sin(tw.spin * 0.8) * 2;
    if (tw.x > W + 30 || tw.x < -30) g.tumbleweed = null;
  } else {
    g.tumbleTimer -= dt;
    if (g.tumbleTimer <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      g.tumbleweed = {
        x: dir > 0 ? -24 : W + 24,
        baseY: 468 + Math.random() * 60,
        y: 468,
        vx: dir * (18 + Math.random() * 22),
        r: 7 + Math.random() * 4,
        spin: Math.random() * 6,
        alpha: 0.9,
      };
      g.tumbleTimer = 14 + Math.random() * 10;
    }
  }
}

function updateAmbient(dt) {
  updateTumbleweed(dt);
  const target = g.mode === 'title' ? 0.06 : Math.min(1, (g.wave - 1) / 9);
  g.dayT += (target - g.dayT) * Math.min(1, dt * 0.5);
}

function updatePlay(dt) {
  // real-time UI timers
  g.readyHintT = Math.max(0, g.readyHintT - dt);
  g.shake = Math.max(0, g.shake - dt * 34);
  g.hitFlash = Math.max(0, g.hitFlash - dt * 1.7);
  g.muzzle = Math.max(0, g.muzzle - dt);
  g.recoil = Math.max(0, g.recoil - dt * 9);

  if (g.banner) {
    g.banner.t -= dt;
    if (g.banner.t <= 0) g.banner = null;
  }
  if (g.hint) {
    g.hint.t -= dt;
    if (g.hint.t <= 0) g.hint = null;
  }

  if (g.reloading) {
    g.reloadT += dt;
    g.reloadProgress = Math.min(1, g.reloadT / g.reloadDuration);
    if (g.reloadT >= g.reloadDuration) {
      g.reloading = false;
      g.reloadProgress = 0;
      g.ammo = g.maxAmmo;
      audio.reloadDone();
    }
  } else if (g.autoReloadT > 0) {
    g.autoReloadT -= dt;
    if (g.autoReloadT <= 0) startReload();
  }

  if (g.deadEyeActive) {
    g.deadEyeTimer -= dt;
    g.deadEye = Math.max(0, (g.deadEyeTimer / 5) * 100);
    if (g.deadEyeTimer <= 0) {
      g.deadEyeActive = false;
      g.deadEye = 0;
      g.deadEyeTimer = 0;
      g.ammo = g.maxAmmo;
      g.reloading = false;
      audio.deadeyeEnd();
    }
  }

  if (g.freeze > 0) {
    g.freeze -= dt;
    updateEffects(g, dt);
    return;
  }

  if (g.deathT > 0) {
    g.deathT -= dt;
    updateEffects(g, dt);
    if (g.deathT <= 0) endGame();
    return;
  }

  if (g.waveState === 'intermission') {
    g.waveTimer -= dt;
    if (g.waveTimer <= 0) beginWave();
  } else if (g.waveState === 'fight') {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) trySpawn();
    if (g.waveSpawned >= g.waveTarget && g.enemies.length === 0) {
      g.waveClearT += dt;
      if (g.waveClearT > 0.55) finishWave();
    } else {
      g.waveClearT = 0;
    }
  }

  const wdt = dt * (g.deadEyeActive ? 0.35 : 1);
  updateEnemies(wdt);
  updateEnemyBullets(wdt);

  // gold
  if (g.gold) {
    g.gold.t += dt;
    if (g.gold.t >= g.gold.dur) {
      g.gold = null;
      g.goldTimer = 10 + Math.random() * 8;
    }
  } else {
    g.goldTimer -= dt;
    if (g.goldTimer <= 0 && g.wave >= 2 && g.waveState === 'fight') {
      spawnGold();
    }
  }

  updateEffects(g, dt);
}

function update(dt) {
  g.time += dt;
  updateAmbient(dt);

  if (g.mode === 'play') {
    updatePlay(dt);
  } else if (g.mode === 'gameover') {
    updateEffects(g, dt);
    g.shake = Math.max(0, g.shake - dt * 34);
    g.hitFlash = Math.max(0, g.hitFlash - dt * 1.7);
  }
}

// ---------------------------------------------------------------- rendering
function render() {
  renderGame(ctx, g);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!g.hidden) update(dt);
  render();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- input
function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * W,
    y: ((ev.clientY - r.top) / r.height) * H,
  };
}

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function onPointerDown(ev) {
  ev.preventDefault();
  audio.init();
  audio.startWind();
  const p = canvasPoint(ev);

  if (g.mode === 'title') {
    if (inRect(p, TITLE_UI.mute)) { toggleMute(); return; }
    startGame();
    return;
  }

  if (g.mode === 'gameover') {
    if (inRect(p, GAMEOVER_UI.mute)) { toggleMute(); return; }
    if (inRect(p, GAMEOVER_UI.home)) { goHome(); return; }
    if (g.time - g.overAt > 0.4) startGame();
    return;
  }

  if (g.mode === 'paused') {
    if (inRect(p, PAUSE_UI.sound)) { toggleMute(); return; }
    if (inRect(p, PAUSE_UI.restart)) { startGame(); return; }
    g.mode = 'play';
    audio.ui();
    return;
  }

  if (g.mode !== 'play') return;
  if (g.deathT > 0) return;

  if (inRect(p, TOP_UI.pause)) { togglePause(); return; }
  if (inRect(p, TOP_UI.mute)) { toggleMute(); return; }
  if (inRect(p, TOP_UI.reload)) { startReload(); return; }
  if (inRect(p, TOP_UI.deadeye)) { activateDeadeye(); return; }

  shootAt(p.x, p.y);
}

canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'enter', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  audio.init();
  if (k === 'm') { toggleMute(); return; }
  if (k === 'p' || k === 'escape') { togglePause(); return; }
  if (g.mode === 'title') {
    if (k === ' ' || k === 'enter' || k === 'r') startGame();
    return;
  }
  if (g.mode === 'gameover') {
    if ((k === ' ' || k === 'enter' || k === 'r') && g.time - g.overAt > 0.4) startGame();
    return;
  }
  if (g.mode === 'paused') {
    if (k === ' ' || k === 'enter' || k === 'p' || k === 'escape') togglePause();
    if (k === 'r') startGame();
    return;
  }
  if (g.mode === 'play') {
    if (k === 'r') startReload();
    if (k === 'e' || k === 'f') activateDeadeye();
  }
});

document.addEventListener('visibilitychange', () => {
  g.hidden = document.hidden;
  if (document.hidden && g.mode === 'play') g.mode = 'paused';
});

function resize() {
  const vw = (window.visualViewport ? window.visualViewport.width : window.innerWidth);
  const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  const pad = Math.min(14, Math.max(4, Math.min(vw, vh) * 0.02));
  const scale = Math.min((vw - pad * 2) / W, (vh - pad * 2) / H);
  canvas.style.width = `${Math.round(W * scale)}px`;
  canvas.style.height = `${Math.round(H * scale)}px`;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 80));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();

// expose a tiny debug handle for automated screenshots / testing
window.__POEIRA = {
  g,
  startGame,
  togglePause,
  shootAt,
  pickEnemyAt,
  spawnEnemy,
  finishWave,
  activateDeadeye,
  setHint,
  endGame,
  render,
  beginWave,
};

requestAnimationFrame(frame);
