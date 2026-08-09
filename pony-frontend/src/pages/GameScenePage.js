/**
 * Game scene — active gameplay with scene text, dice roll, and history feed.
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import DiceRoll from '../components/DiceRoll';

const API = window.location.origin.replace('3001', '8082');

export default function GameScenePage({ data, onRollDice, volume, setVolume }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && data && data.history && data.history.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  return (
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
        onClick={onRollDice}
        disabled={false}
        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
        aria-label="Kast terningerne"
      >
        🎲 KAST TERNINGERNE! 🎲
      </motion.button>
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};