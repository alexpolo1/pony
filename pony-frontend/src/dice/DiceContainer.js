import React, { forwardRef, useRef, useEffect, useImperativeHandle, memo, useMemo, useCallback } from 'react';
import Die from './Die';
import './dice.css';

export default memo(forwardRef(function DiceContainer({ numDice, totalCb, ...rest }, ref) {
  const diceRefs = useRef([]);
  const rollCountRef = useRef(0);

  useImperativeHandle(ref, () => ({
    rollAll,
  }));

  const getRollResults = useCallback(() => {
    let newTotalValue = 0;
    let newDiceValues = [];
    for (let die of diceRefs.current) {
      if (die !== null) {
        const value = die.getValue();
        newDiceValues.push(value);
        newTotalValue += value;
      }
    }
    totalCb(newTotalValue, newDiceValues);
  }, [totalCb]);

  const rollAll = (values) => {
    values = values || [];
    diceRefs.current.length = numDice;
    const liveCount = diceRefs.current.filter(Boolean).length;
    rollCountRef.current = liveCount;
    let index = 0;
    for (let die of diceRefs.current) {
      if (die !== null) {
        die.rollDie(values[index]);
        index += 1;
      }
    }
  };

  const onRollDone = useCallback(() => {
    rollCountRef.current -= 1;
    if (rollCountRef.current <= 0) {
      setTimeout(getRollResults, 100);
    }
  }, [getRollResults]);

  useEffect(() => {
    diceRefs.current.length = numDice;
    getRollResults();
  }, [numDice, getRollResults]);

  const getDice = useMemo(() => {
    const dice = [];
    for (let i = 0; i < numDice; i++) {
      dice.push(
        <Die
          {...rest}
          key={i}
          onRollDone={onRollDone}
          ref={(die) => { diceRefs.current[i] = die; }}
        />
      );
    }
    return dice;
  }, [numDice, onRollDone, rest.defaultRoll, rest.dieCornerRadius, rest.dieSize, rest.disableIndividual, rest.disableRandom, rest.dotColor, rest.faceColor, rest.margin, rest.outline, rest.outlineColor, rest.rollTime, rest.sides]);

  return <div className='dice'>{getDice}</div>;
}));
