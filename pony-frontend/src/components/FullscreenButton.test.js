import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FullscreenButton from './FullscreenButton';

afterEach(() => {
  document.documentElement.classList.remove('tablet-focus-mode');
  delete document.documentElement.requestFullscreen;
});

test('åbner browserens fullscreen fra tabletknappen', async () => {
  document.documentElement.requestFullscreen = jest.fn(() => Promise.resolve());
  render(<FullscreenButton />);
  fireEvent.click(screen.getByRole('button', { name: 'Åbn fuld skærm' }));
  await waitFor(() => expect(document.documentElement.requestFullscreen).toHaveBeenCalled());
  await waitFor(() => expect(
    screen.getByRole('button', { name: 'Luk fuld skærm' }),
  ).toHaveAttribute('aria-pressed', 'true'));
});

test('bruger en fokusvisning når browseren mangler Fullscreen API', () => {
  render(<FullscreenButton />);
  fireEvent.click(screen.getByRole('button', { name: 'Åbn fuld skærm' }));
  expect(document.documentElement).toHaveClass('tablet-focus-mode');
  fireEvent.click(screen.getByRole('button', { name: 'Luk fuld skærm' }));
  expect(document.documentElement).not.toHaveClass('tablet-focus-mode');
});
