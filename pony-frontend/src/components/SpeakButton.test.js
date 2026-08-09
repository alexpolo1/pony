import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeakButton from './SpeakButton';
import { speakDanish } from '../services/tts';

jest.mock('../services/tts', () => ({ speakDanish: jest.fn() }));

test('replays only its own text without triggering a parent choice', async () => {
  const choose = jest.fn();
  render(
    <div onClick={choose}>
      <SpeakButton text="Den lilla pony kan bruge magi." volume={0.7} label="Læs om ponyen" />
    </div>
  );
  await userEvent.click(screen.getByRole('button', { name: 'Læs om ponyen' }));
  expect(speakDanish).toHaveBeenCalledWith('Den lilla pony kan bruge magi.', 0.7);
  expect(choose).not.toHaveBeenCalled();
});
