import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDice from './dice/ReactDice';
import SceneMusic, { playClick, playRoll, playSuccess, playFail, playSelect, playVictory, setMasterVolume, resumeAudioContext } from './SceneMusic';
import './App.css';

const API = window.location.origin.replace('3001', '8082');

const PONIES = [
  { navn: 'Jordpony',  emoji: '🐴', img: 'jordpony.png',  bonus: 'Stærk 💪', color: '#8B4513', diceBonus: 1 },
  { navn: 'Pegasus',   emoji: '🦅', img: 'pegasus.png',   bonus: 'Flyver 🪽', color: '#87CEEB', diceBonus: 1 },
  { navn: 'Enhjørning', emoji: '🦄', img: 'enhjorning.png', bonus: 'Magisk horn ✨', color: '#9370DB', diceBonus: 2 },
  { navn: 'Alicorn',   emoji: '👑', img: 'alicorn.png',   bonus: 'Magi + vinger 🌟', color: '#FFD700', diceBonus: 2 },
];

// Achievement system
function useAchievements() {
  const [stats, setStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pony_stats') || '{"wins":0,"losses":0,"games":0,"bestScore":0}');
    } catch { return { wins: 0, losses: 0, games: 0, bestScore: 0 }; }
  });

  const recordGame = useCallback((victory, score) => {
    setStats(prev => {
      const next = {
        ...prev,
        games: prev.games + 1,
        wins: victory ? prev.wins + 1 : prev.wins,
        losses: victory ? prev.losses : prev.losses + 1,
        bestScore: Math.max(prev.bestScore, score || 0),
      };
      localStorage.setItem('pony_stats', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    const zero = { wins: 0, losses: 0, games: 0, bestScore: 0 };
    setStats(zero);
    localStorage.setItem('pony_stats', JSON.stringify(zero));
  }, []);

  return { stats, recordGame, resetStats };
}

// Tutorial system
function useTutorial() {
  const [shown, setShown] = useState(() => {
    return localStorage.getItem('pony_tutorial_seen') === 'true';
  });

  const markSeen = useCallback(() => {
    setShown(true);
    localStorage.setItem('pony_tutorial_seen', 'true');
  }, []);

  return { shown, markSeen };
}

// Tutorial overlay component
function TutorialOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="tutorial-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="tutorial-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>🦄 Sådan spiller du!</h2>
        <ol className="tutorial-steps">
          <li><strong>Vælg en pony</strong> — hver har sine egne fordele ✨</li>
          <li><strong>Læs scenen</strong> — find ud af hvad du skal gøre 📖</li>
          <li><strong>Kast terningerne</strong> — held og lykke! 🎲</li>
          <li><strong>Overlev 5 scener</strong> — for at vinde! 🏆</li>
        </ol>
        <button className="btn-start" onClick={onClose} aria-label="Start spil">
          Lad os gå! 🚀
        </button>
      </motion.div>
    </motion.div>
  );
}

// Sparkle component
function Sparkles() {
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 16,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    emoji: ['✨', '⭐', '💫', '🌟', '🦋'][Math.floor(Math.random() * 5)]
  }));
  return (
    <div className="sparkles-container">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0.5] }}
          transition={{ delay: s.delay, duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
        >
          {s.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Confetti component for victory
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#7B68EE', '#32CD32'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 10,
    shape: Math.random() > 0.5 ? 'circle' : 'square'
  }));
  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={`confetti confetti-${p.shape}`}
          style={{ left: `${p.x}%`, backgroundColor: p.color, width: p.size, height: p.size }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [1, 1, 0], rotate: 720 }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// Floating background elements
