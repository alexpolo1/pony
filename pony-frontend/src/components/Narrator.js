import { useEffect } from 'react';
import { cancelSpeech, speakDanish } from '../services/tts';

/** Reads the important content of a screen once in Danish. */
export default function Narrator({ text, volume = 1, narrationKey, enabled = true, delayMs = 0 }) {
  useEffect(() => {
    if (!enabled) return undefined;
    const timeout = window.setTimeout(() => speakDanish(text, volume), delayMs);
    return () => {
      window.clearTimeout(timeout);
      cancelSpeech();
    };
    // narrationKey deliberately controls when a screen is read again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationKey, enabled, delayMs]);
  return null;
}
