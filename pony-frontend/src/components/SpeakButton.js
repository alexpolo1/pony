import React from 'react';
import { speakDanish } from '../services/tts';

/** Icon-only replay control for children who cannot read. */
export default function SpeakButton({ text, volume = 1, label = 'Læs denne del højt', className = '' }) {
  if (!text) return null;
  const handleClick = event => {
    event.preventDefault();
    event.stopPropagation();
    speakDanish(text, volume);
  };
  return (
    <button
      type="button"
      className={`speak-button ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={event => event.stopPropagation()}
      aria-label={label}
      title={label}
    >
      🔊
    </button>
  );
}
