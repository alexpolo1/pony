/**
 * Theme selection page — choose which adventure to play.
 */

import React from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import Narrator from '../components/Narrator';
import SpeakButton from '../components/SpeakButton';

export default function ThemeSelectPage({ themes, selectedTheme, setSelectedTheme, volume, setVolume, onNavigate }) {
  const choices = themes.map((theme, index) => `Mulighed ${index + 1}: ${theme.titel}.`).join(' ');
  return (
    <motion.div
      key="theme"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="start-page"
    >
      <SceneMusic sceneType={volume > 0 ? 'home' : 'none'} />
      <Narrator
        text={`Vælg et eventyr. ${choices} Tryk på billedet af det eventyr, du vil opleve.`}
        volume={volume}
        narrationKey={`themes-${themes.map(theme => theme.id).join('-')}`}
      />
      <div className="top-bar">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
      <FloatingBg />
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="title">
        Vælg et eventyr! 📖
      </motion.h1>
      <motion.p className="page-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        Hvilken historie vil du opleve?
      </motion.p>
      <SpeakButton
        text={`Vælg et eventyr. ${choices}`}
        volume={volume}
        label="Læs alle eventyr højt"
      />
      <div className="pony-choices">
        {themes.map((t, i) => (
          <motion.div
            key={t.id || i}
            whileHover={{ scale: 1.08, y: -8 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="pony-card"
            style={{ borderColor: selectedTheme === i ? '#f093fb' : 'transparent' }}
            onClick={() => { setSelectedTheme(i); onNavigate('start'); }}
            role="button"
            tabIndex={0}
            aria-label={`Vælg ${t.titel}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedTheme(i); onNavigate('start'); } }}
          >
            <div className="pony-emoji">{t.emoji}</div>
            <h3>{t.titel}</h3>
            <p className="pony-bonus">{t.sceneCount || 5} scener</p>
            <SpeakButton
              text={`${t.titel}. ${t.intro || ''}`}
              volume={volume}
              label={`Læs eventyret ${t.titel} højt`}
              className="card-speak-button"
            />
          </motion.div>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="btn-back" onClick={() => onNavigate('home')} aria-label="Tilbage til forsiden">
        Tilbage
      </motion.button>
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};
