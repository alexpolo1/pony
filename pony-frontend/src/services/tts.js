import { duckMusic } from '../SceneMusic';

let activeResolve = null;

const setMusicDucking = value => {
  // Some embedded/test hosts provide the audio module without ducking support.
  if (typeof duckMusic === 'function') duckMusic(value);
};

export function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setMusicDucking(false);
  if (activeResolve) {
    activeResolve();
    activeResolve = null;
  }
}

/** Speak child-facing text with the best Danish system voice available. */
export function speakDanish(text, volume = 1, onSpeakingChange) {
  if (!text || volume <= 0 || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return Promise.resolve();
  }
  cancelSpeech();
  return new Promise(resolve => {
    activeResolve = resolve;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'da-DK';
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    utterance.volume = Math.min(1, Math.max(0, volume));
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase() === 'da-dk')
      || voices.find(voice => voice.lang.toLowerCase().startsWith('da'))
      || null;
    const finish = () => {
      setMusicDucking(false);
      onSpeakingChange?.(false);
      if (activeResolve === resolve) activeResolve = null;
      resolve();
    };
    utterance.onstart = () => {
      setMusicDucking(true);
      onSpeakingChange?.(true);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}
