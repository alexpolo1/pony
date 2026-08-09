// Sound effects using Web Audio API
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playClick() {
  const ctx = getCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.1);
}

export function playRoll() {
  const ctx = getCtx();
  for (let i = 0; i < 5; i++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.04;
    o.type = 'square';
    o.frequency.value = 200 + Math.random() * 400;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.04);
  }
}

export function playSuccess() {
  const ctx = getCtx();
  [523, 659, 784].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.1;
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.4);
  });
}

export function playFail() {
  const ctx = getCtx();
  [392, 349, 311].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.12;
    o.type = 'sawtooth';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.5);
  });
}

export function playSelect() {
  const ctx = getCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
  g.gain.setValueAtTime(0.2, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.15);
}

export function playVictory() {
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.15;
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.6);
  });
}
