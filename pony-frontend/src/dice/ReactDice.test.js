import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';
import ReactDice from './ReactDice';

test('an externally supplied backend roll controls the visible die value', () => {
  const ref = createRef();
  const { container } = render(
    <ReactDice ref={ref} numDice={2} disableRandom={true} defaultRoll={1} rollTime={0.01} />
  );
  act(() => ref.current.rollAll([5, 3]));
  const dice = container.querySelectorAll('.die');
  expect(dice[0]).toHaveClass('roll5');
  expect(dice[1]).toHaveClass('roll3');
});
