/**
 * Home page — title, subtitle, start button.
 */

import React from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import Sparkles from '../components/Sparkles';
import Achievements from '../components/Achievements';
import Narrator from '../components/Narrator';
import SpeakButton from '../components/SpeakButton';

export default function HomePage({ volume, setVolume, stats, showAchievements, setShowAchievements, onNavigate, narrationEnabled = true }) {
  const narration = showAchievements
    ? `Statistik. Du har spillet ${stats.games} spil og vundet ${stats.wins}. Tryk på krydset for at lukke.`
    : 'Velkommen til My Little Pony, Tails of Equestria. Tryk på den store lyserøde startknap for at vælge et eventyr.';
  return (
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
      <Narrator text={narration} volume={volume} narrationKey={`home-${showAchievements}`} enabled={narrationEnabled} />
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
        <button
          className="achievements-btn"
          onClick={() => onNavigate('stats')}
          title="Spil-statistik"
          aria-label="Åbn spil-statistik"
        >
          📊
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
        <SpeakButton text={narration} volume={volume} label="Læs forsiden højt" />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="btn-start"
          onClick={() => onNavigate('theme')}
          aria-label="Start nyt spil"
        >
          🎮 Start Nyt Spil!
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="btn-start btn-farm"
          onClick={() => onNavigate('farm')}
          aria-label="Gå til ponystalden"
        >
          🐴 Ponystalden
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};
