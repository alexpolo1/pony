/**
 * Integration tests: Home → Theme Select → Pony Select → Game Scene → Game End → Home.
 */

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = {};
  ['div', 'button', 'p', 'h1', 'h2', 'h3', 'img', 'span'].forEach(tag => {
    motion[tag] = ({ children, ...props }) =>
      React.createElement(tag, { 'data-motion': 'true', ...props }, children);
  });
  return { motion, AnimatePresence: ({ children }) => children };
});

// Mock ReactDice
jest.mock('./dice/ReactDice', () => {
  const React = require('react');
  return React.forwardRef(function ReactDice({ numDice, ...props }, ref) {
    if (ref) ref.current = { rollAll: jest.fn() };
    return React.createElement('div', { 'data-testid': 'dice', 'data-dice-count': numDice || 2, ...props });
  });
});

// Mock SceneMusic
jest.mock('./SceneMusic', () => {
  const SceneMusic = function SceneMusic() { return null; };
  return {
    __esModule: true,
    default: SceneMusic,
    playClick: jest.fn(),
    playRoll: jest.fn(),
    playSuccess: jest.fn(),
    playFail: jest.fn(),
    playSelect: jest.fn(),
    playVictory: jest.fn(),
    playDefeat: jest.fn(),
    setMasterVolume: jest.fn(),
    resumeAudioContext: jest.fn(),
  };
});

// Mock TTS
jest.mock('./services/tts', () => ({
  speakDanish: jest.fn(),
  cancelSpeech: jest.fn(),
  prepareDanishSpeech: jest.fn(),
  NARRATION_STATUS_EVENT: 'pony-narration-status',
}));

// Mock Narrator
jest.mock('./components/Narrator', () => function Narrator() { return null; });

// Mock SpeakButton
jest.mock('./components/SpeakButton', () => function SpeakButton() { return null; });

// Mock VoiceButton
jest.mock('./components/VoiceButton', () => function VoiceButton() { return null; });

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as SFX from './SceneMusic';
import * as TTS from './services/tts';

// --- Helpers ---

const mockLocalStorage = (overrides) => {
  const store = {
    pony_tutorial_seen: 'true',
    ...(overrides || {}),
  };
  const storeStr = JSON.stringify(store);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k) => {
        const parsed = JSON.parse(storeStr);
        return parsed[k] || null;
      },
      setItem: (k, v) => {},
      clear: () => {},
    },
    writable: true,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage();
});

async function dismissSoundPrompt() {
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Aktivér lyd' })).not.toBeNull();
  }, { timeout: 2000 });
  await userEvent.click(screen.getByRole('button', { name: 'Aktivér lyd' }));
  await new Promise(r => setTimeout(r, 100));
}

function mockContentFetch(contentData) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(contentData),
    })
  );
}

function mockMultiFetch(responses) {
  let idx = 0;
  global.fetch = jest.fn(() => {
    const r = responses[idx++];
    return Promise.resolve({
      ok: r.ok !== false,
      status: r.status || 200,
      json: () => Promise.resolve(r.body || {}),
    });
  });
}

const findByText = (t) => screen.getByText(t);

// Clicking a pony type on the configurator's first step only selects the
// type and advances to the body-color step. How many "Næste" clicks it
// takes to reach the end depends on the type — a Jordpony has neither
// horn nor wings steps, so its wizard is shorter than an Alicorn's — so
// just click "Næste" until "Start eventyr" appears instead of a fixed count.
async function pickPonyAndStartGame(name = 'Jordpony') {
  await userEvent.click(screen.getByText(name));
  while (screen.queryByRole('button', { name: 'Næste trin' })) {
    await userEvent.click(screen.getByRole('button', { name: 'Næste trin' }));
  }
  await userEvent.click(screen.getByRole('button', { name: 'Start eventyr' }));
}

