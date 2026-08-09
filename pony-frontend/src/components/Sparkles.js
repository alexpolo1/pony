import React from 'react';
import { motion } from 'framer-motion';

export default function Sparkles() {
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 16,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    emoji: ['✨', '⭐', '💫', '🌟', '🦋'][Math.floor(Math.random() * 5)],
  }));
  return (
    <div className="sparkles-container">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0.5] }}
          transition={{ delay: s.delay, duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
        >
          {s.emoji}
        </motion.div>
      ))}
    </div>
  );
}