// Procedural sound: no downloads, everything is synthesized with WebAudio.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.windStarted = false;
    this.noiseBuffer = null;
    try {
      this.muted = localStorage.getItem('poeira_muted') === '1';
    } catch { /* ignore */ }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.makeNoise(2.0);
  }

  makeNoise(seconds) {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = white * 0.55 + last * 2.4;
    }
    return buffer;
  }

  setMuted(muted) {
    this.muted = muted;
    try { localStorage.setItem('poeira_muted', muted ? '1' : '0'); } catch { /* ignore */ }
    if (this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  now() { return this.ctx ? this.ctx.currentTime : 0; }

  envGain(duration, peak = 1, attack = 0.005) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    return g;
  }

  noiseBurst({ duration = 0.16, peak = 0.6, lowpass = 5200, highpass = 120, pan = 0, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 1;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = highpass;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(lowpass, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(200, lowpass * 0.25), t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) p.pan.value = pan;
    src.connect(hp).connect(lp).connect(g);
    if (p) { g.connect(p).connect(this.master); } else g.connect(this.master);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  tone({ freq = 220, dur = 0.2, type = 'sine', peak = 0.3, slide = 0, delay = 0, pan = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) p.pan.value = pan;
    osc.connect(g);
    if (p) { g.connect(p).connect(this.master); } else g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  shoot() {
    if (!this.ctx) return;
    this.noiseBurst({ duration: 0.22, peak: 0.85, lowpass: 7000, highpass: 300 });
    this.tone({ freq: 150, dur: 0.16, type: 'triangle', peak: 0.5, slide: -100 });
    this.tone({ freq: 62, dur: 0.3, type: 'sine', peak: 0.4, slide: -25 });
    this.noiseBurst({ duration: 0.4, peak: 0.09, lowpass: 1300, highpass: 80, delay: 0.02 });
  }

  enemyShoot() {
    this.noiseBurst({ duration: 0.16, peak: 0.32, lowpass: 4200, highpass: 250, pan: 0.2 });
    this.tone({ freq: 110, dur: 0.14, type: 'triangle', peak: 0.22, slide: -70 });
  }

  dryFire() {
    this.tone({ freq: 1500, dur: 0.035, type: 'square', peak: 0.09, slide: -900 });
    this.noiseBurst({ duration: 0.03, peak: 0.12, lowpass: 6000, highpass: 2500 });
  }

  hit() {
    this.tone({ freq: 210, dur: 0.1, type: 'triangle', peak: 0.25, slide: -130 });
    this.noiseBurst({ duration: 0.09, peak: 0.25, lowpass: 2200, highpass: 180 });
    this.tone({ freq: 880, dur: 0.18, type: 'sine', peak: 0.08, slide: 620, delay: 0.03 });
  }

  ricochet() {
    if (Math.random() > 0.55) return;
    this.tone({ freq: 1500 + Math.random() * 500, dur: 0.18, type: 'sine', peak: 0.07, slide: 1300 });
  }

  reload() {
    [0, 0.16, 0.42].forEach((d, i) => {
      this.tone({ freq: i === 2 ? 900 : 620, dur: 0.03, type: 'square', peak: 0.09, slide: -200, delay: d });
      this.noiseBurst({ duration: 0.03, peak: 0.09, lowpass: 7000, highpass: 2000, delay: d });
    });
  }

  reloadDone() {
    this.tone({ freq: 760, dur: 0.05, type: 'square', peak: 0.12, slide: 220 });
    this.tone({ freq: 1140, dur: 0.09, type: 'sine', peak: 0.07, delay: 0.03 });
  }

  hurt() {
    this.tone({ freq: 95, dur: 0.4, type: 'sawtooth', peak: 0.28, slide: -45 });
    this.noiseBurst({ duration: 0.28, peak: 0.4, lowpass: 900, highpass: 60 });
  }

  civil() {
    this.tone({ freq: 400, dur: 0.18, type: 'square', peak: 0.14, slide: -90 });
    this.tone({ freq: 300, dur: 0.24, type: 'square', peak: 0.12, slide: -60, delay: 0.1 });
  }

  deadeye() {
    this.tone({ freq: 420, dur: 1.1, type: 'sine', peak: 0.16, slide: -280 });
    this.tone({ freq: 210, dur: 1.3, type: 'triangle', peak: 0.11, slide: -120 });
    this.noiseBurst({ duration: 0.8, peak: 0.08, lowpass: 1200, highpass: 300 });
    this.tone({ freq: 1046, dur: 0.4, type: 'sine', peak: 0.05, delay: 0.1 });
  }

  deadeyeEnd() {
    this.tone({ freq: 250, dur: 0.5, type: 'sine', peak: 0.1, slide: 400 });
  }

  waveStart() {
    const notes = [392, 523, 659];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.3, type: 'triangle', peak: 0.11, delay: i * 0.13 });
      this.tone({ freq: f * 2, dur: 0.18, type: 'sine', peak: 0.035, delay: i * 0.13 });
    });
  }

  coin() {
    this.tone({ freq: 988, dur: 0.08, type: 'square', peak: 0.08 });
    this.tone({ freq: 1319, dur: 0.16, type: 'square', peak: 0.08, delay: 0.07 });
  }

  ui() {
    this.tone({ freq: 660, dur: 0.05, type: 'square', peak: 0.07, slide: 120 });
  }

  gameOver() {
    const notes = [392, 349, 311, 262];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.55, type: 'triangle', peak: 0.13, delay: i * 0.26 });
    });
    this.tone({ freq: 65, dur: 1.6, type: 'sine', peak: 0.12, delay: 0.4 });
  }

  startWind() {
    if (!this.ctx || this.windStarted) return;
    this.windStarted = true;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(hp).connect(lp).connect(g).connect(this.master);
    src.start();
    lfo.start();
  }
}
