import React from 'react';
import { motion } from 'framer-motion';

const items = [
  { emoji: '🌈', x: 10, y: 20, d: 4 },
  { emoji: '🦋', x: 80, y: 15, d: 3 },
  { emoji: '🌸', x: 20, y: 70, d: 5 },
  { emoji: '🎈', x: 70, y: 60, d: 3.5 },
  { emoji: '🍭', x: 50, y: 80, d: 4.5 },
  { emoji: '🌙', x: 90, y: 40, d: 5.5 },
  { emoji: '🎀', x: 5, y: 50, d: 3 },
  { emoji: '🌻', x: 60, y: 30, d: 4 },
];

export default function FloatingBg() {
  return (
    <div className="floating-bg">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="floating-emoji"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: item.d, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}