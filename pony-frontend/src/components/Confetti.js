import React from 'react';
import { motion } from 'framer-motion';

export default function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#7B68EE', '#32CD32'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 10,
    shape: Math.random() > 0.5 ? 'circle' : 'square',
  }));
  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={`confetti confetti-${p.shape}`}
          style={{ left: `${p.x}%`, backgroundColor: p.color, width: p.size, height: p.size }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [1, 1, 0], rotate: 720 }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}