import React from 'react';
import { motion } from 'framer-motion';
import PixelPonySprite from './PixelPonySprite';

// A handful of distinct little pixel ponies, each with its own look, drifting
// around in the background — replaces the old random emoji decoration.
const items = [
  { x: 10, y: 20, d: 4, appearance: { mane: 'bookish', bodyColor: 'pink', maneColor: 'yellow', eyeColor: 'original', tail: 'long', tailColor: 'yellow', hasHorn: false, hasWings: false } },
  { x: 80, y: 15, d: 3, appearance: { mane: 'bubbly', bodyColor: 'purple', maneColor: 'blue', eyeColor: 'original', tail: 'curly', tailColor: 'blue', hasHorn: true, horn: 'swirl', hornColor: 'yellow', hasWings: false } },
  { x: 20, y: 70, d: 5, appearance: { mane: 'clean', bodyColor: 'blue', maneColor: 'green', eyeColor: 'original', tail: 'short', tailColor: 'green', hasHorn: false, hasWings: false } },
  { x: 70, y: 60, d: 3.5, appearance: { mane: 'fancy', bodyColor: 'teal', maneColor: 'pink', eyeColor: 'original', tail: 'long', tailColor: 'pink', hasHorn: false, hasWings: true, wing: 'spread', wingColor: 'original' } },
  { x: 50, y: 80, d: 4.5, appearance: { mane: 'fiesty', bodyColor: 'yellow', maneColor: 'purple', eyeColor: 'original', tail: 'curly', tailColor: 'purple', hasHorn: false, hasWings: false } },
  { x: 90, y: 40, d: 5.5, appearance: { mane: 'genki', bodyColor: 'green', maneColor: 'original', eyeColor: 'original', tail: 'short', tailColor: 'original', hasHorn: false, hasWings: false } },
  { x: 5, y: 50, d: 3, appearance: { mane: 'ponytail', bodyColor: 'white', maneColor: 'black', eyeColor: 'original', tail: 'long', tailColor: 'black', hasHorn: false, hasWings: false } },
  { x: 60, y: 30, d: 4, appearance: { mane: 'reserved', bodyColor: 'original', maneColor: 'teal', eyeColor: 'original', tail: 'curly', tailColor: 'teal', hasHorn: true, horn: 'nub', hornColor: 'yellow', hasWings: true, wing: 'folded', wingColor: 'original' } },
];

export default function FloatingBg() {
  return (
    <div className="floating-bg">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="floating-pony"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: item.d, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PixelPonySprite {...item.appearance} scale={2} />
        </motion.div>
      ))}
    </div>
  );
}
