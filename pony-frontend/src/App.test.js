/**
 * Integration tests for the full App flow.
 *
 * Tests: Home → Theme Select → Pony Select → Game Scene → Game End → Home.
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

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as SFX from './SceneMusic';

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

// Helper - dismiss sound prompt
async function dismissSoundPrompt() {
  await waitFor(() => {
    const btn = screen.queryByText('Aktiver lyd') || screen.queryByText('Skip');
    expect(btn).not.toBeNull();
  }, { timeout: 2000 });
  const enableBtn = screen.queryByText('Aktiver lyd');
  if (enableBtn) {
    await userEvent.click(enableBtn);
  } else {
    await userEvent.click(screen.getByText('Skip'));
  }
  await new Promise(r => setTimeout(r, 100));
}

// Multi-call fetch mock — returns same content data for all calls
function mockContentFetch(contentData) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(contentData),
    })
  );
}

// Multi-call fetch with different responses per call
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

// ===== HOME =====
test('renders title and start button', async () => {
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
  render(<App />);
  await dismissSoundPrompt();
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
  expect(screen.getByText('Tails of Equestria')).toBeInTheDocument();
  expect(findByText('🎮 Start Nyt Spil!')).toBeInTheDocument();
});

test('navigates to theme select when clicking Start', async () => {
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
});

// ===== THEME SELECT =====
test('renders theme selection page', async () => {
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
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
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Skyggen'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(findByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

test('Tilbage from theme goes to home', async () => {
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(findByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Tilbage'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== PONY SELECTION =====
test('renders all 4 pony types', async () => {
  mockContentFetch({
    ponies: [
      { navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' },
      { navn: 'Pegasus', emoji: '🦅', bonus: 'Flyver 🪽', tekst: 'x', img: 'pegasus.png' },
      { navn: 'Enhjørning', emoji: '🦄', bonus: 'Magisk ✨', tekst: 'x', img: 'enhjorning.png' },
      { navn: 'Alicorn', emoji: '👑', bonus: 'Magi 🌟', tekst: 'x', img: 'alicorn.png' },
    ],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
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
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  expect(SFX.playSelect).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
});

test('shows error when /api/start fails', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { ok: false, body: { error: 'bad' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText(/Kunne ikke starte spil/)).toBeInTheDocument());
});

test('Tilbage from pony selection goes to home', async () => {
  mockContentFetch({
    ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }],
    themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }],
  });
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
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('Eventyr')).toBeInTheDocument());
  expect(screen.getByText('Du møder en drage.')).toBeInTheDocument();
});

test('shows roll button in game', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
});

test('calls /api/kast when rolling dice', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { sceneNum: 2, tema: 'Eventyr', sceneText: 'Scene 2', actionText: 'Kæmp', difficulty: '⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  expect(SFX.playRoll).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
});

// ===== GAME END =====
test('shows victory message', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { victory: true, finished: true, endText: 'Du vandt!', score: '100', history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }], ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  expect(SFX.playVictory).toHaveBeenCalled();
});

test('shows defeat message for non-victory', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { victory: false, mixed: false, finished: true, endText: 'Du tabte...', score: '0', history: [{ action: 'Kæmp', dice: [1, 1], result: 'Tab!', success: false }], ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('💪 Prøv igen! 💪')).toBeInTheDocument());
});

test('Spil Igen navigates to pony selection', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { victory: true, finished: true, endText: 'Du vandt!', score: '100', history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }], ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 Spil Igen!'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

test('Forside button navigates to home', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.', actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { victory: true, finished: true, endText: 'Du vandt!', score: '100', history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }], ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(findByText('Skyggen'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== FULL FLOW =====
test('home -> theme -> pony -> game -> end -> home', async () => {
  mockMultiFetch([
    { body: { ponies: [{ navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪', tekst: 'x', img: 'jordpony.png' }], themes: [{ titel: 'Skyggen', emoji: '🌑', intro: 'x', sceneCount: 5 }] } },
    { body: { sceneNum: 1, tema: 'Eventyr', sceneText: 'Test', actionText: 'Test', difficulty: '⭐', ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [] } },
    { body: { victory: true, finished: true, endText: 'Sejr!', score: '100', history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }], ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png' } },
  ]);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(screen.getByText('Vælg et eventyr! 📖')).toBeInTheDocument();
  await userEvent.click(findByText('Skyggen'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});
