import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { loadAppearance } from '../services/ponyAppearance';
import { playClick, playSuccess } from '../SceneMusic';
import './PonyFarmPage.css';

const SPRITE_SIZE = 32;
// The body (base) and mane sheets contain a walk gait on row 4. Only these
// columns are clean frames — column 3 is a broken blob and column 7 is empty.
const WALK = [0, 1, 2, 4, 5, 6];
const IDLE_COL = 0; // shared standing pose at (row 0, col 0) across every sheet
const WALK_FPS_MS = 110; // ~9 fps gait while moving

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

// Build the pony's layer stack (back → front) from the child's config.
// Only base + mane have a walk gait (row 4); the rest are single-frame
// overlays that always sit on the idle pose.
function buildLayers(appearance) {
  const layers = [
    { id: 'base', file: '/sprites/pony/base.png', colorKey: 'bodyColor', animated: true },
    { id: 'tail', file: `/sprites/pony/tail-${appearance.tail}.png`, colorKey: 'tailColor', animated: false },
    { id: 'mane', file: `/sprites/pony/mane-${appearance.mane}.png`, colorKey: 'maneColor', animated: true },
  ];
  if (appearance.hasWings) layers.push({ id: 'wing', file: `/sprites/pony/wing-${appearance.wing}.png`, colorKey: 'wingColor', animated: false });
  if (appearance.hasHorn) layers.push({ id: 'horn', file: `/sprites/pony/horn-${appearance.horn}.png`, colorKey: 'hornColor', animated: false });
  layers.push({ id: 'eye', file: '/sprites/pony/eye.png', colorKey: 'eyeColor', animated: false });
  return layers;
}

