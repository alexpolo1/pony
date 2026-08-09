/**
 * Renders a layered pixel-art pony from sprite sheets: body + tail + mane +
 * optional horn/wings, recolored with CSS filters.
 */

import React from 'react';
import {
  TILE, SHEET_COLS, SHEET_ROWS, IDLE_FRAME,
  BASE_SPRITE, TAIL_SPRITE, HORN_SPRITE, WING_SPRITE,
  getManeStyle, getColorOption,
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
  mane, bodyColor, maneColor, hasHorn, hasWings,
  frame = IDLE_FRAME, scale = 4, className = '',
}) {
  const maneStyle = getManeStyle(mane);
  const bodyFilter = getColorOption(bodyColor).filter;
  const maneFilter = getColorOption(maneColor).filter;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}
    >
      {hasWings && <Layer src={WING_SPRITE} frame={frame} scale={scale} filter="none" zIndex={0} sheet={false} />}
      <Layer src={BASE_SPRITE} frame={frame} scale={scale} filter={bodyFilter} zIndex={1} />
      <Layer src={TAIL_SPRITE} frame={frame} scale={scale} filter={maneFilter} zIndex={2} sheet={false} />
      <Layer src={maneStyle.file} frame={frame} scale={scale} filter={maneFilter} zIndex={3} />
      {hasHorn && <Layer src={HORN_SPRITE} frame={frame} scale={scale} filter="none" zIndex={4} sheet={false} />}
    </div>
  );
}

/** Isolated mane-only icon — used by the mane-style picker so it shows just the hairstyle, not a whole pony. */
export function ManeIcon({ mane, maneColor, frame = IDLE_FRAME, scale = 2, className = '' }) {
  const maneStyle = getManeStyle(mane);
  const maneFilter = getColorOption(maneColor).filter;
  return (
    <div
      className={className}
      style={{ position: 'relative', width: TILE * scale, height: TILE * scale }}
    >
      <Layer src={maneStyle.file} frame={frame} scale={scale} filter={maneFilter} zIndex={1} />
    </div>
  );
}