function FloatingBg() {
  const items = [
    { emoji: '🌈', x: 10, y: 20, d: 4 },
    { emoji: '🦋', x: 80, y: 15, d: 3 },
    { emoji: '🌸', x: 20, y: 70, d: 5 },
    { emoji: '🎈', x: 70, y: 60, d: 3.5 },
    { emoji: '🍭', x: 50, y: 80, d: 4.5 },
    { emoji: '🌙', x: 90, y: 40, d: 5.5 },
    { emoji: '🎀', x: 5, y: 50, d: 3 },
    { emoji: '🌻', x: 60, y: 30, d: 4 },
  ];
  return (
    <div className="floating-bg">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="floating-emoji"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: item.d, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Dice component using react-dice-complete
function DiceRoll({ dice }) {
  const reactDice = useRef(null);
  const hasRolled = useRef(false);

  useEffect(() => {
    if (dice && dice.length > 0 && !hasRolled.current) {
      hasRolled.current = true;
      playRoll();
      setTimeout(() => {
        reactDice.current?.rollAll(dice);
      }, 100);
    }
  }, [dice]);

  return (
    <div className="dice-row">
      <ReactDice
        ref={reactDice}
        numDice={dice?.length || 2}
        sides={6}
        dieSize={48}
        faceColor="#ffffff"
        dotColor="#e91e8c"
        dieCornerRadius={8}
        margin={10}
        outline={true}
        outlineColor="#f093fb"
        rollTime={1.5}
        disableIndividual={true}
        disableRandom={true}
        defaultRoll={1}
      />
    </div>
  );
}

// Volume slider component
function VolumeControl({ volume, onChange }) {
  return (
    <div className="volume-control">
      <span className="volume-icon" aria-label={`Lydstyrke: ${Math.round(volume * 100)}%`}>
        {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(v);
          setMasterVolume(v);
        }}
        className="volume-slider"
        aria-label="Justér lydstyrke"
        title={`Lydstyrke: ${Math.round(volume * 100)}%`}
      />
    </div>
  );
}

// Achievements display
function Achievements({ stats }) {
  return (
    <div className="achievements">
      <h3>🏆 Statistikk</h3>
      <div className="achievement-grid">
        <div className="achievement-card">
          <span className="achievement-emoji">🎮</span>
          <span className="achievement-value">{stats.games}</span>
          <span className="achievement-label">Spil</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">🌟</span>
          <span className="achievement-value">{stats.wins}</span>
          <span className="achievement-label">Sejre</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">💪</span>
          <span className="achievement-value">{stats.losses}</span>
          <span className="achievement-label">Nederlag</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">🏆</span>
          <span className="achievement-value">{stats.bestScore}</span>
          <span className="achievement-label">Bedste score</span>
        </div>
      </div>
      {stats.games >= 1 && (
        <div className="achievement-badge">
          {stats.wins / stats.games >= 0.5 ? '⭐ Halv vejen til Pony Mester!' : '🐣 Keep trying, little pony!'}
        </div>
      )}
    </div>
  );
}

// Page transition wrapper
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

function App() {
  const [page, setPage] = useState('home');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showAchievements, setShowAchievements] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const scrollRef = useRef(null);
  const { stats, recordGame } = useAchievements();
  const { shown: tutorialShown, markSeen } = useTutorial();

  // Auto-scroll history feed
  useEffect(() => {
    if (scrollRef.current && data && data.history && data.history.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  // Record game end achievements
  const isGameEnd = page === 'game' && data && data.finished;
  useEffect(() => {
    if (isGameEnd && data) {
      const score = data.score ? parseInt(data.score) || 0 : 0;
      recordGame(data.victory, score);
      if (data.victory) playVictory();
    }
  }, [isGameEnd, data]);

  const startGame = async (typeIdx) => {
    playSelect();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: typeIdx, tema: 0 })
      });
      if (!r.ok) throw new Error('Server fejl');
      const json = await r.json();
      setData(json);
      setPage('game');
    } catch (e) {
      setError('Kunne ikke starte spil: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const rollDice = async () => {
    playRoll();
    setDiceRolling(true);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/kast`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!r.ok) throw new Error('Server fejl');
      const json = await r.json();
      setData(json);
      // Play SFX based on result
      const lastResult = json.history && json.history[json.history.length - 1];
      if (lastResult) {
        if (lastResult.success) playSuccess();
        else playFail();
      }
    } catch (e) {
      setError('Kunne ikke kaste terninger: ' + e.message);
    } finally {
      setLoading(false);
      setDiceRolling(false);
    }
  };

  const retryRoll = async () => {
    // Retry the last roll without losing game state
    setError(null);
    setDiceRolling(true);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/kast`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!r.ok) throw new Error('Server fejl');
      const json = await r.json();
      setData(json);
      const lastResult = json.history && json.history[json.history.length - 1];
      if (lastResult) {
        if (lastResult.success) playSuccess();
        else playFail();
      }
    } catch (e) {
      setError('Kunne ikke kaste terninger: ' + e.message);
    } finally {
      setLoading(false);
      setDiceRolling(false);
    }
  };

  const navigateTo = (p) => {
    playClick();
    setPage(p);
    if (p === 'home' || p === 'start') setData(null);
    setError(null);
  };

  // Enable sound on first user interaction
  const enableSound = () => {
    resumeAudioContext();
    setSoundEnabled(true);
  };

  // === LOADING (always shows first) ===
  if (loading) {
    return (
      <div className="loading-screen">
        <SceneMusic sceneType="none" />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="spinner"
        >
          🎲
        </motion.div>
        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
          {diceRolling ? 'Kaster terninger...' : 'Indlæser...'}
        </motion.p>
      </div>
    );
  }

  // === ERROR (always shows first) ===
  if (error) {
    const isMidGame = page === 'game' && data;
    return (
      <div className="error-screen">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <p>❌ {error}</p>
        </motion.div>
        {isMidGame && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-start"
            onClick={retryRoll}
            style={{ marginBottom: '0.5rem' }}
            aria-label="Prøv igen"
          >
            🔄 Prøv Igen
          </motion.button>
        )}
        <button className="btn-back" onClick={() => navigateTo('home')} aria-label="Tilbage til forsiden">
          Tilbage
        </button>
      </div>
    );
  }

  // === RENDER PAGES WITH TRANSITIONS ===
  return (
    <AnimatePresence mode="wait">
      {/* Sound enable prompt */}
      {!soundEnabled && (
        <motion.div
          key="sound-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sound-prompt-overlay"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="sound-prompt-card"
          >
            <p>🔊 Aktivér lyd for den bedste oplevelse!</p>
            <button className="btn-start" onClick={enableSound} aria-label="Aktivér lyd">
              Aktiver lyd
            </button>
            <button className="btn-back" onClick={() => { enableSound(); setSoundEnabled(true); }} aria-label="Skip lyd">
              Skip
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Tutorial overlay */}
      {!tutorialShown && soundEnabled && !showAchievements && (
        <AnimatePresence>
          <TutorialOverlay onClose={() => { markSeen(); navigateTo('start'); }} />
        </AnimatePresence>
      )}

      {/* HOME */}
      {page === 'home' && soundEnabled && (
        <motion.div
          key="home"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          className="home"
        >
          <SceneMusic sceneType={volume > 0 ? 'home' : 'none'} />
          <div className="top-bar">
            <VolumeControl volume={volume} onChange={setVolume} />
            <button
              className="achievements-btn"
              onClick={() => setShowAchievements(!showAchievements)}
              title="Statistikk"
              aria-label="Åbn statistikk"
            >
              🏆
            </button>
          </div>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="achievements-backdrop"
              onClick={() => setShowAchievements(false)}
            />
          )}
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="achievements-overlay"
              role="dialog"
              aria-label="Statistikk"
            >
              <Achievements stats={stats} />
              <button className="btn-close" onClick={() => setShowAchievements(false)} aria-label="Luk statistikk">✕</button>
            </motion.div>
          )}
          <FloatingBg />
          <Sparkles />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="home-content">
            <motion.div
              className="banner-emoji"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🦄🌈✨
            </motion.div>
            <motion.h1
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="title"
            >
              My Little Pony
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="subtitle"
            >
              Tails of Equestria
            </motion.h2>
            <motion.p className="home-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              Vælg din pony og gå på eventyr! 🎮
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="btn-start"
              onClick={() => navigateTo('start')}
              aria-label="Start nyt spil"
            >
              🎮 Start Nyt Spil!
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* CHOOSE PONY */}
      {page === 'start' && soundEnabled && (
        <motion.div
          key="start"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          className="start-page"
        >
          <SceneMusic sceneType={volume > 0 ? 'home' : 'none'} />
          <div className="top-bar">
            <VolumeControl volume={volume} onChange={setVolume} />
          </div>
          <FloatingBg />
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="title">
            Vælg din Pony! 🐴
          </motion.h1>
          <motion.p className="page-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Hver pony har sine egne superkræfter!
          </motion.p>
          <div className="pony-choices">
            {PONIES.map((p, i) => (
              <motion.div
                key={p.navn}
                whileHover={{ scale: 1.08, y: -8, rotate: [0, -2, 2, 0] }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="pony-card"
                style={{ borderColor: p.color }}
                onClick={() => startGame(i)}
                role="button"
                tabIndex={0}
                aria-label={`Vælg ${p.navn} - ${p.bonus}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startGame(i); }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                >
                  <img src={`${API}/static/images/${p.img}`} alt={p.navn} />
                </motion.div>
                <div className="pony-emoji">{p.emoji}</div>
                <h3>{p.navn}</h3>
                <p className="pony-bonus">{p.bonus}</p>
                {p.diceBonus > 0 && (
                  <p className="pony-dice-bonus">+{p.diceBonus} på første terning 🎲</p>
                )}
              </motion.div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="btn-back" onClick={() => navigateTo('home')} aria-label="Tilbage til forsiden">
            Tilbage
          </motion.button>
        </motion.div>
      )}

      {/* GAME END */}
      {isGameEnd && soundEnabled && (
        <motion.div
          key="game-end"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          className="game-end"
        >
          <SceneMusic sceneType={volume > 0 ? (data.victory ? 'victory' : data.mixed ? 'mixed' : 'defeat') : 'none'} />
          <div className="top-bar">
            <VolumeControl volume={volume} onChange={setVolume} />
          </div>
          {data.victory && <Confetti />}
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="end-title"
          >
            {data.victory ? '🌟 SEJR! 🌟' : data.mixed ? '⚖️ Blant resultat! ⚖️' : '💪 Prøv igen! 💪'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="end-text"
          >
            {data.endText}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="score"
          >
            {data.score}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="history"
          >
            <h2>📖 Hvad skete der? 📖</h2>
            {data.history.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className={`history-item ${item.success ? 'success' : 'fail'}`}
              >
                <div className="history-action">{item.action}</div>
                <DiceRoll dice={item.dice} />
                <div className="history-result">{item.result}</div>
                {item.story && <p className="history-story">{item.story}</p>}
              </motion.div>
            ))}
          </motion.div>
          <div className="actions">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="btn-start"
              onClick={() => { setData(null); setPage('start'); }}
              aria-label="Spil igen"
            >
              🎲 Spil Igen!
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="btn-home"
              onClick={() => { setData(null); setPage('home'); }}
              aria-label="Tilbage til forsiden"
            >
              🏠 Forside
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* GAME SCENE */}
      {page === 'game' && data && !data.finished && soundEnabled && (
        <motion.div
          key="game"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          className="game"
        >
          <SceneMusic sceneType={volume > 0 ? 'game' : 'none'} />
          <div className="top-bar">
            <VolumeControl volume={volume} onChange={setVolume} />
          </div>
          <FloatingBg />
          <motion.div key={data.sceneNum} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="scene-header">
            <motion.div
              className="progress-bar-visual"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <motion.div
                  key={i}
                  className="progress-dot"
                  style={{ backgroundColor: i < (data.history?.length || 0) ? (data.history[i]?.success ? '#4caf50' : '#ff9800') : '#ccc' }}
                  animate={{ scale: i < (data.history?.length || 0) ? 1.3 : 1 }}
                />
              ))}
            </motion.div>
            <h1>{data.tema}</h1>
          </motion.div>

          <motion.div key="pony" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="pony-card-mini">
            <motion.img
              src={`${API}${data.ponyImg}`}
              alt={data.ponyName}
              className="pony-mini-img"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="pony-info">
              <strong>{data.ponyName}</strong>
              <span className="pony-type-badge">{data.ponyType}</span>
            </div>
          </motion.div>

          {/* History feed scrolls up */}
          <div className="history-feed" ref={scrollRef}>
            <AnimatePresence>
              {(data.history || []).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  className={`history-feed-item ${item.success ? 'success' : 'fail'}`}
                >
                  <div className="feed-action">
                    <span className="feed-emoji">{item.success ? '✅' : '❌'}</span>
                    {item.action}
                  </div>
                  <DiceRoll dice={item.dice} />
                  <div className="feed-result">{item.result}</div>
                  {item.story && <p className="feed-story">{item.story}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Current scene */}
          <motion.div key={data.sceneNum} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="scene-card">
            <div className="scene-number">{data.sceneNum}</div>
            <p className="scene-text">{data.sceneText}</p>
            <div className="scene-action">
              <span className="action-label">Du skal:</span>
              <span className="action-text">{data.actionText}</span>
            </div>
            <div className="scene-difficulty">{data.difficulty}</div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-roll"
            onClick={rollDice}
            disabled={loading}
            animate={diceRolling ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            aria-label="Kast terningerne"
          >
            🎲 KAST TERNINGERNE! 🎲
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
