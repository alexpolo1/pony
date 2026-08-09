import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PixelPonyConfiguratorPage from './PixelPonyConfiguratorPage';

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = {};
  ['div', 'button', 'h1', 'h2', 'span'].forEach(tag => {
    motion[tag] = ({ children, ...props }) =>
      React.createElement(tag, { 'data-motion': 'true', ...props }, children);
  });
  return { motion, AnimatePresence: ({ children }) => children };
});

jest.mock('../SceneMusic', () => function SceneMusic() { return null; });
jest.mock('../services/tts', () => ({ speakDanish: jest.fn(), cancelSpeech: jest.fn() }));

beforeEach(() => {
  window.localStorage.clear();
});

test('renders mane options, color swatches, and toggles', () => {
  render(<PixelPonyConfiguratorPage volume={0.5} setVolume={() => {}} onNavigate={() => {}} />);
  expect(screen.getByRole('button', { name: 'Vælg manke: Boglig' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '🦄 Horn' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '🪽 Vinger' })).toBeInTheDocument();
});

test('selecting a mane style marks it as pressed', async () => {
  render(<PixelPonyConfiguratorPage volume={0.5} setVolume={() => {}} onNavigate={() => {}} />);
  const bubbly = screen.getByRole('button', { name: 'Vælg manke: Boblende' });
  expect(bubbly).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(bubbly);
  expect(bubbly).toHaveAttribute('aria-pressed', 'true');
});

test('toggling wings flips its pressed state', async () => {
  render(<PixelPonyConfiguratorPage volume={0.5} setVolume={() => {}} onNavigate={() => {}} />);
  const wings = screen.getByRole('button', { name: '🪽 Vinger' });
  expect(wings).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(wings);
  expect(wings).toHaveAttribute('aria-pressed', 'true');
});

test('saving persists the appearance to localStorage', async () => {
  render(<PixelPonyConfiguratorPage volume={0.5} setVolume={() => {}} onNavigate={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Vælg manke: Boblende' }));
  const saveButton = screen.getByRole('button', { name: 'Gem min pony' });
  await userEvent.click(saveButton);
  const saved = JSON.parse(window.localStorage.getItem('pony_appearance'));
  expect(saved.mane).toBe('bubbly');
  expect(saveButton).toHaveTextContent('✅ Gemt!');
});

test('back button navigates home', async () => {
  const onNavigate = jest.fn();
  render(<PixelPonyConfiguratorPage volume={0.5} setVolume={() => {}} onNavigate={onNavigate} />);
  await userEvent.click(screen.getByRole('button', { name: 'Tilbage til forsiden' }));
  expect(onNavigate).toHaveBeenCalledWith('home');
});
