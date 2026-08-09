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

async function pickTypeAndAdvanceToExtras() {
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Jordpony - Stærk 💪' }));
  await next(); // body -> mane
  await next(); // mane -> extras
}

test('step 1 shows all four pony types', () => {
  renderWizard();
  expect(screen.getByText('Jordpony')).toBeInTheDocument();
  expect(screen.getByText('Pegasus')).toBeInTheDocument();
  expect(screen.getByText('Enhjørning')).toBeInTheDocument();
  expect(screen.getByText('Alicorn')).toBeInTheDocument();
  expect(screen.getByText('Trin 1 af 4')).toBeInTheDocument();
});

test('picking a pony type advances to the body-color step, not mane', async () => {
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Pegasus - Flyver 🪽' }));
  expect(screen.getByText('Trin 2 af 4')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Kropsfarve: Lilla' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Vælg manke: Boglig' })).not.toBeInTheDocument();
});

test('mane step shows only mane swatches, not the color pickers', async () => {
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Jordpony - Stærk 💪' }));
  await next(); // body -> mane
  expect(screen.getByText('Trin 3 af 4')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg manke: Boglig' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mankefarve: Gul' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Kropsfarve: Lilla' })).not.toBeInTheDocument();
});

test('back on the first step exits to home', async () => {
  const { onNavigate } = renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
  expect(onNavigate).toHaveBeenCalledWith('home');
});

test('back on a later step returns to the previous step, not home', async () => {
  const { onNavigate } = renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Jordpony - Stærk 💪' }));
  await userEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
  expect(onNavigate).not.toHaveBeenCalled();
  expect(screen.getByText('Trin 1 af 4')).toBeInTheDocument();
});

test('walks through body color and mane before starting the game', async () => {
  const { onSelectType } = renderWizard();
  await pickTypeAndAdvanceToExtras();
  expect(screen.getByText('Trin 4 af 4')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Start eventyr' }));
  expect(onSelectType).toHaveBeenCalledWith(0);
});

test('toggling horn and wings flips their pressed state', async () => {
  renderWizard();
  await pickTypeAndAdvanceToExtras();
  const horn = screen.getByRole('button', { name: '🦄 Horn' });
  const wings = screen.getByRole('button', { name: '🪽 Vinger' });
  expect(horn).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(horn);
  expect(horn).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(wings);
  expect(wings).toHaveAttribute('aria-pressed', 'true');
});

test('starting the game saves the appearance to localStorage', async () => {
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Enhjørning - Magisk horn ✨' }));
  await next(); // body -> mane
  await userEvent.click(screen.getByRole('button', { name: 'Vælg manke: Boblende' }));
  await next(); // mane -> extras
  await userEvent.click(screen.getByRole('button', { name: 'Start eventyr' }));
  const saved = JSON.parse(window.localStorage.getItem('pony_appearance'));
  expect(saved.mane).toBe('bubbly');
  expect(saved.ponyType).toBe('enhjorning');
  expect(saved.hasHorn).toBe(true);
});
