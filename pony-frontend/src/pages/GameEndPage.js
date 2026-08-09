/**
 * Game end page — victory/defeat summary with history and replay buttons.
 */

import React from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import Confetti from '../components/Confetti';
import DiceRoll from '../components/DiceRoll';
import Narrator from '../components/Narrator';
import { buildEndNarration, buildResultNarration } from '../services/narration';
import SpeakButton from '../components/SpeakButton';

export default function GameEndPage({ data, onNavigate, volume, setVolume }) {
  const sceneType = data.victory ? 'victory' : data.mixed ? 'mixed' : 'defeat';
  const narration = buildEndNarration(data);

  return (
    <motion.div
      key="game-end"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="game-end"
    >
      <SceneMusic sceneType={sceneType} />
      <Narrator text={narration} volume={volume} narrationKey="game-end" delayMs={1650} />
      <div className="top-bar">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
      {data.victory && <Confetti />}
      <motion.h1
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="end-title"
      >
        {data.victory ? '🌟 SEJR! 🌟' : '🌈 FLOT EVENTYR! 🌈'}
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
      <SpeakButton text={narration} volume={volume} label="Læs afslutningen højt" />
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
            <SpeakButton
              text={buildResultNarration(item)}
              volume={volume}
              label={`Læs resultat ${i + 1} højt`}
              className="inline-speak-button"
            />
            {!!item.dice?.length && <DiceRoll dice={item.dice} />}
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
          onClick={() => onNavigate('start')}
          aria-label="Spil igen"
        >
          🎲 Spil Igen!
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="btn-home"
          onClick={() => onNavigate('home')}
          aria-label="Tilbage til forsiden"
        >
          🏠 Forside
        </motion.button>
      </div>
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};
