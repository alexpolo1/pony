import { duckMusic, playNarrationBlob, stopNarration } from '../SceneMusic';

const API = window.location.origin.replace('3001', '8082');
let activeResolve = null;
let activeAudio = null;
let activeAudioUrl = null;
let speechGeneration = 0;
const speechCache = new Map();
export const NARRATION_STATUS_EVENT = 'pony-narration-status';

const DANISH_FEMALE_NAMES = /christel|helle|sara|signe|female|kvinde|woman/i;
const DANISH_MALE_NAMES = /jeppe|mads|male|mand|man/i;

function selectDanishVoice(voices) {
  return voices
    .filter(voice => (voice.lang || '').toLowerCase().startsWith('da'))
    .sort((a, b) => {
      const score = voice => {
        const language = (voice.lang || '').toLowerCase();
        const name = voice.name || '';
        return (language === 'da-dk' ? 100 : 80)
          + (DANISH_FEMALE_NAMES.test(name) ? 30 : 0)
          + (/natural|neural/i.test(name) ? 10 : 0)
          - (DANISH_MALE_NAMES.test(name) ? 30 : 0);
      };
      return score(b) - score(a);
    })[0] || null;
}

function loadVoices() {
  const synthesis = window.speechSynthesis;
  const available = synthesis.getVoices();
  if (available.length) return Promise.resolve(available);

  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      synthesis.removeEventListener?.('voiceschanged', finish);
      window.clearTimeout(timeout);
      resolve(synthesis.getVoices());
    };
    const timeout = window.setTimeout(finish, 1500);
    synthesis.addEventListener?.('voiceschanged', finish, { once: true });
  });
}

const setMusicDucking = value => {
  // Some embedded/test hosts provide the audio module without ducking support.
  if (typeof duckMusic === 'function') duckMusic(value);
};

const setNarrationStatus = (status, onSpeakingChange) => {
  onSpeakingChange?.(status);
  window.dispatchEvent(new CustomEvent(NARRATION_STATUS_EVENT, { detail: { status } }));
};

function requestSpeechBlob(text) {
  if (speechCache.has(text)) return speechCache.get(text);
  if (speechCache.size >= 40) speechCache.delete(speechCache.keys().next().value);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = window.setTimeout(() => controller?.abort(), 6000);
  const pending = fetch(`${API}/api/tts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: controller?.signal,
  }).then(response => {
    if (!response.ok) throw new Error('TTS serverfejl');
    return response.blob();
  }).catch(error => {
    speechCache.delete(text);
    throw error;
  }).finally(() => {
    window.clearTimeout(timeout);
  });
  speechCache.set(text, pending);
  return pending;
}

export function prepareDanishSpeech(text) {
  if (!text || process.env.NODE_ENV === 'test' || !window.fetch) return Promise.resolve();
  return requestSpeechBlob(text).catch(() => undefined);
}

export function cancelSpeech() {
  speechGeneration += 1;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (typeof stopNarration === 'function') stopNarration();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activeAudioUrl) {
    window.URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
  setMusicDucking(false);
  setNarrationStatus('idle');
  if (activeResolve) {
    activeResolve();
    activeResolve = null;
  }
}

function speakWithBrowser(text, volume, onSpeakingChange, generation) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return Promise.resolve();
  setNarrationStatus('preparing', onSpeakingChange);
  return new Promise(resolve => {
    activeResolve = resolve;
    loadVoices().then(voices => {
      if (generation !== speechGeneration) {
        if (activeResolve === resolve) activeResolve = null;
        resolve();
        return;
      }
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'da-DK';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = Math.min(1, Math.max(0, volume));
      utterance.voice = selectDanishVoice(voices);
      const finish = () => {
        setMusicDucking(false);
        setNarrationStatus('idle', onSpeakingChange);
        if (activeResolve === resolve) activeResolve = null;
        resolve();
      };
      utterance.onstart = () => {
        setMusicDucking(true);
        setNarrationStatus('speaking', onSpeakingChange);
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  });
}

function speakWithServer(text, volume, onSpeakingChange, generation) {
  setNarrationStatus('preparing', onSpeakingChange);
  return new Promise((resolve, reject) => {
    activeResolve = resolve;
    const fail = () => {
      setMusicDucking(false);
      setNarrationStatus('idle', onSpeakingChange);
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.src = '';
        activeAudio = null;
      }
      if (activeAudioUrl) {
        window.URL.revokeObjectURL(activeAudioUrl);
        activeAudioUrl = null;
      }
      if (activeResolve === resolve) activeResolve = null;
      reject(new Error('Serveroplæsning fejlede'));
    };
    requestSpeechBlob(text).then(blob => {
      if (generation !== speechGeneration) {
        if (activeResolve === resolve) activeResolve = null;
        resolve();
        return;
      }
      const finish = () => {
        setMusicDucking(false);
        setNarrationStatus('idle', onSpeakingChange);
        if (activeAudio === audio) activeAudio = null;
        if (activeAudioUrl) {
          window.URL.revokeObjectURL(activeAudioUrl);
          activeAudioUrl = null;
        }
        if (activeResolve === resolve) activeResolve = null;
        resolve();
      };
      const onStart = () => {
        setMusicDucking(true);
        setNarrationStatus('speaking', onSpeakingChange);
      };
      if (typeof playNarrationBlob === 'function') {
        playNarrationBlob(blob, volume, onStart, finish).catch(fail);
        return;
      }
      activeAudioUrl = window.URL.createObjectURL(blob);
      const audio = new window.Audio(activeAudioUrl);
      activeAudio = audio;
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.onplay = () => {
        onStart();
      };
      audio.onended = finish;
      audio.onerror = fail;
      audio.play().catch(fail);
    }).catch(fail);
  });
}

/** Speak with the fixed Danish female server voice; use a system voice if unavailable. */
export function speakDanish(text, volume = 1, onSpeakingChange) {
  if (!text || volume <= 0) return Promise.resolve();
  cancelSpeech();
  const generation = speechGeneration;
  if (process.env.NODE_ENV !== 'test' && window.fetch && window.Audio && window.URL?.createObjectURL) {
    return speakWithServer(text, volume, onSpeakingChange, generation).catch(() => {
      if (generation !== speechGeneration) return undefined;
      return speakWithBrowser(text, volume, onSpeakingChange, generation);
    });
  }
  return speakWithBrowser(text, volume, onSpeakingChange, generation);
}