function PonyFarmPage({ onNavigate, volume, setVolume }) {
  const [appearance] = useState(loadAppearance);
  const [layers] = useState(() => buildLayers(appearance));
  const canvasRef = useRef(null);
  const layerCanvasRef = useRef(null);
  const sheetsRef = useRef({});
  const worldRef = useRef({ x: 96, y: 70, facing: 1 });
  const keysRef = useRef({});
  const walkFrameRef = useRef(0);
  const lastWalkTickRef = useRef(0);
  const goalRef = useRef(null);
  const [goal, setGoal] = useState(null);

  // Preload every layer sheet once.
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

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const start = useCallback((x, y) => {
    const world = worldRef.current;
    world.facing = x < world.x ? -1 : 1;
    const g = { x: clamp(x, 24, 296), y: clamp(y, 40, 188), hit: false };
    goalRef.current = g; setGoal(g);
  }, []);

  // Keyboard: arrow keys + WASD.
  useEffect(() => {
    const map = {
      arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
      arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    };
    const kd = (e) => { if (map[e.key.toLowerCase()]) { e.preventDefault(); keysRef.current[e.key.toLowerCase()] = true; } };
    const ku = (e) => { if (map[e.key.toLowerCase()]) keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const getLayerCanvas = () => {
    if (!layerCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = SPRITE_SIZE; c.height = SPRITE_SIZE;
      layerCanvasRef.current = c;
    }
    return layerCanvasRef.current.getContext('2d');
  };

  // Animation loop — one requestAnimationFrame drives everything.
  useEffect(() => {
    let raf;
    const step = (t) => {
      const canvas = canvasRef.current;
      const ctx = canvas && canvas.getContext('2d');
      if (ctx) draw(ctx, t);
      raf = requestAnimationFrame(step);
    };

    const draw = (ctx, t) => {
      const world = worldRef.current;
      const W = 320, H = 220;
      ctx.imageSmoothingEnabled = false;
      ctx.filter = 'none';

      // ---- background: grass with vertical stripes, sky strip, fence ----
      ctx.fillStyle = '#6fb95a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#79c466';
      for (let i = 0; i < W; i += 16) ctx.fillRect(i, 0, 8, H);
      ctx.fillStyle = '#bfe3ff'; ctx.fillRect(0, 0, W, 18);
      ctx.fillStyle = '#9c6b34';
      for (let i = 6; i < W; i += 22) ctx.fillRect(i, 14, 3, 12);
      ctx.fillStyle = '#b07c41'; ctx.fillRect(0, 15, W, 3);
      drawFlower(ctx, 34, 150, '#ffd23f');
      drawFlower(ctx, 285, 60, '#ff7eb6');
      drawFlower(ctx, 60, 190, '#c39bff');
      drawTree(ctx, 272, 40);
      drawHouse(ctx, 44, 40);

      // ---- move the pony ----
      const k = keysRef.current;
      let dx = (k.left ? -1 : 0) + (k.right ? 1 : 0);
      let dy = (k.up ? -1 : 0) + (k.down ? 1 : 0);
      if (goalRef.current) {
        const g = goalRef.current;
        if (dx === 0) dx = g.x - world.x > 2 ? 1 : g.x - world.x < -2 ? -1 : 0;
        if (dy === 0) dy = g.y - world.y > 2 ? 1 : g.y - world.y < -2 ? -1 : 0;
        if (Math.abs(g.x - world.x) <= 2 && Math.abs(g.y - world.y) <= 2) g.hit = true;
      }
      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        if (dx < 0) world.facing = -1; else if (dx > 0) world.facing = 1;
        world.x = clamp(world.x + dx * 2.2, 24, 296);
        world.y = clamp(world.y + dy * 2.2, 40, 188);
      }
      if (goalRef.current && goalRef.current.hit) {
        goalRef.current = null; setGoal(null); playSuccess();
      }
      // gait cadence while moving
      if (moving && t - lastWalkTickRef.current > WALK_FPS_MS) {
        lastWalkTickRef.current = t;
        walkFrameRef.current = (walkFrameRef.current + 1) % WALK.length;
      }

      // ---- shadow under the pony ----
      const cx = Math.round(world.x + 16), cy = Math.round(world.y + 16);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 15, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

      // ---- composite the pony into a 32x32 offscreen canvas (per-layer color) ----
      const row = moving ? 4 : 0;
      const col = moving ? WALK[walkFrameRef.current] : IDLE_COL;
      const octx = getLayerCanvas();
      octx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      for (const l of layers) {
        const sheet = sheetsRef.current[l.id];
        if (!sheet || !sheet.width) continue;
        const useRow = l.animated ? row : 0;
        const useCol = l.animated ? col : IDLE_COL;
        octx.filter = COLOR_FILTERS[appearance[l.colorKey]] || 'none';
        octx.drawImage(sheet,
          useCol * SPRITE_SIZE, useRow * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
          0, 0, SPRITE_SIZE, SPRITE_SIZE);
      }
      octx.filter = 'none';

      // ---- blit the pony, flipping for left-facing ----
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (world.facing === -1) {
        ctx.translate(Math.round(world.x) + SPRITE_SIZE, Math.round(world.y));
        ctx.scale(-1, 1);
        ctx.drawImage(octx.canvas, 0, 0, SPRITE_SIZE, SPRITE_SIZE, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
      } else {
        ctx.drawImage(octx.canvas, 0, 0, SPRITE_SIZE, SPRITE_SIZE, Math.round(world.x), Math.round(world.y), SPRITE_SIZE, SPRITE_SIZE);
      }
      ctx.restore();

      // ---- goal marker ----
      if (goalRef.current) {
        const g = goalRef.current;
        const pulse = 0.5 + 0.5 * Math.sin(t / 200);
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.4 * pulse;
        ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(g.x + 16, g.y + 16, 16 + 2 * pulse, 9 + 2 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        ctx.font = '10px system-ui'; ctx.fillStyle = '#fffbe6'; ctx.textAlign = 'center';
        ctx.fillText('Hjælpen! →', g.x + 16, g.y - 4);
      }

      // ---- HUD hint ----
      ctx.filter = 'none';
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText('Styr ponyen: piletaster / W A S D — eller tryk på græsset', 8, 30);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointer = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 220;
    start(x - 16, y - 16);
  };

  const dirBtn = (dir, label) => (
    <button
      className="pf-dir"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); keysRef.current[dir] = true; }}
      onPointerUp={() => { keysRef.current[dir] = false; }}
      onPointerLeave={() => { keysRef.current[dir] = false; }}
      onPointerCancel={() => { keysRef.current[dir] = false; }}
    >
      {label}
    </button>
  );

  return (
    <div className="farm-page">
      <div className="farm-topbar">
        <button className="btn-back" onClick={() => { playClick(); onNavigate('home'); }} aria-label="Tilbage">←</button>
        <div className="farm-title">
          <span className="farm-title-emoji">🌾</span>
          <span>Ponystalden</span>
        </div>
        <div className="farm-hud">
          <label className="farm-vol">
            🔊
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="farm-stage">
        <canvas ref={canvasRef} width={320} height={220} className="farm-canvas" onPointerDown={onPointer} />
      </div>

      <div className="farm-controls">
        <div className="farm-dpad">
          <span />
          {dirBtn('up', '▲')}
          <span />
          {dirBtn('left', '◀')}
          <span className="farm-dpad-mid">🐴</span>
          {dirBtn('right', '▶')}
          <span />
          {dirBtn('down', '▼')}
          <span />
        </div>
        <div className="farm-hint">
          <p>💡 Gå ud i græsset eller brug piletasterne, så går ponyen.</p>
        </div>
      </div>
    </div>
  );
}

function drawFlower(ctx, x, y, color) {
  ctx.save(); ctx.filter = 'none';
  ctx.fillStyle = '#4c8a3f'; ctx.fillRect(x - 1, y, 2, 10);
  ctx.fillStyle = color; ctx.fillRect(x - 3, y - 4, 8, 4); ctx.fillRect(x, y - 7, 2, 8);
  ctx.fillStyle = '#fff27a'; ctx.fillRect(x, y - 2, 2, 2);
  ctx.restore();
}

function drawTree(ctx, x, y) {
  ctx.save(); ctx.filter = 'none';
  ctx.fillStyle = '#7a5220'; ctx.fillRect(x - 2, y + 12, 5, 14);
  ctx.fillStyle = '#3f9b46';
  ctx.beginPath(); ctx.arc(x, y + 8, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 8, y + 14, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y + 14, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5cbf5f'; ctx.beginPath(); ctx.arc(x - 3, y + 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHouse(ctx, x, y) {
  ctx.save(); ctx.filter = 'none';
  ctx.fillStyle = '#e7cfa2'; ctx.fillRect(x - 16, y, 40, 30);
  ctx.fillStyle = '#b9774a';
  ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 4, y - 16); ctx.lineTo(x + 28, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 2, y + 12, 12, 18);
  ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 14, y + 8, 8, 8);
  ctx.restore();
}

export default PonyFarmPage;
