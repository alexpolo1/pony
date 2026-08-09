/**
 * Achievement system — deterministic, persistent, localStorage-backed.
 *
 * Tracks wins, losses, total games, and best score.
 * Syncs with backend when game ends.
 */

const STORAGE_KEY = 'pony_stats';

const DEFAULT_STATS = { wins: 0, losses: 0, games: 0, bestScore: 0 };

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ...DEFAULT_STATS };
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

/**
 * Record a completed game.
 * @param {boolean} victory — whether the player won
 * @param {number} score — number of successes
 * @returns {Object} updated stats
 */
export function recordGame(victory, score) {
  const stats = loadStats();
  stats.games += 1;
  if (victory) {
    stats.wins += 1;
  } else {
    stats.losses += 1;
  }
  stats.bestScore = Math.max(stats.bestScore, score || 0);
  saveStats(stats);
  return stats;
}

/**
 * Reset all achievement stats.
 */
export function resetStats() {
  saveStats({ ...DEFAULT_STATS });
}

/**
 * Get current stats.
 * @returns {Object}
 */
export function getStats() {
  return loadStats();
}

/**
 * Compute derived achievement badges.
 * @param {Object} stats
 * @returns {string[]} badge labels
 */
export function computeBadges(stats) {
  const badges = [];
  if (stats.games >= 1) badges.push('🎮 Første spil');
  if (stats.wins >= 1) badges.push('🌟 Første sejr');
  if (stats.games >= 5) badges.push('🎯 5 spil');
  if (stats.wins >= 5) badges.push('⭐ 5 sejre');
  if (stats.bestScore >= 5) badges.push('🏆 Perfekt run');
  if (stats.games >= 10) badges.push('👑 Pony Mester!');
  return badges;
}