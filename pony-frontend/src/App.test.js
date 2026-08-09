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
    if (ref) {
      ref.current = { rollAll: jest.fn() };
    }
    return React.createElement('div', { 'data-testid': 'dice', 'data-dice-count': numDice || 2, ...props });
  });
});

// Mock SceneMusic - exports both default and named
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
    setMasterVolume: jest.fn(),
    resumeAudioContext: jest.fn(),
  };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as SFX from './SceneMusic';

// Mock fetch
const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
    })
  );
};

// Mock localStorage - with tutorial already seen so it doesn't block tests
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
      setItem: (k, v) => {
        // mutate the string representation
        const parsed = JSON.parse(storeStr);
        parsed[k] = v;
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: (kk) => JSON.parse(JSON.stringify(parsed))[kk] || null,
            setItem: (kk, vv) => {},
            clear: () => {},
          },
          writable: true,
        });
      },
      clear: () => {},
    },
    writable: true,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage();
});

// Helper - dismiss sound prompt to get to actual game
async function dismissSoundPrompt() {
  // Wait for the sound prompt to appear
  await waitFor(() => {
    const btn = screen.queryByText('Aktiver lyd') || screen.queryByText('Skip');
    expect(btn).not.toBeNull();
  }, { timeout: 2000 });

  // Click "Aktiver lyd" if present, otherwise "Skip"
  const enableBtn = screen.queryByText('Aktiver lyd');
  if (enableBtn) {
    await userEvent.click(enableBtn);
  } else {
    await userEvent.click(screen.getByText('Skip'));
  }

  // Wait for animations to settle
  await new Promise(r => setTimeout(r, 100));
}

// Helper
const findByText = (t) => screen.getByText(t);
const queryByText = (t) => screen.queryByText(t);
const findAllByText = (t) => screen.getAllByText(t);

// ===== HOME =====
test('renders title and start button', async () => {
  render(<App />);
  await dismissSoundPrompt();
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
  expect(screen.getByText('Tails of Equestria')).toBeInTheDocument();
  expect(findByText('🎮 Start Nyt Spil!')).toBeInTheDocument();
});

test('navigates to start page when clicking Start', async () => {
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

// ===== PONY SELECTION =====
test('renders all 4 pony types', async () => {
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(screen.getByText('Jordpony')).toBeInTheDocument();
  expect(screen.getByText('Pegasus')).toBeInTheDocument();
  expect(screen.getByText('Enhjørning')).toBeInTheDocument();
  expect(screen.getByText('Alicorn')).toBeInTheDocument();
});

test('calls /api/start when selecting a pony', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr i Equestria', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp mod dragen', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  expect(SFX.playSelect).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost/api/start',
    expect.objectContaining({ method: 'POST' })
  ));
});

test('shows error when /api/start fails', async () => {
  mockFetch(null, false);
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText(/Kunne ikke starte spil/)).toBeInTheDocument());
});

test('handles network error (throws)', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network')));
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText(/Kunne ikke starte spil/)).toBeInTheDocument());
});

test('Tilbage button navigates to home', async () => {
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Tilbage'));
  expect(SFX.playClick).toHaveBeenCalled();
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

// ===== GAME SCENE =====
test('renders scene information', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('Eventyr')).toBeInTheDocument());
  expect(screen.getByText('Du møder en drage.')).toBeInTheDocument();
});

test('shows roll button', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
});

test('calls /api/kast when rolling dice', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  expect(SFX.playRoll).toHaveBeenCalled();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost/api/kast',
    expect.objectContaining({ method: 'POST' })
  ));
});

test('shows history items in feed', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
    history: [{ action: 'Kæmp', dice: [3, 4], result: 'Du vandt!', success: true, story: 'Bravo!' }],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('Du vandt!')).toBeInTheDocument());
});

test('shows pony info in game', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(findAllByText('Jordpony').length).toBeGreaterThanOrEqual(1));
});

// ===== GAME END =====
test('shows victory message', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  expect(SFX.playVictory).toHaveBeenCalled();
});

test('shows history on game end', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('📖 Hvad skete der? 📖')).toBeInTheDocument());
});

test('has Spil Igen button', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🎲 Spil Igen!')).toBeInTheDocument());
});

test('Spil Igen navigates to start page', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🎲 Spil Igen!')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 Spil Igen!'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
});

test('Forside button navigates to home', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🏠 Forside')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});

test('shows defeat message for non-victory', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: false, mixed: false, finished: true, endText: 'Du tabte...', score: '0',
    history: [{ action: 'Kæmp', dice: [1, 1], result: 'Tab!', success: false }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('💪 Prøv igen! 💪')).toBeInTheDocument());
});

test('shows mixed result message', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: false, mixed: true, finished: true, endText: 'Blandet...', score: '50',
    history: [{ action: 'Kæmp', dice: [3, 4], result: 'Blandet', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('⚖️ Blant resultat! ⚖️')).toBeInTheDocument());
});

// ===== ERROR =====
test('shows error screen with Tilbage button', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network')));
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText(/Kunne ikke starte spil/)).toBeInTheDocument());
  expect(screen.getByText('Tilbage')).toBeInTheDocument();
});

// ===== LOADING =====
test('shows loading spinner while waiting for API', async () => {
  let resolveFetch;
  global.fetch = jest.fn(() => new Promise(r => { resolveFetch = r; }));
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  expect(screen.getByText('Indlæser...')).toBeInTheDocument();
  resolveFetch({ ok: true, json: () => Promise.resolve({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Test', actionText: 'Test',
    difficulty: '⭐', ponyName: 'Jordpony', ponyType: 'Jordpony',
    ponyImg: '/static/images/jordpony.png', history: [],
  })});
});

// ===== DICE COMPONENT =====
test('renders dice in game end history', async () => {
  mockFetch({
    sceneNum: 1, tema: 'Eventyr', sceneText: 'Du møder en drage.',
    actionText: 'Kæmp', difficulty: '⭐⭐', ponyName: 'Jordpony',
    ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png', history: [],
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  mockFetch({
    victory: true, finished: true, endText: 'Du vandt!', score: '100',
    history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
    ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
  });
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByTestId('dice')).toBeInTheDocument());
});

// ===== FULL FLOW =====
test('home -> start -> game -> end -> home', async () => {
  let callCount = 0;
  global.fetch = jest.fn(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        sceneNum: 1, tema: 'Eventyr', sceneText: 'Test', actionText: 'Test',
        difficulty: '⭐', ponyName: 'Jordpony', ponyType: 'Jordpony',
        ponyImg: '/static/images/jordpony.png', history: [],
      })});
    } else {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        victory: true, finished: true, endText: 'Sejr!', score: '100',
        history: [{ action: 'Kæmp', dice: [6, 6], result: 'Sejr!', success: true }],
        ponyName: 'Jordpony', ponyType: 'Jordpony', ponyImg: '/static/images/jordpony.png',
      })});
    }
  });
  render(<App />);
  await dismissSoundPrompt();
  await userEvent.click(findByText('🎮 Start Nyt Spil!'));
  expect(screen.getByText('Vælg din Pony! 🐴')).toBeInTheDocument();
  await userEvent.click(screen.getByText('Jordpony'));
  await waitFor(() => expect(screen.getByText('🎲 KAST TERNINGERNE! 🎲')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🎲 KAST TERNINGERNE! 🎲'));
  await waitFor(() => expect(screen.getByText('🌟 SEJR! 🌟')).toBeInTheDocument());
  await userEvent.click(screen.getByText('🏠 Forside'));
  expect(screen.getByText('My Little Pony')).toBeInTheDocument();
});
