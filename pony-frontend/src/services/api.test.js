/**
 * Tests for the API service layer.
 */

import * as api from '../services/api';

function mockFetch(responses) {
  let callIndex = 0;
  global.fetch = jest.fn(() => {
    const r = responses[callIndex++];
    return Promise.resolve({
      ok: r.ok !== false,
      status: r.status || 200,
      json: () => Promise.resolve(r.body || {}),
    });
  });
}

describe('api.startGame', () => {
  it('sends POST to /api/start with pony type and tema', async () => {
    mockFetch([{ body: { game_id: 'abc123' } }]);
    await api.startGame(2, 1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/start'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 2, tema: 1 }),
      }),
    );
  });

  it('defaults tema to undefined when omitted', async () => {
    mockFetch([{ body: { game_id: 'x' } }]);
    await api.startGame(0);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/start'),
      expect.objectContaining({
        body: JSON.stringify({ type: 0 }),
      }),
    );
  });

  it('throws on non-200', async () => {
    mockFetch([{ ok: false, status: 400, body: { error: 'bad' } }]);
    await expect(api.startGame(0)).rejects.toThrow();
  });
});

describe('api.rollDice', () => {
  it('sends POST to /api/kast', async () => {
    mockFetch([{ body: { scene: 1 } }]);
    await api.rollDice();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kast'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('api.loadContent', () => {
  it('fetches GET /api/content', async () => {
    mockFetch([{ body: { ponies: [], themes: [] } }]);
    const data = await api.loadContent();
    const calls = global.fetch.mock.calls;
    expect(calls[0][0]).toMatch(/\/api\/content/);
    expect(data).toEqual({ ponies: [], themes: [] });
  });
});

describe('api.getScene', () => {
  it('fetches GET /api/scene', async () => {
    mockFetch([{ body: { scene: 0 } }]);
    await api.getScene();
    const calls = global.fetch.mock.calls;
    expect(calls[0][0]).toMatch(/\/api\/scene/);
  });
});

describe('api.chooseInteraction', () => {
  it('sends only the selected allowlisted option id', async () => {
    mockFetch([{ body: { interactionProgressed: true } }]);
    await api.chooseInteraction('grøn');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/interact'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ selection: 'grøn' }) }),
    );
  });
});

describe('api.resetGame', () => {
  it('sends POST to /api/reset', async () => {
    mockFetch([{ body: { ok: true } }]);
    await api.resetGame();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reset'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('api.sendVoiceAnswer', () => {
  it('uploads audio and scene context as multipart form data', async () => {
    mockFetch([{ body: { ok: true, data: { matched: true } } }]);
    const blob = new Blob(['voice'], { type: 'audio/webm' });
    const result = await api.sendVoiceAnswer('game 1', 0, 'ready-1', blob);
    expect(result).toEqual({ matched: true });
    expect(global.fetch.mock.calls[0][0]).toContain('/api/v1/games/game%201/voice');
    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.headers).toBeUndefined();
  });
});
