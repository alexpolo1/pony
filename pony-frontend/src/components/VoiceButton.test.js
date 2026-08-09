import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import VoiceButton from './VoiceButton';

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: ({ children, animate, transition, ...props }) => (
        <button {...props}>{children}</button>
      ),
    },
  };
});

test('viser altid mikrofonknappen og forklarer fallback uden mikrofon-API', () => {
  const originalMediaDevices = navigator.mediaDevices;
  const originalMediaRecorder = window.MediaRecorder;
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
  window.MediaRecorder = undefined;

  render(<VoiceButton enabled onAnswer={jest.fn()} />);

  const microphone = screen.getByRole('button', { name: 'Svar med stemmen' });
  expect(microphone).toHaveTextContent('🎤');
  fireEvent.click(microphone);
  expect(screen.getByLabelText('Mikrofonen virker ikke lige nu. Brug knappen nedenunder.')).toBeInTheDocument();
  expect(screen.queryByText('Mikrofonen virker ikke lige nu. Brug knappen nedenunder.')).not.toBeInTheDocument();
  expect(screen.getByText('⚠️')).toBeInTheDocument();

  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMediaDevices });
  window.MediaRecorder = originalMediaRecorder;
});

test('stopper automatisk stemmeoptagelsen efter fem sekunder', async () => {
  jest.useFakeTimers();
  const stopTrack = jest.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] })) },
  });
  const recorders = [];
  window.MediaRecorder = class FakeMediaRecorder {
    static isTypeSupported() { return true; }
    constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.onstop?.(); }
  };

  render(<VoiceButton enabled onAnswer={jest.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Svar med stemmen' })); });
  expect(recorders[0].state).toBe('recording');
  expect(screen.getByRole('progressbar', { name: 'Mikrofonen lytter i højst fem sekunder' })).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(4999));
  expect(recorders[0].state).toBe('recording');
  act(() => jest.advanceTimersByTime(1));
  expect(recorders[0].state).toBe('inactive');
  expect(stopTrack).toHaveBeenCalled();
  jest.useRealTimers();
});

test('viser Whisper til Hermes-animation mens stemmesvaret behandles', async () => {
  const stopTrack = jest.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] })) },
  });
  window.MediaRecorder = class FakeMediaRecorder {
    static isTypeSupported() { return true; }
    constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['pony'], { type: 'audio/webm' }) });
      this.onstop?.();
    }
  };
  const pendingAnswer = new Promise(() => {});

  render(<VoiceButton enabled onAnswer={() => pendingAnswer} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Svar med stemmen' })); });
  fireEvent.click(screen.getByRole('button', { name: 'Stop optagelse' }));

  expect(await screen.findByRole('progressbar', {
    name: 'Whisper lytter og sender beskeden til Hermes',
  })).toBeInTheDocument();
  expect(screen.getByText('Whisper')).toBeInTheDocument();
  expect(screen.getByText('Hermes')).toBeInTheDocument();
});
