import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PixelPonyConfiguratorPage from './PixelPonyConfiguratorPage';

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = {};
  ['div', 'button', 'h1', 'h2', 'h3', 'p', 'span'].forEach(tag => {
    motion[tag] = ({ children, ...props }) =>
      React.createElement(tag, { 'data-motion': 'true', ...props }, children);
  });
  return { motion, AnimatePresence: ({ children }) => children };
});

jest.mock('../SceneMusic', () => function SceneMusic() { return null; });
jest.mock('../services/tts', () => ({ speakDanish: jest.fn(), cancelSpeech: jest.fn() }));

// Order matches spriteData.PONY_TYPES: jordpony (neither), pegasus (wings
// only), enhjorning (horn only), alicorn (both).
const PONIES = [
  { navn: 'Jordpony', emoji: '🐴', bonus: 'Stærk 💪' },
  { navn: 'Pegasus', emoji: '🦅', bonus: 'Flyver 🪽' },
  { navn: 'Enhjørning', emoji: '🦄', bonus: 'Magisk horn ✨' },
  { navn: 'Alicorn', emoji: '👑', bonus: 'Magi + vinger 🌟' },
];

beforeEach(() => {
  window.localStorage.clear();
});

function renderWizard(onSelectType = jest.fn()) {
  const onNavigate = jest.fn();
  render(
    <PixelPonyConfiguratorPage
      ponies={PONIES}
      onSelectType={onSelectType}
      volume={0.5}
      setVolume={() => {}}
      onNavigate={onNavigate}
    />
  );
  return { onNavigate, onSelectType };
}

const next = () => userEvent.click(screen.getByRole('button', { name: 'Næste trin' }));
const pick = (label) => userEvent.click(screen.getByRole('button', { name: label }));

async function clickThroughToEnd() {
  while (screen.queryByRole('button', { name: 'Næste trin' })) {
    await next();
  }
}

test('step 1 shows all four pony types', () => {
  renderWizard();
  expect(screen.getByText('Jordpony')).toBeInTheDocument();
  expect(screen.getByText('Pegasus')).toBeInTheDocument();
  expect(screen.getByText('Enhjørning')).toBeInTheDocument();
  expect(screen.getByText('Alicorn')).toBeInTheDocument();
  expect(screen.getByText('Trin 1 af 5')).toBeInTheDocument();
});

test('picking a pony type advances to the body-color step, not mane', async () => {
  renderWizard();
  await pick('Vælg Pegasus - Flyver 🪽');
  expect(screen.getByText('Trin 2 af 6')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Kropsfarve: Lilla' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Vælg manke: Boglig' })).not.toBeInTheDocument();
});

test('mane list excludes the eye-icon files misfiled as mane styles', () => {
  renderWizard();
  expect(screen.queryByText('Dramatisk')).not.toBeInTheDocument();
  expect(screen.queryByText('Tuf')).not.toBeInTheDocument();
});

test('Jordpony has no horn or wings step — the wizard is 5 steps and ends after tail', async () => {
  const { onSelectType } = renderWizard();
  await pick('Vælg Jordpony - Stærk 💪');
  expect(screen.getByText('Trin 2 af 5')).toBeInTheDocument();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  expect(screen.getByText('Trin 5 af 5')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Næste trin' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start eventyr' })).toBeInTheDocument();
  await pick('Start eventyr');
  const saved = JSON.parse(window.localStorage.getItem('pony_appearance'));
  expect(saved.hasHorn).toBe(false);
  expect(saved.hasWings).toBe(false);
  expect(onSelectType).toHaveBeenCalledWith(0);
});

test('Pegasus gets a wings step but no horn step', async () => {
  renderWizard();
  await pick('Vælg Pegasus - Flyver 🪽');
  expect(screen.getByText('Trin 2 af 6')).toBeInTheDocument();
  await clickThroughToEnd();
  expect(screen.getByText('Vælg vinger 🪽')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg vinge: Foldet' })).toBeInTheDocument();
});

test('Enhjørning gets a horn step but no wings step', async () => {
  renderWizard();
  await pick('Vælg Enhjørning - Magisk horn ✨');
  expect(screen.getByText('Trin 2 af 6')).toBeInTheDocument();
  await clickThroughToEnd();
  expect(screen.getByText('Vælg horn 🦄')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg horn: Spids' })).toBeInTheDocument();
});

test('Alicorn gets both a horn and a wings step', async () => {
  const { onSelectType } = renderWizard();
  await pick('Vælg Alicorn - Magi + vinger 🌟');
  expect(screen.getByText('Trin 2 af 7')).toBeInTheDocument();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  await next(); // tail -> horn
  expect(screen.getByText('Vælg horn 🦄')).toBeInTheDocument();
  await pick('Vælg horn: Snoet');
  await next(); // horn -> wings
  expect(screen.getByText('Vælg vinger 🪽')).toBeInTheDocument();
  await pick('Vælg vinge: Udspredt');
  await pick('Start eventyr');
  const saved = JSON.parse(window.localStorage.getItem('pony_appearance'));
  expect(saved.hasHorn).toBe(true);
  expect(saved.horn).toBe('swirl');
  expect(saved.hasWings).toBe(true);
  expect(saved.wing).toBe('spread');
  expect(onSelectType).toHaveBeenCalledWith(3);
});

test('back on the first step exits to home', async () => {
  const { onNavigate } = renderWizard();
  await pick('Tilbage');
  expect(onNavigate).toHaveBeenCalledWith('home');
});

test('back on a later step returns to the previous step, not home', async () => {
  const { onNavigate } = renderWizard();
  await pick('Vælg Jordpony - Stærk 💪');
  await pick('Tilbage');
  expect(onNavigate).not.toHaveBeenCalled();
  expect(screen.getByText('Trin 1 af 5')).toBeInTheDocument();
});
