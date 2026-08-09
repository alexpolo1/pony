/**
 * API service layer — all backend communication.
 *
 * Centralizes fetch calls so pages don't know about URLs or credentials.
 */

const API = window.location.origin.replace('3001', '8082');

/**
 * Fetch and parse JSON, throwing on non-OK.
 */
async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`Server fejl (${resp.status})`);
  }
  return resp.json();
}

/**
 * Start a new game.
 * @param {number} typeIdx - pony type index
 * @param {number} temaIdx - theme index
 * @returns {Promise<Object>} game state JSON
 */
export async function startGame(typeIdx, temaIdx) {
  return apiFetch('/api/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: typeIdx, tema: temaIdx }),
  });
}

/**
 * Roll dice for the current scene.
 * @returns {Promise<Object>} updated game state JSON
 */
export async function rollDice() {
  return apiFetch('/api/kast', { method: 'POST' });
}

/**
 * Get current scene data.
 * @returns {Promise<Object>} scene JSON
 */
export async function getScene() {
  return apiFetch('/api/scene');
}

/**
 * Reset the current game.
 */
export async function resetGame() {
  return apiFetch('/api/reset', { method: 'POST' });
}

/**
 * Load ponies + themes metadata.
 * @returns {Promise<{ponies: any[], themes: any[]}>}
 */
export async function loadContent() {
  try {
    const data = await apiFetch('/api/content');
    return { ponies: data.ponies, themes: data.themes };
  } catch {
    return null;
  }
}

/**
 * Health check.
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
  try {
    const data = await apiFetch('/api/health');
    return !!data.ok;
  } catch {
    return false;
  }
}