/**
 * Pixel Pony Configurator — design your own pixel-art pony.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SceneMusic from '../SceneMusic';
import VolumeControl from '../components/VolumeControl';
import FloatingBg from '../components/FloatingBg';
import Narrator from '../components/Narrator';
import SpeakButton from '../components/SpeakButton';
import PixelPonySprite from '../components/PixelPonySprite';
import { MANE_STYLES, COLOR_OPTIONS, IDLE_FRAME, IDLE_FRAME_2 } from '../pixelPony/spriteData';
import { loadAppearance, saveAppearance } from '../services/ponyAppearance';

export default function PixelPonyConfiguratorPage({ volume, setVolume, onNavigate }) {
  const [appearance, setAppearance] = useState(loadAppearance);
  const [bobFrame, setBobFrame] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setBobFrame(b => !b), 500);
    return () => window.clearInterval(id);
  }, []);

  const set = (key, value) => {
    setSaved(false);
    setAppearance(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveAppearance(appearance);
    setSaved(true);
  };

  const narration = 'Design din egen pixel pony. Vælg manke, farver, horn og vinger. Tryk på gem-knappen når du er glad for din pony.';

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
      <Narrator text={narration} volume={volume} narrationKey="pixel-configurator" />
      <div className="top-bar">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
      <FloatingBg />
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="title">
        Pixel Pony 🎨
      </motion.h1>
      <SpeakButton text={narration} volume={volume} label="Læs siden højt" />

      <div className="pixel-configurator-preview">
        <PixelPonySprite
          {...appearance}
          frame={bobFrame ? IDLE_FRAME_2 : IDLE_FRAME}
          scale={8}
        />
      </div>

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
              <PixelPonySprite
                {...appearance}
                mane={m.id}
                hasHorn={false}
                hasWings={false}
                frame={IDLE_FRAME}
                scale={2}
              />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pixel-configurator-section">
        <h2>Krop-farve</h2>
        <div className="pixel-color-row">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`pixel-color-swatch ${appearance.bodyColor === c.id ? 'is-selected' : ''}`}
              style={{ filter: c.filter, backgroundColor: '#b5533f' }}
              onClick={() => set('bodyColor', c.id)}
              aria-label={`Kropsfarve: ${c.label}`}
              aria-pressed={appearance.bodyColor === c.id}
              title={c.label}
            />
          ))}
        </div>
      </section>

      <section className="pixel-configurator-section">
        <h2>Manke-farve</h2>
        <div className="pixel-color-row">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`pixel-color-swatch ${appearance.maneColor === c.id ? 'is-selected' : ''}`}
              style={{ filter: c.filter, backgroundColor: '#f3a13f' }}
              onClick={() => set('maneColor', c.id)}
              aria-label={`Mankefarve: ${c.label}`}
              aria-pressed={appearance.maneColor === c.id}
              title={c.label}
            />
          ))}
        </div>
      </section>

      <section className="pixel-configurator-section">
        <h2>Ekstra</h2>
        <div className="pixel-toggle-row">
          <button
            type="button"
            className={`pixel-toggle ${appearance.hasHorn ? 'is-selected' : ''}`}
            onClick={() => set('hasHorn', !appearance.hasHorn)}
            aria-pressed={appearance.hasHorn}
          >
            🦄 Horn
          </button>
          <button
            type="button"
            className={`pixel-toggle ${appearance.hasWings ? 'is-selected' : ''}`}
            onClick={() => set('hasWings', !appearance.hasWings)}
            aria-pressed={appearance.hasWings}
          >
            🪽 Vinger
          </button>
        </div>
      </section>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="btn-start"
        onClick={handleSave}
        aria-label="Gem min pony"
      >
        {saved ? '✅ Gemt!' : '💾 Gem min pony'}
      </motion.button>

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
