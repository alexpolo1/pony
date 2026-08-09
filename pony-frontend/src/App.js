import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneMusic, { playClick, playRoll, playSuccess, playFail, playSelect, playVictory, resumeAudioContext } from './SceneMusic';
import TutorialOverlay from './components/TutorialOverlay';
import HomePage from './pages/HomePage';
import ThemeSelectPage from './pages/ThemeSelectPage';
import PonySelectPage from './pages/PonySelectPage';
import GameScenePage from './pages/GameScenePage';
import GameEndPage from './pages/GameEndPage';
import * as api from './services/api';
import * as achievements from './services/achievements';
import './App.css';

// Fallback pony data if API fails to load
const DEFAULT_PONIES = [
  { navn: 'Jordpony',  emoji: '🐴', img: 'jordpony.png',  bonus: 'Stærk 💪', color: '#8B4513', diceBonus: 1 },
  { navn: 'Pegasus',   emoji: '🦅', img: 'pegasus.png',   bonus: 'Flyver 🪽', color: '#87CEEB', diceBonus: 1 },
  { navn: 'Enhjørning', emoji: '🦄', img: 'enhjorning.png', bonus: 'Magisk horn ✨', color: '#9370DB', diceBonus: 2 },
  { name: 'Alicorn',   emoji: '👑', img: 'alicorn.png',   bonus: 'Magi + vinger 🌟', color: '#FFD700', diceBonus: 2 },
];

// Achievement hook — thin wrapper around the service
function useAchievements() {
  const [stats, setStats] = useState(() => achievements.getStats());

  const recordGame = useCallback((victory, score) => {
    setStats(achievements.recordGame(victory, score));
  }, []);

  const resetStats = useCallback(() => {
    achievements.resetStats();
    setStats(achievements.getStats());
  }, []);

  return { stats, recordGame, resetStats };
}

// Tutorial hook
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
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [content, setContent] = useState({ ponies: DEFAULT_PONIES, themes: [] });
  const { stats, recordGame } = useAchievements();
  const { shown: tutorialShown, markSeen } = useTutorial();

  // Load content from backend on mount
  useEffect(() => {
    api.loadContent().then(result => {
      setContent(result || { ponies: DEFAULT_PONIES, themes: [] });
    });
  }, []);

  // Record game end achievements
  const isGameEnd = page === 'game' && data && data.finished;
  useEffect(() => {
    if (isGameEnd && data) {
      const score = data.score ? parseInt(data.score) || 0 : 0;
      recordGame(data.victory, score);
      if (data.victory) playVictory();
    }
  }, [isGameEnd, data]);

  const handleStartGame = async (typeIdx) => {
    playSelect();
    setLoading(true);
    setError(null);
    try {
      const json = await api.startGame(typeIdx, selectedTheme);
      setData(json);
      setPage('game');
    } catch (e) {
      setError('Kunne ikke starte spil: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRollDice = async () => {
    playRoll();
    setDiceRolling(true);
    setLoading(true);
    try {
      const json = await api.rollDice();
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

  const handleVoiceAnswer = async (audioBlob, speakResponse) => {
    const sceneId = data.history?.length || 0;
    const result = await api.sendVoiceAnswer(
      data.gameId, sceneId, data.voice?.question?.id, audioBlob,
    );
    await speakResponse?.(result.child_response);
    if (result.gameState) {
      setData(result.gameState);
      const lastResult = result.gameState.history?.[result.gameState.history.length - 1];
      if (lastResult) lastResult.success ? playSuccess() : playFail();
    }
    return result;
  };

  const handleRetryRoll = async () => {
    setError(null);
    setDiceRolling(true);
    setLoading(true);
    try {
      const json = await api.rollDice();
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

  const enableSound = () => {
    resumeAudioContext();
    setSoundEnabled(true);
  };

  const handleTutorialClose = () => {
    markSeen();
    setSelectedTheme(0);
    navigateTo('theme');
  };

  // === LOADING ===
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

  // === ERROR ===
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
            onClick={handleRetryRoll}
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

  // === RENDER PAGES ===
  return (
    <AnimatePresence mode="wait">
      {/* Sound prompt */}
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
          <TutorialOverlay onClose={handleTutorialClose} />
        </AnimatePresence>
      )}

      {/* Pages */}
      {soundEnabled && (
        <>
          {page === 'home' && (
            <HomePage
              volume={volume}
              setVolume={setVolume}
              stats={stats}
              showAchievements={showAchievements}
              setShowAchievements={setShowAchievements}
              onNavigate={navigateTo}
            />
          )}

          {page === 'theme' && (
            <ThemeSelectPage
              themes={content.themes}
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
              volume={volume}
              setVolume={setVolume}
              onNavigate={navigateTo}
            />
          )}

          {page === 'start' && (
            <PonySelectPage
              ponies={content.ponies}
              onStartGame={handleStartGame}
              volume={volume}
              setVolume={setVolume}
              onNavigate={navigateTo}
            />
          )}

          {page === 'game' && data && !data.finished && (
            <GameScenePage
              data={data}
              onRollDice={handleRollDice}
              onVoiceAnswer={handleVoiceAnswer}
              volume={volume}
              setVolume={setVolume}
            />
          )}

          {isGameEnd && (
            <GameEndPage
              data={data}
              onNavigate={(p) => {
                if (p === 'start') {
                  setData(null);
                  setPage('start');
                } else {
                  navigateTo(p);
                }
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default App;
