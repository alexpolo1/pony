/**
 * Pixel Pony Configurator — build your pony in steps: type, body color,
 * eyes, mane, tail, horn, wings. Replaces the old plain pony-type select
 * screen; finishing the wizard starts the game with the chosen type.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import Narrator from '../components/Narrator';
import SpeakButton from '../components/SpeakButton';
import PixelPonySprite, { ManeIcon, TailIcon, HornIcon, WingIcon } from '../components/PixelPonySprite';
import {
  MANE_STYLES, TAIL_STYLES, HORN_STYLES, WING_STYLES, COLOR_OPTIONS, PONY_TYPES,
  IDLE_FRAME, IDLE_FRAME_2,
} from '../pixelPony/spriteData';
import { loadAppearance, saveAppearance } from '../services/ponyAppearance';

const STEPS = ['type', 'body', 'eyes', 'mane', 'tail', 'horn', 'wings'];
const STEP_TITLES = {
  type: 'Vælg din Pony! 🐴',
  body: 'Vælg krop-farve 🎨',
  eyes: 'Vælg øjenfarve 👀',
  mane: 'Vælg manke 💇',
  tail: 'Vælg hale 🐎',
  horn: 'Vælg horn 🦄',
  wings: 'Vælg vinger 🪽',
};

function ColorSwatches({ options, value, onPick, labelPrefix, swatchColor }) {
  return (
    <div className="pixel-color-row">
      {options.map(c => (
        <button
          key={c.id}
          type="button"
          className={`pixel-color-swatch ${value === c.id ? 'is-selected' : ''}`}
          style={{ filter: c.filter, backgroundColor: swatchColor }}
          onClick={() => onPick(c.id)}
          aria-label={`${labelPrefix}: ${c.label}`}
          aria-pressed={value === c.id}
          title={c.label}
        />
      ))}
    </div>
  );
}

export default function PixelPonyConfiguratorPage({ ponies, onSelectType, volume, setVolume, onNavigate }) {
  const [step, setStep] = useState(0);
  const [typeIdx, setTypeIdx] = useState(null);
  const [appearance, setAppearance] = useState(loadAppearance);
  const [bobFrame, setBobFrame] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setBobFrame(b => !b), 500);
    return () => window.clearInterval(id);
  }, []);

  const set = (key, value) => setAppearance(prev => ({ ...prev, [key]: value }));

  const handlePickType = (idx) => {
    const type = PONY_TYPES[idx] || PONY_TYPES[0];
    setTypeIdx(idx);
    setAppearance(prev => ({ ...prev, ponyType: type.id, hasHorn: type.hasHorn, hasWings: type.hasWings }));
    setStep(1);
  };

  const goBack = () => {
    if (step === 0) {
      onNavigate('home');
    } else {
      setStep(s => s - 1);
    }
  };

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const handleStart = () => {
    saveAppearance(appearance);
    onSelectType(typeIdx ?? 0);
  };

  const stepName = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const narration = {
    type: 'Vælg din pony type. Tryk på den pony du vil være.',
    body: 'Vælg en farve til din ponys krop.',
    eyes: 'Vælg en farve til din ponys øjne.',
    mane: 'Vælg en manke og en mankefarve til din pony.',
    tail: 'Vælg en hale og en halefarve til din pony.',
    horn: 'Vælg om din pony skal have horn, og vælg form og farve.',
    wings: 'Vælg om din pony skal have vinger, og vælg form og farve. Tryk på start eventyr når du er klar.',
  }[stepName];

  return (
    <motion.div
      key="pixel-configurator"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="pixel-configurator"
    >
      <SceneMusic sceneType={volume > 0 ? 'home' : 'none'} />
      <Narrator text={narration} volume={volume} narrationKey={`pixel-configurator-${stepName}`} />
      <div className="top-bar">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
      <FloatingBg />
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="title">
        {STEP_TITLES[stepName]}
      </motion.h1>
      <p className="pixel-configurator-progress">Trin {step + 1} af {STEPS.length}</p>
      <SpeakButton text={narration} volume={volume} label="Læs siden højt" />

      {stepName !== 'type' && (
        <div className="pixel-configurator-preview">
          <PixelPonySprite
            {...appearance}
            frame={bobFrame ? IDLE_FRAME_2 : IDLE_FRAME}
            scale={8}
          />
        </div>
      )}

      {stepName === 'type' && (
        <div className="pony-choices">
          {ponies.map((p, i) => (
            <motion.div
              key={p.navn || p.name}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="pony-card"
              style={{ borderColor: p.color }}
              onClick={() => handlePickType(i)}
              role="button"
              tabIndex={0}
              aria-label={`Vælg ${p.navn || p.name} - ${p.bonus}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePickType(i); }}
            >
              <div className="pony-emoji">{p.emoji}</div>
              <h3>{p.navn || p.name}</h3>
              <p className="pony-bonus">{p.bonus}</p>
            </motion.div>
          ))}
        </div>
      )}

      {stepName === 'body' && (
        <section className="pixel-configurator-section">
          <ColorSwatches
            options={COLOR_OPTIONS}
            value={appearance.bodyColor}
            onPick={(id) => set('bodyColor', id)}
            labelPrefix="Kropsfarve"
            swatchColor="#b5533f"
          />
        </section>
      )}

      {stepName === 'eyes' && (
        <section className="pixel-configurator-section">
          <ColorSwatches
            options={COLOR_OPTIONS}
            value={appearance.eyeColor}
            onPick={(id) => set('eyeColor', id)}
            labelPrefix="Øjenfarve"
            swatchColor="#76d2fb"
          />
        </section>
      )}

      {stepName === 'mane' && (
        <>
          <section className="pixel-configurator-section">
            <h2>Manke</h2>
            <div className="pixel-mane-grid">
              {MANE_STYLES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`pixel-mane-swatch ${appearance.mane === m.id ? 'is-selected' : ''}`}
                  onClick={() => set('mane', m.id)}
                  aria-label={`Vælg manke: ${m.label}`}
                  aria-pressed={appearance.mane === m.id}
                  title={m.label}
                >
                  <ManeIcon mane={m.id} maneColor={appearance.maneColor} frame={IDLE_FRAME} scale={2} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="pixel-configurator-section">
            <h2>Mankefarve</h2>
            <ColorSwatches
              options={COLOR_OPTIONS}
              value={appearance.maneColor}
              onPick={(id) => set('maneColor', id)}
              labelPrefix="Mankefarve"
              swatchColor="#f3a13f"
            />
          </section>
        </>
      )}

      {stepName === 'tail' && (
        <>
          <section className="pixel-configurator-section">
            <h2>Hale-form</h2>
            <div className="pixel-mane-grid">
              {TAIL_STYLES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`pixel-mane-swatch ${appearance.tail === t.id ? 'is-selected' : ''}`}
                  onClick={() => set('tail', t.id)}
                  aria-label={`Vælg hale: ${t.label}`}
                  aria-pressed={appearance.tail === t.id}
                  title={t.label}
                >
                  <TailIcon tail={t.id} tailColor={appearance.tailColor} scale={2} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="pixel-configurator-section">
            <h2>Halefarve</h2>
            <ColorSwatches
              options={COLOR_OPTIONS}
              value={appearance.tailColor}
              onPick={(id) => set('tailColor', id)}
              labelPrefix="Halefarve"
              swatchColor="#f3a13f"
            />
          </section>
        </>
      )}

      {stepName === 'horn' && (
        <>
          <section className="pixel-configurator-section">
            <div className="pixel-toggle-row">
              <button
                type="button"
                className={`pixel-toggle ${appearance.hasHorn ? 'is-selected' : ''}`}
                onClick={() => set('hasHorn', !appearance.hasHorn)}
                aria-pressed={appearance.hasHorn}
              >
                🦄 Horn til/fra
              </button>
            </div>
          </section>
          {appearance.hasHorn && (
            <>
              <section className="pixel-configurator-section">
                <h2>Horn-form</h2>
                <div className="pixel-mane-grid">
                  {HORN_STYLES.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      className={`pixel-mane-swatch ${appearance.horn === h.id ? 'is-selected' : ''}`}
                      onClick={() => set('horn', h.id)}
                      aria-label={`Vælg horn: ${h.label}`}
                      aria-pressed={appearance.horn === h.id}
                      title={h.label}
                    >
                      <HornIcon horn={h.id} hornColor={appearance.hornColor} scale={2} />
                      <span>{h.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="pixel-configurator-section">
                <h2>Hornfarve</h2>
                <ColorSwatches
                  options={COLOR_OPTIONS}
                  value={appearance.hornColor}
                  onPick={(id) => set('hornColor', id)}
                  labelPrefix="Hornfarve"
                  swatchColor="#ffe066"
                />
              </section>
            </>
          )}
        </>
      )}

      {stepName === 'wings' && (
        <>
          <section className="pixel-configurator-section">
            <div className="pixel-toggle-row">
              <button
                type="button"
                className={`pixel-toggle ${appearance.hasWings ? 'is-selected' : ''}`}
                onClick={() => set('hasWings', !appearance.hasWings)}
                aria-pressed={appearance.hasWings}
              >
                🪽 Vinger til/fra
              </button>
            </div>
          </section>
          {appearance.hasWings && (
            <>
              <section className="pixel-configurator-section">
                <h2>Vinge-form</h2>
                <div className="pixel-mane-grid">
                  {WING_STYLES.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      className={`pixel-mane-swatch ${appearance.wing === w.id ? 'is-selected' : ''}`}
                      onClick={() => set('wing', w.id)}
                      aria-label={`Vælg vinge: ${w.label}`}
                      aria-pressed={appearance.wing === w.id}
                      title={w.label}
                    >
                      <WingIcon wing={w.id} wingColor={appearance.wingColor} scale={2} />
                      <span>{w.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="pixel-configurator-section">
                <h2>Vingefarve</h2>
                <ColorSwatches
                  options={COLOR_OPTIONS}
                  value={appearance.wingColor}
                  onPick={(id) => set('wingColor', id)}
                  labelPrefix="Vingefarve"
                  swatchColor="#f5c8af"
                />
              </section>
            </>
          )}
        </>
      )}

      <div className="pixel-configurator-nav">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="btn-back" onClick={goBack} aria-label="Tilbage">
          Tilbage
        </motion.button>
        {stepName !== 'type' && !isLastStep && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="btn-start" onClick={goNext} aria-label="Næste trin">
            Næste ➡️
          </motion.button>
        )}
        {isLastStep && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="btn-start" onClick={handleStart} aria-label="Start eventyr">
            Start eventyr! 🎮
          </motion.button>
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
