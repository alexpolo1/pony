/**
 * Pony selection page — choose your character.
 */

import React from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import Narrator from '../components/Narrator';
import SpeakButton from '../components/SpeakButton';

const API = window.location.origin.replace('3001', '8082');

export default function PonySelectPage({ ponies, onSelectType, volume, setVolume, onNavigate }) {
  const choices = ponies.map((pony, index) =>
    `Mulighed ${index + 1}: ${pony.navn || pony.name}. ${pony.bonus || ''}.`
  ).join(' ');
  return (
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
      <Narrator
        text={`Vælg din pony. ${choices} Tryk på den pony, du vil være.`}
        volume={volume}
        narrationKey="pony-selection"
      />
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
      <SpeakButton text={`Vælg din pony. ${choices}`} volume={volume} label="Læs alle ponyer højt" />
      <div className="pony-choices">
        {ponies.map((p, i) => (
          <motion.div
            key={p.navn}
            whileHover={{ scale: 1.08, y: -8, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="pony-card"
            style={{ borderColor: p.color }}
            onClick={() => onSelectType(i)}
            role="button"
            tabIndex={0}
            aria-label={`Vælg ${p.navn} - ${p.bonus}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectType(i); }}
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
            <SpeakButton
              text={`${p.navn || p.name}. ${p.bonus || ''}`}
              volume={volume}
              label={`Læs om ${p.navn || p.name}`}
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