const CONTENT = {
  ponies: [
    { navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' },
    { navn: 'Pegasus', emoji: '🦅', bonus: 'Flyver 🪽', tekst: 'x', img: 'pegasus.png' },
    { navn: 'Enhjørning', emoji: '🦄', bonus: 'Magisk ✨', tekst: 'x', img: 'enhjorning.png' },
    { navn: 'Alicorn', emoji: '👑', bonus: 'Magi 🌟', tekst: 'x', img: 'alicorn.png' },
  ],
  themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
};

const GAME_SCENE = {
  sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
  actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
  ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
};

const CHOICE_SCENE = {
  ...GAME_SCENE,
  sceneNum: 2,
  interaction: {
    type: 'choice',
    prompt: 'Hvordan vil du komme videre?',
    options: [
      { id: 'modig', label: 'Vær modig', emoji: '🦁' },
      { id: 'klog', label: 'Tænk dig om', emoji: '💡' },
      { id: 'ven', label: 'Bed en ven om hjælp', emoji: '🤝' },
      { id: 'magi', label: 'Brug pony-magi', emoji: '✨' },
    ],
  },
};

const VICTORY = {
  victory: true, finished: true, endText: 'Du vandt!', score: '100',
  history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
  ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
};

const DEFEAT = {
  victory: false, mixed: false, finished: true, endText: 'Du tabte...', score: '0',
  history: [{ action: 'Kæmp', dice: [1, 1], result: 'Tab!', success: false }],
  ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
};

// ===== HOME =====
test('renders title and start button', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
  expect(screen.getByText('Tails of Equestria')).toBeInTheDocument();
  expect(findByText('🎮 Start Nyt Spil!')).toBeInTheDocument();
});

test('navigates to theme select when clicking Start', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
});

// ===== THEME SELECT =====
test('renders theme selection page', async () => {
  mockContentFetch({
    ...CONTENT,
    themes: [
      { titel: 'Skyggen Over Equestria', emoji: '🌑', intro: 'A dark shadow...', sceneCount: 5 },
      { titel: 'Havdypens Skat', emoji: '🌊', intro: 'Under the sea...', sceneCount: 7 },
    ],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
});

test('selecting a theme navigates to pony selection', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Skyggen'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(findByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

test('Tilbage from theme goes to home', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Tilbage'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== PONY SELECTION =====
test('renders all 4 pony types', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  expect(screen.getByText('Jordpony')).toBeInTheDocument();
  expect(screen.getByText('Pegasus')).toBeInTheDocument();
  expect(screen.getByText('Enhjørning')).toBeInTheDocument();
  expect(screen.getByText('Alicorn')).toBeInTheDocument();
});

test('calls /api/start when selecting a pony', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  expect(SFX.playSelect).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
});

test('shows error when /api/start fails', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { ok: false, body: { error: 'bad' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByText(/Kunne ikke starte spil/)).toBeInTheDocument());
});

test('Tilbage from pony selection goes to home', async () => {
  mockContentFetch(CONTENT);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  expect(findByText('Vælg din Pony! 🐴')).toBeInTheDocument();
  await userEvent.click(findByText('Tilbage'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== GAME SCENE =====
test('renders scene information', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByText('Eventyr')).toBeInTheDocument());
  expect(screen.getByText('Du møder en drage.')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Jordpony, din pixelpony' })).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Jordpony' })).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: /lytte|oplæsning|fortæller/i })).toBeInTheDocument();
});

test('shows roll button in game', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
});

test('shows four story choices instead of dice in a choice scene', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: CHOICE_SCENE },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByText('Hvordan vil du komme videre?')).toBeInTheDocument());
  const choices = screen.getAllByRole('button', { name: /^Vælg / });
  expect(choices).toHaveLength(4);
  expect(choices[0].closest('.game-controls')).toHaveClass('game-controls-options');
  act(() => window.dispatchEvent(new CustomEvent('pony-narration-status', {
    detail: { status: 'preparing' },
  })));
  choices.forEach(choice => expect(choice).toBeEnabled());
  expect(screen.queryByRole('button', { name: 'Kast terningerne' })).not.toBeInTheDocument();
});

