/**
 * PonyvillePage — "Ponyby": a walkable 2D town where you move your own pony
 * and do stories/quests.
 *
 *  - A larger world than one screen, so the camera follows the pony.
 *  - ~6 landmarks (bibliotek, frugthaven, skole, stald, park, slot).
 *  - Your pony is the EXACT one the child configured (same pixel pony, colour
 *    and walk gait) — reuses pixelPony/spriteData + services/ponyAppearance.
 *  - An NPC gives a story (Danish); you complete it by walking to the target
 *    landmark and pressing "Hjælp!" → earn a star in the story journal.
 *  - Progress persists to localStorage; success lines are read aloud (Danish TTS).
 *
 * Movement + pony compositing follow the proven PonyFarmPage pattern, scaled
 * up with a follow-camera.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadAppearance } from '../services/ponyAppearance';
import {
  getManeStyle, getTailStyle, getHornStyle, getWingStyle, getPonyType,
} from '../pixelPony/spriteData';
import { playClick, playRoll, playFail, playSuccess } from '../SceneMusic';
import { speakDanish, prepareDanishSpeech } from '../services/tts';
import DiceRoll from '../components/DiceRoll';
import {
  STORIES, getStory, loadProgress, computeActive, completeStory,
  starsEarned, countDone, ROLL_PROMPT, FAIL_LINES,
} from '../ponyville/stories';
import './PonyvillePage.css';

const TILE = 32;
// The base (body) and mane sheets carry a walk gait on row 4. Column 3 is a
// broken blob and column 7 is empty, so these columns are the clean frames.
const WALK = [0, 1, 2, 4, 5, 6];
const WALK_FPS_MS = 110;

const VIEW_W = 960;
const VIEW_H = 640;
const WORLD_W = 1280;
const WORLD_H = 896;

const PONY_SCALE = 1.6;
const PONY_PX = TILE * PONY_SCALE;
const CENTER = { x: 640, y: 470 };

const COLOR_FILTERS = {
  original: 'none',
  pink: 'hue-rotate(330deg) saturate(1.3)',
  purple: 'hue-rotate(275deg) saturate(1.4)',
  blue: 'hue-rotate(215deg) saturate(1.5)',
  teal: 'hue-rotate(180deg) saturate(1.4)',
  green: 'hue-rotate(125deg) saturate(1.3)',
  yellow: 'hue-rotate(50deg) saturate(1.5) brightness(1.15)',
  white: 'saturate(0.15) brightness(1.7)',
  black: 'brightness(0.35)',
};

const LANDMARKS = [
  { id: 'library', x: 210, y: 250, name: 'Biblioteket', color: '#c98a4e', roof: '#a44a2a', emoji: '📚' },
  { id: 'orchard', x: 1070, y: 250, name: 'Frugthaven', color: '#b07c41', roof: '#7f9a3a', emoji: '🍎' },
  { id: 'school', x: 210, y: 640, name: 'Skolen', color: '#8fa9d8', roof: '#5b6fb0', emoji: '✏️' },
  { id: 'stable', x: 1070, y: 640, name: 'Stalden', color: '#9c7a4a', roof: '#6e4f2a', emoji: '🐴' },
  { id: 'park', x: 640, y: 200, name: 'Parken', color: '#5cbf5f', roof: '#3f9b46', emoji: '🌳' },
  { id: 'castle', x: 640, y: 700, name: 'Slottet', color: '#b6a3d8', roof: '#7d6bb0', emoji: '👑' },
];

// Deterministic scatter so decoration is stable across frames.
function scatter(seed, count) {
  let s = seed >>> 0;
  const out = [];
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  for (let i = 0; i < count; i++) out.push({ x: rnd() * WORLD_W, y: rnd() * WORLD_H, r: rnd() });
  return out;
}
const FLOWERS = scatter(1337, 46);
const TREES = scatter(777, 16);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function buildLayers(appearance, ponyType) {
  const mane = getManeStyle(appearance.mane);
  const tail = getTailStyle(appearance.tail);
  const layers = [
    { id: 'base', file: '/sprites/pony/base.png', colorKey: 'bodyColor', animated: true },
    { id: 'tail', file: `/sprites/pony/${tail.file.split('/').pop()}`, colorKey: 'tailColor', animated: false },
    { id: 'mane', file: `/sprites/pony/${mane.file.split('/').pop()}`, colorKey: 'maneColor', animated: true },
  ];
  if (ponyType.hasWings && appearance.hasWings) {
    const wing = getWingStyle(appearance.wing);
    layers.push({ id: 'wing', file: `/sprites/pony/${wing.file.split('/').pop()}`, colorKey: 'wingColor', animated: false });
  }
  if (ponyType.hasHorn && appearance.hasHorn) {
    const horn = getHornStyle(appearance.horn);
    layers.push({ id: 'horn', file: `/sprites/pony/${horn.file.split('/').pop()}`, colorKey: 'hornColor', animated: false });
  }
  layers.push({ id: 'eye', file: '/sprites/pony/eye.png', colorKey: 'eyeColor', animated: false });
  return layers;
}

export default function PonyvillePage({ onNavigate, volume, setVolume }) {
  const ponyType = getPonyType(loadAppearance().ponyType);
  const [appearance] = useState(() => loadAppearance());
  const [layers] = useState(() => buildLayers(appearance, ponyType));

  const [progress, setProgress] = useState(() => loadProgress());
  const [activeId, setActiveId] = useState(() => computeActive(loadProgress()));
  const [banner, setBanner] = useState(null);
  const [inRange, setInRange] = useState(false);
  const [dialog, setDialog] = useState(null); // { story, roll, result } — the roll+voice dialog
  const [celebrate, setCelebrate] = useState(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [stars, setStars] = useState(() => starsEarned(loadProgress()));

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const layerCanvasRef = useRef(null);
  const sheetsRef = useRef({});
  const worldRef = useRef({ x: CENTER.x, y: CENTER.y, facing: 1 });
  const camRef = useRef({ x: clamp(CENTER.x - VIEW_W / 2, 0, WORLD_W - VIEW_W), y: clamp(CENTER.y - VIEW_H / 2, 0, WORLD_H - VIEW_H) });
  const keysRef = useRef({});
  const walkFrameRef = useRef(0);
  const lastWalkTickRef = useRef(0);
  const goalRef = useRef(null);
  const inRangeRef = useRef(false);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  const openDialogRef = useRef(null);

  // Fit the canvas into the stage at a 3:2 ratio, uniformly, on any viewport.
  // (Pointer mapping uses getBoundingClientRect, so a uniform CSS scale stays 1:1.)
  useEffect(() => {
    const fit = () => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return;
      const availW = stage.clientWidth - 12;
      const availH = stage.clientHeight - 12;
      const ratio = VIEW_W / VIEW_H;
      let w = Math.min(availW, availH * ratio);
      let h = w / ratio;
      if (w > 0 && h > 0) {
        canvas.style.width = `${Math.floor(w)}px`;
        canvas.style.height = `${Math.floor(h)}px`;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    return () => { window.removeEventListener('resize', fit); if (ro) ro.disconnect(); };
  }, []);

  // Preload every pony layer sheet once.
  useEffect(() => {
    let alive = true;
    Promise.all(layers.map((l) => new Promise((res) => {
      const img = new Image();
      const ok = () => res(img);
      img.onload = ok; img.onerror = ok;
      img.src = l.file;
    }))).then((imgs) => {
      if (!alive) return;
      const map = {};
      layers.forEach((l, i) => { map[l.id] = imgs[i]; });
      sheetsRef.current = map;
    });
    return () => { alive = false; };
  }, [layers]);

  // Keyboard: arrows + WASD, and E to complete.
  useEffect(() => {
    const map = {
      arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
      arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    };
    const kd = (e) => {
      const key = e.key.toLowerCase();
      if (map[key]) { e.preventDefault(); keysRef.current[map[key]] = true; }
      if (key === 'e' && activeRef.current) openDialogRef.current();
    };
    const ku = (e) => { const key = e.key.toLowerCase(); if (map[key]) keysRef.current[map[key]] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entering a new active story → show + read its intro.
  useEffect(() => {
    if (!activeId) return;
    const story = getStory(activeId);
    const lm = LANDMARKS.find((l) => l.id === story.target);
    setBanner({ text: `${story.giver}: ${story.intro}`, sub: `Gå til ${lm.name} ${story.emoji} — ${story.objective}`, kind: 'intro' });
    if (volume > 0) speakDanish(story.intro, volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const setGoal = useCallback((wx, wy) => {
    goalRef.current = { x: clamp(wx, 20, WORLD_W - 20), y: clamp(wy, 20, WORLD_H - 20), hit: false };
  }, []);

  const onPointer = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const cx = ((e.clientX - r.left) / r.width) * VIEW_W;
    const cy = ((e.clientY - r.top) / r.height) * VIEW_H;
    const wx = camRef.current.x + cx;
    const wy = camRef.current.y + cy;
    // A tap on the active story's target opens the roll dialog (if in reach).
    const id = activeRef.current;
    if (id) {
      const lm = LANDMARKS.find((l) => l.id === getStory(id).target);
      if (lm && Math.hypot(wx - lm.x, wy - lm.y) <= 64) {
        if (Math.hypot(worldRef.current.x - lm.x, worldRef.current.y - lm.y) <= 110) {
          openDialogRef.current();
          return;
        }
      }
    }
    setGoal(wx, wy);
  };

  // Open the roll dialog at the active story's target (must be within range).
  const openDialog = useCallback(() => {
    const id = activeRef.current;
    if (!id) return;
    const story = getStory(id);
    const lm = LANDMARKS.find((l) => l.id === story.target);
    const w = worldRef.current;
    if (Math.hypot(w.x - lm.x, w.y - lm.y) > 92) return; // must be at the place
    goalRef.current = null;
    setDialog({ story, roll: null, result: null });
    prepareDanishSpeech(ROLL_PROMPT);
    if (volume > 0) speakDanish(ROLL_PROMPT, volume);
  }, [volume]);

  // Roll the d6 inside the open dialog, then resolve win/fail (with voice).
  const dialogRef = useRef(null);
  dialogRef.current = dialog;
  const doRoll = useCallback(() => {
    const d = dialogRef.current;
    if (!d) return;
    const roll = 1 + Math.floor(Math.random() * 6);
    const success = roll >= d.story.diceTarget;
    const result = success ? d.story.success : FAIL_LINES[roll % FAIL_LINES.length];
    playRoll(); // the die clatters as it's thrown
    const np = completeStory(d.story.id);
    setProgress(np);
    setStars(starsEarned(np));
    inRangeRef.current = false;
    setInRange(false);
    const nextId = computeActive(np);
    const next = nextId ? getStory(nextId) : null;
    setDialog({ story: d.story, roll, result });
    setTimeout(() => { if (volume > 0) speakDanish(result, volume); }, 600);
    setTimeout(() => {
      if (success) playSuccess(); else playFail();
      setDialog(null);
      setCelebrate({ story: d.story, next });
      setActiveId(nextId);
    }, 2600);
  }, [volume]);
  openDialogRef.current = openDialog;

  const getLayerCanvas = () => {
    if (!layerCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = TILE; c.height = TILE;
      layerCanvasRef.current = c;
    }
    return layerCanvasRef.current.getContext('2d');
  };

  // ---- main animation loop (one rAF drives everything) ----
  useEffect(() => {
    let raf;
    let last = performance.now();

    const drawLandmarks = (ctx, t) => {
      const targetId = activeRef.current ? getStory(activeRef.current).target : null;
      const nearId = activeRef.current ? getStory(activeRef.current).target : null;
      const isNear = (lm) => Math.hypot(worldRef.current.x - lm.x, worldRef.current.y - lm.y) <= 92;
      LANDMARKS.slice().sort((a, b) => a.y - b.y).forEach((lm) => {
        const isTarget = lm.id === targetId;
        drawLandmark(ctx, lm, t, isTarget, isTarget && isNear(lm), nearId === lm.id);
      });
    };

    const drawPony = (ctx, t, moving) => {
      const octx = getLayerCanvas();
      const w = worldRef.current;
      const row = moving ? 4 : 0;
      const col = moving ? WALK[walkFrameRef.current] : (Math.floor(t / 480) % 2 === 0 ? 0 : 1);
      const cx = Math.round(w.x), cy = Math.round(w.y + 16);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 14, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      octx.clearRect(0, 0, TILE, TILE);
      for (const l of layers) {
        const sheet = sheetsRef.current[l.id];
        if (!sheet || !sheet.width) continue;
        const useRow = l.animated ? row : 0;
        const useCol = l.animated ? col : 0;
        octx.filter = COLOR_FILTERS[appearance[l.colorKey]] || 'none';
        octx.drawImage(sheet, useCol * TILE, useRow * TILE, TILE, TILE, 0, 0, TILE, TILE);
      }
      octx.filter = 'none';
      const sx = Math.round(w.x - PONY_PX / 2);
      const sy = Math.round(w.y - PONY_PX);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (w.facing === -1) {
        ctx.translate(sx + PONY_PX, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(octx.canvas, 0, 0, TILE, TILE, 0, 0, PONY_PX, PONY_PX);
      } else {
        ctx.drawImage(octx.canvas, 0, 0, TILE, TILE, sx, sy, PONY_PX, PONY_PX);
      }
      ctx.restore();
    };

    const drawCompass = (ctx) => {
      const id = activeRef.current;
      if (!id) return;
      const story = getStory(id);
      const lm = LANDMARKS.find((l) => l.id === story.target);
      if (!lm) return;
      const near = Math.hypot(worldRef.current.x - lm.x, worldRef.current.y - lm.y) <= 92;
      if (near) return;
      const cam = camRef.current;
      const wx = lm.x - cam.x;
      const wy = lm.y - cam.y;
      const inside = wx > 0 && wy > 0 && wx < VIEW_W && wy < VIEW_H;
      const cx = clamp(wx, 30, VIEW_W - 30);
      const cy = clamp(wy, 30, VIEW_H - 30);
      const ang = Math.atan2(wy - cy, wx - cx);
      ctx.save();
      ctx.fillStyle = 'rgba(40,28,12,0.75)';
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.translate(cx + Math.cos(ang) * 34, cy + Math.sin(ang) * 34);
      ctx.rotate(ang);
      ctx.fillStyle = '#ffcf3a';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (!inside) {
        ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('gå mod pilen →', clamp(wx, 44, VIEW_W - 44), clamp(wy, 34, VIEW_H - 22));
      }
    };

    const step = (t) => {
      const dt = clamp((t - last) / 16.667, 0, 2.5);
      last = t;
      const canvas = canvasRef.current;
      const ctx = canvas && canvas.getContext('2d');
      if (!ctx) { raf = requestAnimationFrame(step); return; }

      const world = worldRef.current;
      const k = keysRef.current;
      let dx = (k.left ? -1 : 0) + (k.right ? 1 : 0);
      let dy = (k.up ? -1 : 0) + (k.down ? 1 : 0);
      const g = goalRef.current;
      if (g) {
        if (dx === 0) dx = g.x - world.x > 3 ? 1 : g.x - world.x < -3 ? -1 : 0;
        if (dy === 0) dy = g.y - world.y > 3 ? 1 : g.y - world.y < -3 ? -1 : 0;
        if (Math.abs(g.x - world.x) <= 4 && Math.abs(g.y - world.y) <= 4) { goalRef.current = null; }
      }
      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        if (dx < 0) world.facing = -1; else if (dx > 0) world.facing = 1;
        const len = Math.hypot(dx, dy) || 1;
        world.x = clamp(world.x + (dx / len) * 2.7 * dt, 16, WORLD_W - 16);
        world.y = clamp(world.y + (dy / len) * 2.7 * dt, 16, WORLD_H - 16);
      }
      // camera follow
      const tx = clamp(world.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
      const ty = clamp(world.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
      camRef.current.x += (tx - camRef.current.x) * 0.2 * dt;
      camRef.current.y += (ty - camRef.current.y) * 0.2 * dt;
      // debug hook (harmless) — exposed so tests/tools can observe the pony
      try {
        const dbg = {
          x: Math.round(world.x), y: Math.round(world.y),
          active: activeRef.current, moving,
          setWorld: (x, y) => { world.x = clamp(x, 16, WORLD_W - 16); world.y = clamp(y, 16, WORLD_H - 16); },
        };
        window.__ponyby_dbg = dbg;
      } catch (e) { /* ignore */ }
      // gait cadence
      if (moving && t - lastWalkTickRef.current > WALK_FPS_MS) {
        lastWalkTickRef.current = t;
        walkFrameRef.current = (walkFrameRef.current + 1) % WALK.length;
      }
      // proximity to active target
      let near = false;
      if (activeRef.current) {
        const lm = LANDMARKS.find((l) => l.id === getStory(activeRef.current).target);
        if (lm) near = Math.hypot(world.x - lm.x, world.y - lm.y) <= 92;
      }
      if (near !== inRangeRef.current) { inRangeRef.current = near; setInRange(near); }

      // ---- draw ----
      ctx.imageSmoothingEnabled = false;
      ctx.filter = 'none';
      ctx.fillStyle = '#79c466';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.save();
      ctx.translate(-Math.round(camRef.current.x), -Math.round(camRef.current.y));
      drawGround(ctx);
      drawPaths(ctx);
      drawPond(ctx, 470, 470);
      drawBushes(ctx);
      drawLandmarks(ctx, t);
      drawPony(ctx, t, moving);
      ctx.restore();
      drawCompass(ctx);
      // soft frame
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - 4);

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirBtn = (dir, label) => (
    <button
      className="pv-dir"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); keysRef.current[dir] = true; }}
      onPointerUp={() => { keysRef.current[dir] = false; }}
      onPointerLeave={() => { keysRef.current[dir] = false; }}
      onPointerCancel={() => { keysRef.current[dir] = false; }}
    >
      {label}
    </button>
  );

  const closeCelebrate = () => {
    playClick();
    setCelebrate(null);
    if (!activeId) {
      setBanner({ text: '🎉 Du klarede alle historier i Ponyby! 🎉', sub: 'Gå rundt så længe du har lyst.', kind: 'done' });
    }
  };

  return (
    <div className="pv-page">
      <div className="pv-topbar">
        <button className="btn-back" onClick={() => { playClick(); onNavigate('home'); }} aria-label="Tilbage">←</button>
        <div className="pv-title"><span>🏰</span><span>Ponyby</span></div>
        <button
          className="pv-journal-btn"
          onClick={() => { playClick(); setJournalOpen((o) => !o); }}
          aria-label="Åbn journal"
        >
          📖 Journal
        </button>
        <div className="pv-stars" aria-label="Stjerner" title="Stjerner samlet">
          {'⭐'.repeat(stars)}{'·'.repeat(Math.max(0, 18 - stars))}
        </div>
      </div>

      <div className="pv-stage" ref={stageRef}>
        {banner && (
          <div className={`pv-banner pv-banner-${banner.kind}`} role="status">
            <p>{banner.text}</p>
            {banner.sub && <p className="pv-banner-sub">{banner.sub}</p>}
          </div>
        )}

        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="pv-canvas" onPointerDown={onPointer} />

        {inRange && activeId && !dialog && (
          <button className="pv-do" onPointerDown={(e) => { e.preventDefault(); openDialog(); }} aria-label="Hjælp!">
            🙌 Hjælp!
          </button>
        )}

        <AnimatePresence>
          {dialog && (
            <motion.div
              key="pv-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pv-dialog-backdrop"
              role="dialog"
              aria-label={dialog.story.title}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: -20 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className={`pv-dialog-card ${dialog.result ? (dialog.roll >= dialog.story.diceTarget ? 'is-win' : 'is-fail') : ''}`}
              >
                <div className="pv-dialog-head">
                  <span className="pv-dialog-emoji">{dialog.story.emoji}</span>
                  <span className="pv-dialog-title">{dialog.story.title}</span>
                </div>
                <p className="pv-dialog-objective">{dialog.story.objective}</p>
                {dialog.roll == null ? (
                  <>
                    <p className="pv-dialog-prompt">{ROLL_PROMPT}</p>
                    <p className="pv-dialog-target">Skal du slå {dialog.story.diceTarget} eller højere 🎲</p>
                    <button className="btn-roll pv-dialog-roll" onPointerDown={(e) => { e.preventDefault(); doRoll(); }} aria-label="Kast terningen">
                      <span className="roll-die-face" aria-hidden="true">
                        <i className="pip pip-1" /><i className="pip pip-2" /><i className="pip pip-3" />
                        <i className="pip pip-4" /><i className="pip pip-5" />
                      </span>
                      <span className="pv-dialog-roll-label">Kast terningen</span>
                    </button>
                  </>
                ) : (
                  <>
                    <DiceRoll dice={[dialog.roll]} />
                    <div className="pv-dialog-result">
                      <span>{dialog.roll >= dialog.story.diceTarget ? '🎉 Det lykkedes!' : '🌈 Næsten…'}</span>
                    </div>
                    <p className="pv-dialog-result-text">{dialog.result}</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {journalOpen && (
          <div className="pv-journal" role="dialog" aria-label="Historie-journal">
            <div className="pv-journal-head">
              <span>Historier</span>
              <button className="pv-close" onClick={() => { playClick(); setJournalOpen(false); }} aria-label="Luk">✕</button>
            </div>
            {STORIES.map((s) => {
              const done = !!progress.done[s.id];
              const active = s.id === activeId;
              return (
                <div key={s.id} className={`pv-jrow ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
                  <span className="pv-jemoji">{s.emoji}</span>
                  <span className="pv-jtitle">{s.title}</span>
                  <span className="pv-jstars">{done ? '⭐'.repeat(s.stars) : active ? '▸' : '🔒'}</span>
                </div>
              );
            })}
            <p className="pv-jcount">Klaret: {countDone(progress)} af {STORIES.length}</p>
          </div>
        )}

        {celebrate && (
          <div className="pv-celebrate" role="dialog" aria-label="Historie klaret">
            <div className="pv-celebrate-card">
              <div className="pv-celebrate-stars">{'⭐'.repeat(celebrate.story.stars)}</div>
              <h3>{celebrate.story.emoji} {celebrate.story.title}</h3>
              <p>{celebrate.story.success}</p>
              {celebrate.next ? (
                <p className="pv-next">Næste: {celebrate.next.emoji} {celebrate.next.title}</p>
              ) : (
                <p className="pv-next">Du klarede dem alle! 🏆</p>
              )}
              <button className="btn-start" onClick={closeCelebrate}>
                {celebrate.next ? 'Fortsæt →' : '🏆 Færdig!'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pv-controls">
        <div className="pv-dpad">
          <span />
          {dirBtn('up', '▲')}
          <span />
          {dirBtn('left', '◀')}
          <span className="pv-dpad-mid">🐴</span>
          {dirBtn('right', '▶')}
          <span />
          {dirBtn('down', '▼')}
          <span />
        </div>
        <div className="pv-hint">
          <p>💡 Tryk på græsset for at gå, eller brug piletasterne / W A S D.</p>
          <p>🙌 Når du er ved det rigtige sted, tryk “Hjælp!” (eller <b>E</b>).</p>
        </div>
      </div>
    </div>
  );
}

// ---- pure world-drawing helpers (take coords as args) ----

function drawGround(ctx) {
  ctx.fillStyle = '#79c466';
  for (let x = 0; x < WORLD_W; x += 96) ctx.fillRect(x, 0, 48, WORLD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 0; y < WORLD_H; y += 80) ctx.fillRect(0, y, WORLD_W, 40);
  FLOWERS.forEach((f) => drawFlower(ctx, f.x, f.y, f.r));
}

function drawFlower(ctx, x, y, r) {
  const c = r > 0.66 ? '#ffd23f' : r > 0.33 ? '#ff7eb6' : '#c39bff';
  ctx.save(); ctx.filter = 'none';
  ctx.fillStyle = '#4c8a3f'; ctx.fillRect(x - 1, y, 2, 8);
  ctx.fillStyle = c; ctx.fillRect(x - 3, y - 3, 8, 4); ctx.fillRect(x, y - 6, 2, 8);
  ctx.fillStyle = '#fff27a'; ctx.fillRect(x, y - 2, 2, 2);
  ctx.restore();
}

function drawPaths(ctx) {
  ctx.strokeStyle = '#c9a972';
  ctx.lineCap = 'round';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(CENTER.x, CENTER.y);
  LANDMARKS.forEach((lm) => ctx.lineTo(lm.x, lm.y));
  ctx.stroke();
  ctx.fillStyle = '#d8bd88';
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a972';
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, 46, 0, Math.PI * 2); ctx.fill();
}

function drawBushes(ctx) {
  ctx.fillStyle = '#3f9b46';
  TREES.forEach((tr) => {
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, 10 + tr.r * 6, 0, Math.PI * 2);
    ctx.arc(tr.x - 8, tr.y + 4, 7, 0, Math.PI * 2);
    ctx.arc(tr.x + 8, tr.y + 4, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPond(ctx, x, y) {
  ctx.fillStyle = '#5aa6e0';
  ctx.beginPath(); ctx.ellipse(x, y, 46, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7cc2ee';
  ctx.beginPath(); ctx.ellipse(x - 8, y - 4, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
}

function drawLandmark(ctx, lm, t, isTarget, targetNear) {
  const { x, y, name, color, roof, emoji } = lm;
  ctx.save(); ctx.filter = 'none';
  ctx.fillStyle = color; ctx.fillRect(x - 34, y, 68, 46);
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(x - 42, y); ctx.lineTo(x, y - 26); ctx.lineTo(x + 42, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 8, y + 20, 16, 26);
  ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 16, y + 12, 12, 12);
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; ctx.strokeRect(x + 16, y + 12, 12, 12);
  ctx.font = '20px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(emoji, x, y + 12);
  ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
  const w = ctx.measureText(name).width + 12;
  ctx.fillStyle = 'rgba(40,28,12,0.85)';
  ctx.fillRect(x - w / 2, y + 50, w, 18);
  ctx.fillStyle = '#fffbe6';
  ctx.fillText(name, x, y + 63);
  ctx.restore();

  if (isTarget) {
    const pulse = 0.5 + 0.5 * Math.sin(t / 200);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.4 * pulse;
    ctx.strokeStyle = targetNear ? '#a8ff9e' : '#fff27a';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y + 14, 54 + 6 * pulse, 34 + 4 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
    const bounce = Math.sin(t / 160) * 5;
    ctx.globalAlpha = 1;
    ctx.font = 'bold 34px system-ui'; ctx.textAlign = 'center';
    ctx.fillStyle = targetNear ? '#5be07a' : '#ffcf3a';
    ctx.fillText('!', x, y - 34 + bounce);
    ctx.restore();
  }
}
