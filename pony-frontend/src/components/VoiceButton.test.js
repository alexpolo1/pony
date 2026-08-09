import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
  expect(screen.getByText('Mikrofonen virker ikke lige nu. Brug knappen nedenunder.')).toBeInTheDocument();

  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMediaDevices });
  window.MediaRecorder = originalMediaRecorder;
});
