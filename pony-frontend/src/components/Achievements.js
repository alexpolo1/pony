import React from 'react';

export default function Achievements({ stats }) {
  return (
    <div className="achievements">
      <h3>🏆 Statistikk</h3>
      <div className="achievement-grid">
        <div className="achievement-card">
          <span className="achievement-emoji">🎮</span>
          <span className="achievement-value">{stats.games}</span>
          <span className="achievement-label">Spil</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">🌟</span>
          <span className="achievement-value">{stats.wins}</span>
          <span className="achievement-label">Sejre</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">💪</span>
          <span className="achievement-value">{stats.losses}</span>
          <span className="achievement-label">Nederlag</span>
        </div>
        <div className="achievement-card">
          <span className="achievement-emoji">🏆</span>
          <span className="achievement-value">{stats.bestScore}</span>
          <span className="achievement-label">Bedste score</span>
        </div>
      </div>
      {stats.games >= 1 && (
        <div className="achievement-badge">
          {stats.wins / stats.games >= 0.5 ? '⭐ Halv vejen til Pony Mester!' : '🐣 Keep trying, little pony!'}
        </div>
      )}
    </div>
  );
}