test('keeps the next four choices enabled while the previous result is being narrated', async () => {
  const nextChoiceScene = {
    ...CHOICE_SCENE,
    sceneNum: 3,
    history: [{
      action: 'Vælg en vej', selection: 'Vær modig', dice: [],
      result: '✅ Succes!', story: 'Du fandt den næste sti.', success: true,
    }],
  };
  mockMultiFetch([
    { body: CONTENT },
    { body: CHOICE_SCENE },
    { body: { ...nextChoiceScene, interactionProgressed: true } },
  ]);
  TTS.speakDanish
    .mockResolvedValueOnce()
    .mockReturnValueOnce(new Promise(() => {}));
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await userEvent.click(await screen.findByRole('button', { name: 'Vælg mulighed 1: Vær modig' }));

  await waitFor(() => expect(screen.getByText('Du fandt den næste sti.')).toBeInTheDocument());
  screen.getAllByRole('button', { name: /^Vælg / }).forEach(choice => expect(choice).toBeEnabled());
});

test('keeps the next dice enabled while the previous choice result is being narrated', async () => {
  const nextDiceScene = {
    ...GAME_SCENE,
    sceneNum: 3,
    interaction: { type: 'dice', options: [] },
    history: [{
      action: 'Vælg en vej', selection: 'Vær modig', dice: [],
      result: '✅ Succes!', story: 'Du fandt den næste sti.', success: true,
    }],
  };
  mockMultiFetch([
    { body: CONTENT },
    { body: CHOICE_SCENE },
    { body: { ...nextDiceScene, interactionProgressed: true } },
  ]);
  TTS.speakDanish
    .mockResolvedValueOnce()
    .mockReturnValueOnce(new Promise(() => {}));
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await userEvent.click(await screen.findByRole('button', { name: 'Vælg mulighed 1: Vær modig' }));

  await waitFor(() => expect(screen.getByText('Du fandt den næste sti.')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeEnabled();
});

test('auto-introduces the next scene and keeps playing when result narration fails', async () => {
  const nextDiceScene = {
    ...GAME_SCENE,
    sceneNum: 3,
    sceneText: 'Nu åbner den næste pony-sti sig.',
    actionText: 'Følg den glitrende sti',
    interaction: { type: 'dice', options: [] },
    history: [{
      action: 'Vælg en vej', selection: 'Vær modig', dice: [],
      result: '✅ Succes!', story: 'Du klarede valget.', success: true,
    }],
  };
  mockMultiFetch([
    { body: CONTENT },
    { body: CHOICE_SCENE },
    { body: { ...nextDiceScene, interactionProgressed: true } },
  ]);
  TTS.speakDanish
    .mockResolvedValueOnce()
    .mockRejectedValueOnce(new Error('manglende ended-signal'))
    .mockResolvedValueOnce();
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await userEvent.click(await screen.findByRole('button', { name: 'Vælg mulighed 1: Vær modig' }));

  await waitFor(() => expect(TTS.speakDanish).toHaveBeenCalledWith(
    expect.stringContaining('Nu fortsætter eventyret. Nu åbner den næste pony-sti sig.'),
    expect.any(Number),
  ));
  expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeEnabled();
});

test('calls /api/kast when rolling dice', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: { ...GAME_SCENE, sceneNum: 2, sceneText: 'Scene 2' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  expect(SFX.playRoll).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
});

// ===== GAME END =====
test('shows victory message', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: VICTORY },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  expect(SFX.playVictory).toHaveBeenCalled();
});

test('shows defeat message for non-victory', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: DEFEAT },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  await waitFor(() => expect(screen.getByText('🌈 FLOT EVENTYR! 🌈')).toBeInTheDocument());
});

test('Spil Igen navigates to pony selection', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: VICTORY },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 Spil Igen!'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

test('Forside button navigates to home', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: VICTORY },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== FULL FLOW =====
test('home -> theme -> pony -> game -> end -> home', async () => {
  mockMultiFetch([
    { body: CONTENT },
    { body: GAME_SCENE },
    { body: VICTORY },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(screen.getByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Skyggen'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
  await pickPonyAndStartGame();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kast terningerne' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Kast terningerne' }));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});
