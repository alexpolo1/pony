import { useState, useEffect, useRef, useCallback } from 'react';

// Shared audio context for ALL audio (music + SFX)
let sharedCtx = null;
let sharedMaster = null;

function getSharedAudio() {
  if (sharedCtx) return { ctx: sharedCtx, master: sharedMaster };
  const AC = window.AudioContext || window.webkitAudioContext;
  sharedCtx = new AC();
  sharedMaster = sharedCtx.createGain();
  sharedMaster.gain.value = 0.5;
  sharedMaster.connect(sharedCtx.destination);
  return { ctx: sharedCtx, master: sharedMaster };
}

export function setMasterVolume(v) {
  const { master } = getSharedAudio();
  master.gain.linearRampToValueAtTime(v, sharedCtx.currentTime + 0.1);
}

// SFX functions
export function playClick() {
  const { ctx, master } = getSharedAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(800, t);
  o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.1);
}

export function playRoll() {
  const { ctx, master } = getSharedAudio();
  for (let i = 0; i < 5; i++) {
    const t = ctx.currentTime + i * 0.04;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 200 + Math.random() * 400;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.04);
  }
}

export function playSuccess() {
  const { ctx, master } = getSharedAudio();
  [523, 659, 784].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.1;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.4);
  });
}

export function playFail() {
  const { ctx, master } = getSharedAudio();
  [392, 349, 311].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.12;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.5);
  });
}

export function playSelect() {
  const { ctx, master } = getSharedAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.15);
}

export function playVictory() {
  const { ctx, master } = getSharedAudio();
  [523, 659, 784, 1047].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.15;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.6);
  });
}

export function resumeAudioContext() {
  const { ctx } = getSharedAudio();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Pentatonic scales for music
const SCALES = {
  happy: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  adventure: [220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25],
  sad: [220.00, 246.94, 293.66, 311.13, 349.23, 392.00, 440.00],
  mixed: [261.63, 293.66, 329.63, 370.00, 392.00, 440.00, 493.88],
};

const SCENE_CONFIGS = {
  home: { scale: 'happy', bpm: 100, volume: 0.12, melodyDensity: 0.3, padVolume: 0.08 },
  game: { scale: 'adventure', bpm: 120, volume: 0.15, melodyDensity: 0.5, padVolume: 0.1 },
  victory: { scale: 'happy', bpm: 140, volume: 0.18, melodyDensity: 0.7, padVolume: 0.12 },
  defeat: { scale: 'sad', bpm: 70, volume: 0.1, melodyDensity: 0.2, padVolume: 0.06 },
  mixed: { scale: 'mixed', bpm: 90, volume: 0.12, melodyDensity: 0.35, padVolume: 0.08 },
};

function SceneMusic({ sceneType, onReady }) {
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const padGainRef = useRef(null);
  const melodyGainRef = useRef(null);
  const activeNodesRef = useRef([]);
  const intervalRef = useRef(null);
  const currentSceneRef = useRef(sceneType);
  const isPlayingRef = useRef(false);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const { ctx, master } = getSharedAudio();
    audioCtxRef.current = ctx;
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    padGain.connect(master);
    padGainRef.current = padGain;
    const melodyGain = ctx.createGain();
    melodyGain.gain.value = 0;
    melodyGain.connect(master);
    melodyGainRef.current = melodyGain;
    masterGainRef.current = master;
    onReady && onReady(true);
  }, [onReady]);

  const playNote = useCallback((freq, startTime, duration, gainNode, type = 'sine') => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    activeNodesRef.current.push({ osc, gain });
    setTimeout(() => {
      const idx = activeNodesRef.current.findIndex(n => n.osc === osc);
      if (idx >= 0) activeNodesRef.current.splice(idx, 1);
    }, (duration + 0.2) * 1000);
  }, []);

  const playPad = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !padGainRef.current) return;
    const config = SCENE_CONFIGS[currentSceneRef.current] || SCENE_CONFIGS.game;
    const scale = SCALES[config.scale];
    const now = ctx.currentTime;
    const padNotes = [scale[0], scale[Math.floor(scale.length / 2)], scale[scale.length - 1]];
    padNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq * 0.5;
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(config.padVolume * 0.3, now + 2);
      gain.gain.linearRampToValueAtTime(config.padVolume * 0.15, now + 4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(padGainRef.current);
      osc.start(now);
      const stopTime = now + 8;
      gain.gain.linearRampToValueAtTime(0, stopTime);
      osc.stop(stopTime + 0.1);
      const nextOsc = ctx.createOscillator();
      const nextGain = ctx.createGain();
      const nextFilter = ctx.createBiquadFilter();
      nextOsc.type = 'sine';
      nextOsc.frequency.value = freq * 0.5;
      nextFilter.type = 'lowpass';
      nextFilter.frequency.value = 600 + Math.random() * 400;
      nextFilter.Q.value = 1;
      nextGain.gain.setValueAtTime(0, stopTime);
      nextGain.gain.linearRampToValueAtTime(config.padVolume * 0.3, stopTime + 2);
      nextOsc.connect(nextFilter);
      nextFilter.connect(nextGain);
      nextGain.connect(padGainRef.current);
      nextOsc.start(stopTime);
    });
  }, []);

  const playMelody = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !melodyGainRef.current) return;
    const config = SCENE_CONFIGS[currentSceneRef.current] || SCENE_CONFIGS.game;
    const scale = SCALES[config.scale];
    const now = ctx.currentTime;
    if (Math.random() < config.melodyDensity) {
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const duration = 0.3 + Math.random() * 0.7;
      const type = Math.random() > 0.7 ? 'triangle' : 'sine';
      playNote(freq, now, duration, melodyGainRef.current, type);
      if (Math.random() > 0.6) {
        const harmonyFreq = scale[Math.floor(Math.random() * scale.length)] * 2;
        playNote(harmonyFreq, now + 0.1, duration * 0.5, melodyGainRef.current, 'sine');
      }
    }
  }, [playNote]);

  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    const config = SCENE_CONFIGS[currentSceneRef.current] || SCENE_CONFIGS.game;
    const intervalMs = (60 / config.bpm) * 1000;
    if (masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(config.volume, audioCtxRef.current.currentTime + 1);
    }
    playPad();
    intervalRef.current = setInterval(playMelody, intervalMs);
    const padInterval = setInterval(playPad, 8000);
    activeNodesRef.current.push({ type: 'padInterval', id: padInterval });
  }, [playPad, playMelody]);

  const stopMusic = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
    }
    activeNodesRef.current.filter(n => n.type === 'padInterval').forEach(n => { clearInterval(n.id); });
    activeNodesRef.current = activeNodesRef.current.filter(n => n.type !== 'padInterval');
  }, []);

  useEffect(() => {
    currentSceneRef.current = sceneType;
    if (sceneType === 'none') { stopMusic(); return; }
    if (!audioCtxRef.current) { initAudio(); }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') { audioCtxRef.current.resume(); }
    stopMusic();
    setTimeout(startMusic, 100);
  }, [sceneType, initAudio, startMusic, stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      // Don't close shared context
    };
  }, [stopMusic]);

  return null;
}

export default SceneMusic;
