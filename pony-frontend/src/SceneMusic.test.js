import React from 'react';
import { render } from '@testing-library/react';
import SceneMusic, { playClick, playRoll, playSuccess, resumeAudioContext } from './SceneMusic';

describe('audio compatibility', () => {
  beforeEach(() => {
    delete window.AudioContext;
    delete window.webkitAudioContext;
  });

  it('keeps the app usable when Web Audio is unavailable', () => {
    expect(() => resumeAudioContext()).not.toThrow();
    expect(() => playClick()).not.toThrow();
    expect(() => playRoll()).not.toThrow();
    expect(() => playSuccess()).not.toThrow();
  });

  it('renders music as a safe no-op without Web Audio', () => {
    expect(() => render(<SceneMusic sceneType="game" />)).not.toThrow();
  });
});
