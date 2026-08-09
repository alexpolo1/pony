import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function StatsPage({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.loadStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="scene-text">Indlæser statistik...</div>;
  if (!stats) return <div className="scene-text">Kunne ikke indlæse statistik.</div>;

  const ponyBadges = {
    'Jordpony': '🐴',
    'Pegasus': '🪽',
    'Enhjørning': '🦄',
    'Alicorn': '👑',
  };

  return (
    <div className="stats-page">
      <button className="back-button" onClick={onBack}>← Tilbage</button>
      <h2>🏆 Din statistik</h2>

      <div className="stats-overview">
        <span className="stat-item">
          <strong>{stats.total_games}</strong> spil
        </span>
        <span className="stat-item">
          <strong>{stats.total_victories}</strong> sejre
        </span>
        <span className="stat-item">
          <strong>{stats.win_rate}%</strong> sejr-rate
        </span>
      </div>

      {stats.by_pony_type?.length > 0 && (
        <div className="stats-section">
          <h3>Per pony-type</h3>
          <ul className="stats-list">
            {stats.by_pony_type.map(p => (
              <li key={p.type}>
                {ponyBadges[p.type] || ''} {p.type}: {p.games} spil, {p.win_rate}% sejre
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.by_tema?.length > 0 && (
        <div className="stats-section">
          <h3>Per tema</h3>
          <ul className="stats-list">
            {stats.by_tema.map(t => (
              <li key={t.tema_id}>
                {t.tema_title}: {t.games} spil, {t.win_rate}% sejre
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.recent_games?.length > 0 && (
        <div className="stats-section">
          <h3>Sidste spil</h3>
          <ul className="stats-list">
            {stats.recent_games.map(g => (
              <li key={g.game_id}>
                {g.pony_type} — {g.tema}: {g.successes}/{g.total_scenes} succeser
                {g.victory ? ' 🌟' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}