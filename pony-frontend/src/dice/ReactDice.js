import React, { forwardRef, useCallback } from 'react';
import DiceContainer from './DiceContainer';

export default forwardRef(function ReactDice(props, ref) {
  const totalCb = useCallback((total, diceValues) => {
    if (typeof props.rollDone === 'function') {
      props.rollDone(total, diceValues);
    }
  }, [props.rollDone]);

  return <DiceContainer {...props} totalCb={totalCb} ref={ref} />;
});
