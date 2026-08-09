import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export default forwardRef(function Die(props, ref) {
  const {
    defaultRoll = 6,
    dieCornerRadius = 5,
    dieSize = 60,
    disableIndividual = false,
    disableRandom = false,
    dotColor = '#1eff00',
    faceColor = '#ff00ac',
    margin = 15,
    onRollDone,
    outline = false,
    outlineColor = '#000000',
    rollTime = 2,
    sides = 6,
  } = props;

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const [dieValue, setDieValue] = useState(Math.min(Math.max(defaultRoll || 6, 1), 6));
  const [hasRolled, setHasRolled] = useState(false);
  const [rollKey, setRollKey] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  useImperativeHandle(ref, () => ({
    getValue: () => dieValue,
    rollDie,
  }));

  const getRandomInt = () => {
    const max = Math.min(Math.ceil(sides), 6);
    return Math.floor(Math.random() * max) + 1;
  };

  const rollDie = (value) => {
    const rawRoll = disableRandom ? dieValue : (value || getRandomInt());
    const roll = Math.min(Math.max(rawRoll, 1), 6);
    setDieValue(roll);
    setHasRolled(true);
    setRollKey((k) => k + 1);
    setIsRolling(true);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsRolling(false);
      onRollDone(roll);
      timeoutRef.current = null;
    }, rollTime * 1000);
  };

  let faceStyle = {
    background: faceColor,
    borderRadius: dieCornerRadius + 'px',
    height: dieSize + 'px',
    position: 'absolute',
    width: dieSize + 'px',
  };
  if (outline) {
    faceStyle = { ...faceStyle, boxShadow: '0 0 0 1px ' + outlineColor };
  }

  const half = dieSize / 2;
  const f1Style = { transform: 'rotateX(180deg) translateZ(' + half + 'px)' };
  const f2Style = { transform: 'rotateY(-90deg) translateZ(' + half + 'px)' };
  const f3Style = { transform: 'rotateX(90deg) translateZ(' + half + 'px)' };
  const f4Style = { transform: 'rotateX(-90deg) translateZ(' + half + 'px)' };
  const f5Style = { transform: 'rotateY(90deg) translateZ(' + half + 'px)' };
  const f6Style = { transform: 'rotateY(0deg) translateZ(' + half + 'px)' };

  const dotSize = dieSize / 6 - 2;
  const dotStyle = {
    background: dotColor,
    height: dotSize + 'px',
    width: dotSize + 'px',
  };

  const sixth = dieSize / 6;
  const mid = dieSize / 2 - dotSize / 2;
  const d1 = { top: sixth + 'px', left: sixth + 'px' };
  const d2 = { top: sixth + 'px', right: sixth + 'px' };
  const d3 = { top: mid + 'px', left: sixth + 'px' };
  const d4 = { top: mid + 'px', left: mid + 'px' };
  const d5 = { top: mid + 'px', right: sixth + 'px' };
  const d6 = { bottom: sixth + 'px', left: sixth + 'px' };
  const d7 = { bottom: sixth + 'px', right: sixth + 'px' };

  const coreSize = Math.max(dieSize - dieCornerRadius * 2, 0);
  const showFillers = isRolling && dieCornerRadius > 0 && coreSize > 0;
  const coreInset = (dieSize - coreSize) / 2;
  const coreFaceStyle = {
    background: faceColor,
    height: coreSize + 'px',
    width: coreSize + 'px',
    position: 'absolute',
    top: coreInset + 'px',
    left: coreInset + 'px',
    backfaceVisibility: 'visible',
    WebkitBackfaceVisibility: 'visible',
  };
  const cHalf = coreSize / 2;
  const coreTransforms = [
    'rotateY(0deg) translateZ(' + cHalf + 'px)',
    'rotateX(180deg) translateZ(' + cHalf + 'px)',
    'rotateY(90deg) translateZ(' + cHalf + 'px)',
    'rotateY(-90deg) translateZ(' + cHalf + 'px)',
    'rotateX(90deg) translateZ(' + cHalf + 'px)',
    'rotateX(-90deg) translateZ(' + cHalf + 'px)',
  ];

  const rollStyle = {
    animationDuration: rollTime + 's',
    height: dieSize + 'px',
    width: dieSize + 'px',
  };

  const containerStyle = {
    margin: margin + 'px',
    display: 'inline-block',
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') rollDie();
  };

  return (
    <div
      className='die-container'
      onClick={disableIndividual ? undefined : () => rollDie()}
      onKeyDown={disableIndividual ? undefined : handleKeyDown}
      role={disableIndividual ? undefined : 'button'}
      tabIndex={disableIndividual ? undefined : 0}
      style={containerStyle}
    >
      <div
        key={rollKey}
        className={'die ' + (hasRolled ? 'roll' : 'init-roll') + dieValue}
        style={rollStyle}
      >
        {showFillers &&
          coreTransforms.map((transform, i) => (
            <div
              key={'core-' + i}
              className='die-core'
              aria-hidden='true'
              style={{ ...coreFaceStyle, transform }}
            />
          ))}
        <div className='face six' style={{ ...faceStyle, ...f6Style }}>
          <span className='dot' style={{ ...dotStyle, ...d1 }} />
          <span className='dot' style={{ ...dotStyle, ...d2 }} />
          <span className='dot' style={{ ...dotStyle, ...d3 }} />
          <span className='dot' style={{ ...dotStyle, ...d5 }} />
          <span className='dot' style={{ ...dotStyle, ...d6 }} />
          <span className='dot' style={{ ...dotStyle, ...d7 }} />
        </div>
        <div className='face one' style={{ ...faceStyle, ...f1Style }}>
          <span className='dot' style={{ ...dotStyle, ...d4 }} />
        </div>
        <div className='face five' style={{ ...faceStyle, ...f5Style }}>
          <span className='dot' style={{ ...dotStyle, ...d1 }} />
          <span className='dot' style={{ ...dotStyle, ...d2 }} />
          <span className='dot' style={{ ...dotStyle, ...d4 }} />
          <span className='dot' style={{ ...dotStyle, ...d6 }} />
          <span className='dot' style={{ ...dotStyle, ...d7 }} />
        </div>
        <div className='face two' style={{ ...faceStyle, ...f2Style }}>
          <span className='dot' style={{ ...dotStyle, ...d2 }} />
          <span className='dot' style={{ ...dotStyle, ...d6 }} />
        </div>
        <div className='face three' style={{ ...faceStyle, ...f3Style }}>
          <span className='dot' style={{ ...dotStyle, ...d2 }} />
          <span className='dot' style={{ ...dotStyle, ...d4 }} />
          <span className='dot' style={{ ...dotStyle, ...d6 }} />
        </div>
        <div className='face four' style={{ ...faceStyle, ...f4Style }}>
          <span className='dot' style={{ ...dotStyle, ...d1 }} />
          <span className='dot' style={{ ...dotStyle, ...d2 }} />
          <span className='dot' style={{ ...dotStyle, ...d6 }} />
          <span className='dot' style={{ ...dotStyle, ...d7 }} />
        </div>
      </div>
    </div>
  );
});
