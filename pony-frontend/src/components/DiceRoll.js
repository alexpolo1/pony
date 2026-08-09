import React, { useRef, useEffect } from 'react';
import ReactDice from '../dice/ReactDice';
import { playRoll } from '../SceneMusic';

export default function DiceRoll({ dice }) {
  const reactDice = useRef(null);
  const hasRolled = useRef(false);

  useEffect(() => {
    if (dice && dice.length > 0 && !hasRolled.current) {
      hasRolled.current = true;
      playRoll();
      setTimeout(() => {
        reactDice.current?.rollAll(dice);
      }, 100);
    }
  }, [dice]);

  return (
    <div className="dice-result" aria-label={`Terningerne viser ${(dice || []).join(' og ')}`}>
      <div className="dice-row">
      <ReactDice
        ref={reactDice}
        numDice={dice?.length ?? 2}
        sides={6}
        dieSize={48}
        faceColor="#ffffff"
        dotColor="#e91e8c"
        dieCornerRadius={8}
        margin={10}
        outline={true}
        outlineColor="#f093fb"
        rollTime={1.5}
        disableIndividual={true}
        disableRandom={true}
        defaultRoll={1}
      />
      </div>
      <div className="dice-values">
        {(dice || []).map((value, index) => <span key={index}>🎲 {value}</span>)}
      </div>
    </div>
  );
}
