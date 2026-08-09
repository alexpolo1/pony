import React from 'react';
import { setMasterVolume } from '../SceneMusic';

export default function VolumeControl({ volume, onChange }) {
  return (
    <div className="volume-control">
      <span className="volume-icon" aria-label={`Lydstyrke: ${Math.round(volume * 100)}%`}>
        {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(v);
          setMasterVolume(v);
        }}
        className="volume-slider"
        aria-label="Justér lydstyrke"
        title={`Lydstyrke: ${Math.round(volume * 100)}%`}
      />
    </div>
  );
}