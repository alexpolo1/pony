/**
 * Persists the child's pixel pony customization — localStorage-backed.
 */

import { DEFAULT_APPEARANCE } from '../pixelPony/spriteData';

const STORAGE_KEY = 'pony_appearance';

/**
 * Load the saved pony appearance, falling back to the default look.
 * @returns {Object}
 */
export function loadAppearance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_APPEARANCE };
}

/**
 * Save the pony appearance.
 * @param {Object} appearance
 */
export function saveAppearance(appearance) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance)); } catch { /* ignore */ }
}
