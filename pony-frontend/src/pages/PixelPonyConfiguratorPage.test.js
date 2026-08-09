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

// type -> body -> eyes -> mane -> tail -> horn -> wings
const STEP_COUNT = 7;

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
const pickJordpony = () => userEvent.click(screen.getByRole('button', { name: 'Vælg Jordpony - Stærk 💪' }));

async function pickTypeAndAdvanceToWings() {
  await pickJordpony();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  await next(); // tail -> horn
  await next(); // horn -> wings
}

test('step 1 shows all four pony types', () => {
  renderWizard();
  expect(screen.getByText('Jordpony')).toBeInTheDocument();
  expect(screen.getByText('Pegasus')).toBeInTheDocument();
  expect(screen.getByText('Enhjørning')).toBeInTheDocument();
  expect(screen.getByText('Alicorn')).toBeInTheDocument();
  expect(screen.getByText(`Trin 1 af ${STEP_COUNT}`)).toBeInTheDocument();
});

test('picking a pony type advances to the body-color step, not mane', async () => {
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Vælg Pegasus - Flyver 🪽' }));
  expect(screen.getByText(`Trin 2 af ${STEP_COUNT}`)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Kropsfarve: Lilla' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Vælg manke: Boglig' })).not.toBeInTheDocument();
});

test('mane list excludes the eye-icon files misfiled as mane styles', () => {
  renderWizard();
  expect(screen.queryByText('Dramatisk')).not.toBeInTheDocument();
  expect(screen.queryByText('Fabelagtig')).not.toBeInTheDocument();
  expect(screen.queryByText('Nysgerrig')).not.toBeInTheDocument();
  expect(screen.queryByText('Klog')).not.toBeInTheDocument();
  expect(screen.queryByText('Kæk')).not.toBeInTheDocument();
  expect(screen.queryByText('Praktisk')).not.toBeInTheDocument();
  expect(screen.queryByText('Tuf')).not.toBeInTheDocument();
});

test('mane step shows only mane swatches', async () => {
  renderWizard();
  await pickJordpony();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  expect(screen.getByText(`Trin 4 af ${STEP_COUNT}`)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg manke: Boglig' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Kropsfarve: Lilla' })).not.toBeInTheDocument();
});

test('tail step offers multiple tail shapes with their own color', async () => {
  renderWizard();
  await pickJordpony();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  expect(screen.getByText(`Trin 5 af ${STEP_COUNT}`)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg hale: Lang' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg hale: Kort' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg hale: Krøllet' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Halefarve: Grøn' })).toBeInTheDocument();
});

test('horn step is off by default and hides style/color pickers until toggled on', async () => {
  renderWizard();
  await pickJordpony();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  await next(); // tail -> horn
  expect(screen.getByText(`Trin 6 af ${STEP_COUNT}`)).toBeInTheDocument();
  const toggle = screen.getByRole('button', { name: '🦄 Horn til/fra' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: 'Vælg horn: Spids' })).not.toBeInTheDocument();
  await userEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Vælg horn: Spids' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg horn: Snoet' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg horn: Lille' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hornfarve: Gul' })).toBeInTheDocument();
});

test('wings step is off by default and hides style/color pickers until toggled on', async () => {
  renderWizard();
  await pickTypeAndAdvanceToWings();
  expect(screen.getByText(`Trin 7 af ${STEP_COUNT}`)).toBeInTheDocument();
  const toggle = screen.getByRole('button', { name: '🪽 Vinger til/fra' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: 'Vælg vinge: Foldet' })).not.toBeInTheDocument();
  await userEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Vælg vinge: Foldet' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vælg vinge: Udspredt' })).toBeInTheDocument();
});

test('back on the first step exits to home', async () => {
  const { onNavigate } = renderWizard();
  await userEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
  expect(onNavigate).toHaveBeenCalledWith('home');
});

test('back on a later step returns to the previous step, not home', async () => {
  const { onNavigate } = renderWizard();
  await pickJordpony();
  await userEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
  expect(onNavigate).not.toHaveBeenCalled();
  expect(screen.getByText(`Trin 1 af ${STEP_COUNT}`)).toBeInTheDocument();
});

test('walks through every step before starting the game', async () => {
  const { onSelectType } = renderWizard();
  await pickTypeAndAdvanceToWings();
  await userEvent.click(screen.getByRole('button', { name: 'Start eventyr' }));
  expect(onSelectType).toHaveBeenCalledWith(0);
});

test('starting the game saves the full appearance, including chosen horn/wing styles', async () => {
  renderWizard();
  await pickJordpony();
  await next(); // body -> eyes
  await next(); // eyes -> mane
  await next(); // mane -> tail
  await userEvent.click(screen.getByRole('button', { name: 'Vælg hale: Krøllet' }));
  await next(); // tail -> horn
  await userEvent.click(screen.getByRole('button', { name: '🦄 Horn til/fra' }));
  await userEvent.click(screen.getByRole('button', { name: 'Vælg horn: Snoet' }));
  await next(); // horn -> wings
  await userEvent.click(screen.getByRole('button', { name: '🪽 Vinger til/fra' }));
  await userEvent.click(screen.getByRole('button', { name: 'Vælg vinge: Udspredt' }));
  await userEvent.click(screen.getByRole('button', { name: 'Start eventyr' }));
  const saved = JSON.parse(window.localStorage.getItem('pony_appearance'));
  expect(saved.tail).toBe('curly');
  expect(saved.hasHorn).toBe(true);
  expect(saved.horn).toBe('swirl');
  expect(saved.hasWings).toBe(true);
  expect(saved.wing).toBe('spread');
});
