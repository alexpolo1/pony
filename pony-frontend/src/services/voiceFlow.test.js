import { waitForSpokenReply } from './voiceFlow';

test('fortsætter efter timeout hvis Hermes-lyden aldrig melder færdig', async () => {
  jest.useFakeTimers();
  let continued = false;
  const waiting = waitForSpokenReply(() => new Promise(() => {}), 'Et sjovt svar', 12000)
    .then(() => { continued = true; });

  await Promise.resolve();
  jest.advanceTimersByTime(11999);
  await Promise.resolve();
  expect(continued).toBe(false);
  jest.advanceTimersByTime(1);
  await waiting;
  expect(continued).toBe(true);
  jest.useRealTimers();
});

test('fortsætter også hvis oplæsningen fejler', async () => {
  await expect(waitForSpokenReply(
    () => Promise.reject(new Error('lydfejl')), 'Svar', 12000,
  )).resolves.toBeUndefined();
});
