import React from 'react';
import { motion } from 'framer-motion';

export default function TutorialOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="tutorial-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="tutorial-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>🦄 Sådan spiller du!</h2>
        <ol className="tutorial-steps">
          <li><strong>Vælg en pony</strong> — hver har sine egne fordele ✨</li>
          <li><strong>Læs scenen</strong> — find ud af hvad du skal gøre 📖</li>
          <li><strong>Kast terningerne</strong> — held og lykke! 🎲</li>
          <li><strong>Overlev 5 scener</strong> — for at vinde! 🏆</li>
        </ol>
        <button className="btn-start" onClick={onClose} aria-label="Start spil">
          Lad os gå! 🚀
        </button>
      </motion.div>
    </motion.div>
  );
}