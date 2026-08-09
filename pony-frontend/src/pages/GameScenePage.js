/**
 * Game scene — active gameplay with scene text, dice roll, and history feed.
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import DiceRoll from '../components/DiceRoll';
import VoiceButton from '../components/VoiceButton';
import { cancelSpeech, NARRATION_STATUS_EVENT, prepareDanishSpeech, speakDanish } from '../services/tts';
import { buildCurrentSceneNarration, buildResultNarration } from '../services/narration';
import SpeakButton from '../components/SpeakButton';

const API = window.location.origin.replace('3001', '8082');

export default function GameScenePage({ data, onRollDice, onVoiceAnswer, rolling = false, volume, setVolume, avatarConfig }) {
  const previousHistoryLength = useRef(data.history?.length || 0);
  const [narrationStatus, setNarrationStatus] = useState('idle');
  const [activePanel, setActivePanel] = useState('scene');

  useEffect(() => {
    const onStatus = event => setNarrationStatus(event.detail?.status || 'idle');
    window.addEventListener(NARRATION_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(NARRATION_STATUS_EVENT, onStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const historyLength = data.history?.length || 0;
    const lastResult = data.history?.[data.history.length - 1];
    const hasNewResult = historyLength > previousHistoryLength.current;
    previousHistoryLength.current = historyLength;
    const resultNarration = hasNewResult ? buildResultNarration(lastResult) : '';
    const sceneNarration = buildCurrentSceneNarration(data);

    // Generate both clips while the dice animation/result is visible.
    prepareDanishSpeech(resultNarration);
    prepareDanishSpeech(sceneNarration);

    const narrate = async () => {
      if (resultNarration) {
        setActivePanel('result');
        await speakDanish(resultNarration, volume);
      }
      if (cancelled) return;
      setActivePanel('scene');
      await speakDanish(sceneNarration, volume);
    };
    narrate();
    return () => {
      cancelled = true;
      cancelSpeech();
    };
    // A scene change should be read once; changing volume must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sceneNum, data.history?.length]);

  const handleVoiceAnswer = (blob) => onVoiceAnswer(
    blob,
    text => speakDanish(text, volume),
  );

  const lastResult = data.history?.[data.history.length - 1];
  const narrationBusy = narrationStatus !== 'idle';
  const narrationLabel = rolling
    ? 'Terningerne ruller...'
    : narrationStatus === 'preparing'
    ? 'Forbereder oplæsning...'
    : narrationStatus === 'speaking'
      ? 'Ponyen fortæller historien...'
      : 'Klar til at lytte';

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

      <div className={`narration-status narration-${narrationStatus}`} role="status" aria-live="polite">
        <span aria-hidden="true">{rolling ? '🎲' : narrationStatus === 'preparing' ? '⏳' : narrationStatus === 'speaking' ? '🔊' : '🎧'}</span>
        {narrationLabel}
      </div>

      <AnimatePresence mode="wait">
        {activePanel === 'result' && lastResult ? (
          <motion.div
            key={`result-${data.history.length}`}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className={`story-window result-window ${lastResult.success ? 'success' : 'fail'}`}
          >
            <div className="story-window-title">
              <span>{lastResult.success ? '✅' : '❌'}</span> {lastResult.action}
            </div>
            <DiceRoll dice={lastResult.dice} />
            <div className="feed-result">{lastResult.result}</div>
            {lastResult.story && <p className="feed-story">{lastResult.story}</p>}
            <SpeakButton
              text={buildResultNarration(lastResult)} volume={volume}
              label="Læs terningresultatet højt" className="scene-speak-button"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`scene-${data.sceneNum}`}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="story-window scene-card"
          >
            <div className="scene-number">{data.sceneNum}</div>
            <p className="scene-text">{data.sceneText}</p>
            <SpeakButton
              text={buildCurrentSceneNarration(data)} volume={volume}
              label="Læs scenen højt" className="scene-speak-button"
            />
            <div className="scene-action">
              <span className="action-label">Du skal:</span>
              <span className="action-text">{data.actionText}</span>
            </div>
            <div className="scene-difficulty">{data.difficulty}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="game-controls">
        <VoiceButton
          enabled={!!data.voice?.enabled} onAnswer={handleVoiceAnswer}
          speaking={narrationBusy} disabled={rolling}
        />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="btn-roll btn-roll-die"
          onClick={onRollDice}
          disabled={rolling || narrationBusy || activePanel === 'result'}
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
          aria-label="Kast terningerne"
        >
          <span className="roll-die-face" aria-hidden="true">
            <i className="pip pip-1" /><i className="pip pip-2" /><i className="pip pip-3" />
            <i className="pip pip-4" /><i className="pip pip-5" />
          </span>
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
