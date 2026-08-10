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
import PixelPonySprite from '../components/PixelPonySprite';
import { DEFAULT_APPEARANCE } from '../pixelPony/spriteData';

export default function GameScenePage({
  data, onRollDice, onVoiceAnswer, onInteract, rolling = false,
  interactionBusy = false, volume, setVolume, avatarConfig,
}) {
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
    const sceneNarration = buildCurrentSceneNarration(data, { afterResult: !!resultNarration });

    // Generate both clips while the dice animation/result is visible.
    prepareDanishSpeech(resultNarration);
    prepareDanishSpeech(sceneNarration);

    const narrate = async () => {
      if (resultNarration) {
        setActivePanel('result');
        try { await speakDanish(resultNarration, volume); }
        catch { /* the next scene must still be introduced */ }
      }
      if (cancelled) return;
      setActivePanel('scene');
      try { await speakDanish(sceneNarration, volume); }
      catch { /* controls remain usable if narration is unavailable */ }
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
  const narrationLabel = interactionBusy
    ? 'Tjekker dit valg...'
    : rolling
    ? 'Terningerne ruller...'
    : narrationStatus === 'preparing'
    ? 'Forbereder oplæsning...'
    : narrationStatus === 'speaking'
      ? 'Ponyen fortæller historien...'
      : 'Klar til at lytte';
  const visualStatus = interactionBusy
    ? 'checking'
    : rolling
      ? 'rolling'
      : narrationStatus;
  const statusIcon = visualStatus === 'checking'
    ? '✨'
    : visualStatus === 'rolling'
      ? '🎲'
      : visualStatus === 'preparing'
        ? '🔊'
        : visualStatus === 'speaking'
          ? '🗣️'
          : '🎧';
  const usesDice = (data.interaction?.type || 'dice') === 'dice';

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
        <h1>
          {data.themeIcon && (
            <img
              className="theme-pixel-icon theme-pixel-icon-inline"
              src={`/sprites/scenes/icon-${data.themeIcon}.png`}
              alt=""
              aria-hidden="true"
            />
          )}
          {data.tema}
        </h1>
      </motion.div>

      <motion.div key="pony" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="pony-card-mini">
        <motion.div
          className="pony-mini-avatar" role="img" aria-label={`${data.ponyName}, din pixelpony`}
          animate={{ y: [0, -3, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
        >
          <PixelPonySprite {...DEFAULT_APPEARANCE} {...avatarConfig} scale={2} />
        </motion.div>
        <div className="pony-info">
          <strong>{data.ponyName}</strong>
          <span className="pony-type-badge">{data.ponyType}</span>
        </div>
      </motion.div>

      <div
        className={`narration-status narration-${visualStatus}`}
        role="status" aria-live="polite" aria-label={narrationLabel}
      >
        <span className="narration-status-icon" aria-hidden="true">{statusIcon}</span>
        <div
          className="narration-load-track" role="progressbar"
          aria-label={narrationLabel} aria-valuemin="0" aria-valuemax="100"
          aria-valuetext={narrationLabel}
        >
          <span className="narration-load-fill" />
          {visualStatus === 'speaking' && (
            <span className="narration-sound-waves" aria-hidden="true">
              <i /><i /><i /><i />
            </span>
          )}
        </div>
        <span className="narration-status-text">{narrationLabel}</span>
      </div>

      <AnimatePresence mode="wait">
        {activePanel === 'result' && lastResult ? (
          <motion.div
            key={`result-${data.history.length}`}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className={`story-window result-window ${lastResult.success ? 'success' : 'fail'}`}
          >
            <div className="story-window-title">
              <span>{lastResult.success ? '✅' : '🌈'}</span> {lastResult.action}
            </div>
            {!!lastResult.dice?.length && <DiceRoll dice={lastResult.dice} />}
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
            {data.clueNumber != null && (
              <motion.div
                className="clue-number-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span aria-hidden="true">🔢</span> {data.clueNumber}
              </motion.div>
            )}
            <p className="scene-text">{data.sceneText}</p>
            <SpeakButton
              text={buildCurrentSceneNarration(data)} volume={volume}
              label="Læs scenen højt" className="scene-speak-button"
            />
            <div className="scene-action">
              <span className="action-label">Du skal:</span>
              <span className="action-text">{data.actionText}</span>
            </div>
            {data.interaction?.prompt && (
              <p className="interaction-prompt">{data.interaction.prompt}</p>
            )}
            {data.interactionFeedback && !data.interactionProgressed && (
              <p className="interaction-feedback" role="alert">{data.interactionFeedback}</p>
            )}
            <div className="scene-difficulty">{data.difficulty}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`game-controls ${usesDice ? 'game-controls-dice' : 'game-controls-options'}`}>
        <VoiceButton
          enabled={!!data.voice?.enabled} onAnswer={handleVoiceAnswer}
          speaking={narrationBusy} disabled={rolling || interactionBusy}
        />

        {usesDice ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-roll btn-roll-die"
            onClick={onRollDice}
            disabled={rolling || interactionBusy}
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            aria-label="Kast terningerne"
          >
            <span className="roll-die-face" aria-hidden="true">
              <i className="pip pip-1" /><i className="pip pip-2" /><i className="pip pip-3" />
              <i className="pip pip-4" /><i className="pip pip-5" />
            </span>
          </motion.button>
        ) : (
          <div className={`interaction-options interaction-${data.interaction?.type || 'choice'}`}>
            {(data.interaction?.options || []).map((option, optionIndex) => (
              <motion.button
                key={option.id} type="button" className="interaction-option"
                style={option.color ? { '--option-color': option.color } : undefined}
                onClick={() => onInteract(option.id)}
                disabled={interactionBusy}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                aria-label={`Vælg mulighed ${optionIndex + 1}: ${option.label}`}
              >
                <span className="interaction-option-number" aria-hidden="true">{optionIndex + 1}</span>
                <span className="interaction-option-emoji" aria-hidden="true">{option.emoji}</span>
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};
