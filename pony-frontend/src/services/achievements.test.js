/**
 * Tests for the achievement service.
 *
 * Verifies recordGame, resetStats, getStats, and computeBadges.
 */

import * as achievements from '../services/achievements';

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

describe('achievements.getStats', () => {
  it('returns default stats when nothing stored', () => {
    const stats = achievements.getStats();
    expect(stats).toEqual({ wins: 0, losses: 0, games: 0, bestScore: 0 });
  });

  it('reads existing stats from localStorage', () => {
    localStorage.setItem('pony_stats', JSON.stringify({ wins: 5, losses: 2, games: 7, bestScore: 4 }));
    expect(achievements.getStats()).toEqual({ wins: 5, losses: 2, games: 7, bestScore: 4 });
  });
});

describe('achievements.recordGame', () => {
  it('increments wins on victory', () => {
    const stats = achievements.recordGame(true, 3);
    expect(stats.games).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(0);
    expect(stats.bestScore).toBe(3);
  });

  it('increments losses on defeat', () => {
    const stats = achievements.recordGame(false, 1);
    expect(stats.losses).toBe(1);
    expect(stats.wins).toBe(0);
  });

  it('updates bestScore only if higher', () => {
    achievements.recordGame(true, 5);
    const stats = achievements.recordGame(true, 3);
    expect(stats.bestScore).toBe(5);
    expect(stats.games).toBe(2);
    expect(stats.wins).toBe(2);
  });

  it('persists to localStorage', () => {
    achievements.recordGame(true, 2);
    const stored = JSON.parse(localStorage.getItem('pony_stats'));
    expect(stored.games).toBe(1);
  });
});

describe('achievements.resetStats', () => {
  it('clears all stats', () => {
    achievements.recordGame(true, 10);
    achievements.resetStats();
    expect(achievements.getStats()).toEqual({ wins: 0, losses: 0, games: 0, bestScore: 0 });
  });
});

describe('achievements.computeBadges', () => {
  it('returns first game badge', () => {
    expect(achievements.computeBadges({ games: 1, wins: 0, bestScore: 0 })).toContain('🎮 Første spil');
  });

  it('returns first win badge', () => {
    expect(achievements.computeBadges({ games: 1, wins: 1, bestScore: 0 })).toContain('🌟 Første sejr');
  });

  it('returns 5 games badge', () => {
    expect(achievements.computeBadges({ games: 5, wins: 2, bestScore: 0 })).toContain('🎯 5 spil');
  });

  it('returns 5 wins badge', () => {
    expect(achievements.computeBadges({ games: 5, wins: 5, bestScore: 0 })).toContain('⭐ 5 sejre');
  });

  it('returns perfect run badge', () => {
    expect(achievements.computeBadges({ games: 1, wins: 1, bestScore: 5 })).toContain('🏆 Perfekt run');
  });

  it('returns Pony Mester badge', () => {
    expect(achievements.computeBadges({ games: 10, wins: 5, bestScore: 5 })).toContain('👑 Pony Mester!');
  });
});