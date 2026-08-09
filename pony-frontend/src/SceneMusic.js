import { useEffect, useRef, useCallback } from 'react';

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* storage may be blocked */ }
}

/**
 * AudioManager — singleton that manages the shared Web Audio API context.
 *
 * Features:
 *  - Separate music and SFX volume controls
 *  - Global mute toggle
 *  - localStorage persistence of settings
 *  - Proper cleanup of audio nodes
 *  - Respects browser autoplay policy
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.activeNodes = [];
    this._musicVolume = parseFloat(readStorage('pony_music_vol', '0.5'));
    this._sfxVolume = parseFloat(readStorage('pony_sfx_vol', '0.7'));
    this._muted = readStorage('pony_muted', 'false') === 'true';
    this.unsupported = false;
  }

  init() {
    if (this.ctx || this.unsupported) return !!this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      this.unsupported = true;
      return false;
    }
    try {
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
    } catch {
      this.ctx = this.masterGain = this.musicGain = this.sfxGain = null;
      this.unsupported = true;
      return false;
    }

    this.musicGain.gain.value = this._muted ? 0 : this._musicVolume;
    this.sfxGain.gain.value = this._muted ? 0 : this._sfxVolume;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    return true;
  }

  get() {
    this.init();
    return {
      ctx: this.ctx,
      master: this.masterGain,
      music: this.musicGain,
      sfx: this.sfxGain,
    };
  }

  setMusicVolume(v) {
    this._musicVolume = v;
    writeStorage('pony_music_vol', String(v));
    if (this.musicGain) {
      const vol = this._muted ? 0 : v;
      this.musicGain.gain.linearRampToValueAtTime(vol, this.ctx?.currentTime + 0.1 || 0.1);
    }
  }

  duckMusic(ducked) {
    if (!this.musicGain || !this.ctx) return;
    const target = this._muted ? 0 : (ducked ? this._musicVolume * 0.18 : this._musicVolume);
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + (ducked ? 0.15 : 0.6));
  }

  setSfxVolume(v) {
    this._sfxVolume = v;
    writeStorage('pony_sfx_vol', String(v));
    if (this.sfxGain) {
      const vol = this._muted ? 0 : v;
      this.sfxGain.gain.linearRampToValueAtTime(vol, this.ctx?.currentTime + 0.1 || 0.1);
    }
  }

  setMuted(muted) {
    this._muted = muted;
    writeStorage('pony_muted', muted ? 'true' : 'false');
    if (this.musicGain) {
      this.musicGain.gain.linearRampToValueAtTime(muted ? 0 : this._musicVolume, this.ctx.currentTime + 0.1);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.linearRampToValueAtTime(muted ? 0 : this._sfxVolume, this.ctx.currentTime + 0.1);
    }
  }

  resume() {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  scheduleNote(freq, startTime, duration, gainNode, type = 'sine') {
    const { ctx } = this.get();
    if (!ctx || !gainNode) return;
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
    this.activeNodes.push({ osc, gain });
    setTimeout(() => {
      const idx = this.activeNodes.findIndex(n => n.osc === osc);
      if (idx >= 0) this.activeNodes.splice(idx, 1);
    }, (duration + 0.2) * 1000);
  }
}

const audioManager = new AudioManager();

// ---- SFX functions (use sfxGain) ----

export function playClick() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(800, t);
  o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g); g.connect(sfx);
  o.start(t); o.stop(t + 0.1);
}

export function playRoll() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  for (let i = 0; i < 5; i++) {
    const t = ctx.currentTime + i * 0.04;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 200 + Math.random() * 400;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.04);
  }
}

export function playSuccess() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  [523, 659, 784].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.1;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.4);
  });
}

export function playFail() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  [392, 349, 311].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.12;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.5);
  });
}

export function playSelect() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g); g.connect(sfx);
  o.start(t); o.stop(t + 0.15);
}

export function playVictory() {
  const { ctx, sfx } = audioManager.get();
  if (!ctx || !sfx) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.15;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.6);
  });
}

// ---- Backward-compatible master volume (maps to music) ----

export function setMasterVolume(v) {
  audioManager.setMusicVolume(v);
}

export function resumeAudioContext() {
  audioManager.resume();
}

export function duckMusic(ducked) {
  audioManager.duckMusic(ducked);
}

// ---- Music component (uses musicGain) ----

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
  const padGainRef = useRef(null);
  const melodyGainRef = useRef(null);
  const activeNodesRef = useRef([]);
  const intervalRef = useRef(null);
  const startTimeoutRef = useRef(null);
  const currentSceneRef = useRef(sceneType);
  const isPlayingRef = useRef(false);

  const initAudio = useCallback(() => {
    audioManager.init();
    const { ctx, music } = audioManager.get();
    if (!ctx || !music) return false;
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    padGain.connect(music);
    padGainRef.current = padGain;
    const melodyGain = ctx.createGain();
    melodyGain.gain.value = 0;
    melodyGain.connect(music);
    melodyGainRef.current = melodyGain;
    onReady && onReady(true);
    return true;
  }, [onReady]);

  const playNote = useCallback((freq, startTime, duration, gainNode, type = 'sine') => {
    audioManager.scheduleNote(freq, startTime, duration, gainNode, type);
  }, []);

  const playPad = useCallback(() => {
    const { ctx, music } = audioManager.get();
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
    const { ctx } = audioManager.get();
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
    if (isPlayingRef.current || !audioManager.ctx || !melodyGainRef.current) return;
    isPlayingRef.current = true;
    const config = SCENE_CONFIGS[currentSceneRef.current] || SCENE_CONFIGS.game;
    const intervalMs = (60 / config.bpm) * 1000;
    if (melodyGainRef.current) {
      melodyGainRef.current.gain.linearRampToValueAtTime(config.volume, audioManager.ctx.currentTime + 1);
    }
    playPad();
    intervalRef.current = setInterval(playMelody, intervalMs);
    const padInterval = setInterval(playPad, 8000);
    activeNodesRef.current.push({ type: 'padInterval', id: padInterval });
  }, [playPad, playMelody]);

  const stopMusic = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
    if (melodyGainRef.current && audioManager.ctx) {
      melodyGainRef.current.gain.linearRampToValueAtTime(0, audioManager.ctx.currentTime + 1);
    }
    activeNodesRef.current.filter(n => n.type === 'padInterval').forEach(n => { clearInterval(n.id); });
    activeNodesRef.current = activeNodesRef.current.filter(n => n.type !== 'padInterval');
  }, []);

  useEffect(() => {
    currentSceneRef.current = sceneType;
    if (sceneType === 'none') { stopMusic(); return; }
    if (!padGainRef.current && !initAudio()) return;
    if (audioManager.ctx?.state === 'suspended') { audioManager.ctx.resume().catch(() => {}); }
    stopMusic();
    startTimeoutRef.current = setTimeout(startMusic, 100);
  }, [sceneType, initAudio, startMusic, stopMusic]);

  useEffect(() => {
    return () => { stopMusic(); };
  }, [stopMusic]);

  return null;
}

export default SceneMusic;
