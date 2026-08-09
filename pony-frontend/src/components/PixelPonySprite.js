/**
 * Renders a layered pixel-art pony from sprite sheets: body + eyes + tail +
 * mane + optional horn/wings, each with its own style and color.
 */

import React from 'react';
import {
  TILE, SHEET_COLS, SHEET_ROWS, IDLE_FRAME,
  BASE_SPRITE, EYE_SPRITE,
  getManeStyle, getTailStyle, getHornStyle, getWingStyle, getColorOption,
} from '../pixelPony/spriteData';

function Layer({ src, frame, scale, filter, zIndex, sheet = true }) {
  const size = TILE * scale;
  const style = sheet
    ? {
      backgroundSize: `${SHEET_COLS * size}px ${SHEET_ROWS * size}px`,
      backgroundPosition: `-${frame.col * size}px -${frame.row * size}px`,
    }
    : {
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: '0 0',
    };
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        backgroundImage: `url(${src})`,
        imageRendering: 'pixelated',
        filter,
        zIndex,
        ...style,
      }}
    />
  );
}

export default function PixelPonySprite({
  mane, bodyColor, maneColor, eyeColor,
  tail, tailColor, hasHorn, horn, hornColor, hasWings, wing, wingColor,
  frame = IDLE_FRAME, scale = 4, className = '',
}) {
  const maneStyle = getManeStyle(mane);
  const tailStyle = getTailStyle(tail);
  const hornStyle = getHornStyle(horn);
  const wingStyle = getWingStyle(wing);
  const bodyFilter = getColorOption(bodyColor).filter;
  const maneFilter = getColorOption(maneColor).filter;
  const eyeFilter = getColorOption(eyeColor).filter;
  const tailFilter = getColorOption(tailColor).filter;
  const hornFilter = getColorOption(hornColor).filter;
  const wingFilter = getColorOption(wingColor).filter;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}
    >
      <Layer src={BASE_SPRITE} frame={frame} scale={scale} filter={bodyFilter} zIndex={1} />
      {hasWings && <Layer src={wingStyle.file} frame={frame} scale={scale} filter={wingFilter} zIndex={2} sheet={false} />}
      <Layer src={EYE_SPRITE} frame={frame} scale={scale} filter={eyeFilter} zIndex={3} sheet={false} />
      <Layer src={tailStyle.file} frame={frame} scale={scale} filter={tailFilter} zIndex={4} sheet={false} />
      <Layer src={maneStyle.file} frame={frame} scale={scale} filter={maneFilter} zIndex={5} />
      {hasHorn && <Layer src={hornStyle.file} frame={frame} scale={scale} filter={hornFilter} zIndex={6} sheet={false} />}
    </div>
  );
}

/** Isolated mane-only icon — used by the mane-style picker so it shows just the hairstyle, not a whole pony. */
export function ManeIcon({ mane, maneColor, frame = IDLE_FRAME, scale = 2, className = '' }) {
  const maneStyle = getManeStyle(mane);
  const maneFilter = getColorOption(maneColor).filter;
  return (
    <div className={className} style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}>
      <Layer src={maneStyle.file} frame={frame} scale={scale} filter={maneFilter} zIndex={1} sheet />
    </div>
  );
}

/** Isolated tail-only icon — used by the tail-style picker. */
export function TailIcon({ tail, tailColor, scale = 2, className = '' }) {
  const tailStyle = getTailStyle(tail);
  const tailFilter = getColorOption(tailColor).filter;
  return (
    <div className={className} style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}>
      <Layer src={tailStyle.file} scale={scale} filter={tailFilter} zIndex={1} sheet={false} />
    </div>
  );
}

/** Isolated horn-only icon — used by the horn-style picker. */
export function HornIcon({ horn, hornColor, scale = 2, className = '' }) {
  const hornStyle = getHornStyle(horn);
  const hornFilter = getColorOption(hornColor).filter;
  return (
    <div className={className} style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}>
      <Layer src={hornStyle.file} scale={scale} filter={hornFilter} zIndex={1} sheet={false} />
    </div>
  );
}

/** Isolated wing-only icon — used by the wing-style picker. */
export function WingIcon({ wing, wingColor, scale = 2, className = '' }) {
  const wingStyle = getWingStyle(wing);
  const wingFilter = getColorOption(wingColor).filter;
  return (
    <div className={className} style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}>
      <Layer src={wingStyle.file} scale={scale} filter={wingFilter} zIndex={1} sheet={false} />
    </div>
  );
}
