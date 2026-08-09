/**
 * Renders a layered pixel-art pony from sprite sheets: body + mane +
 * optional horn/wings, recolored with CSS filters.
 */

import React from 'react';
import {
  TILE, SHEET_COLS, SHEET_ROWS, IDLE_FRAME,
  BASE_SPRITE, HORN_SPRITE, WING_SPRITE,
  getManeStyle, getColorOption,
} from '../pixelPony/spriteData';

function Layer({ src, frame, scale, filter, zIndex }) {
  const sheetW = SHEET_COLS * TILE * scale;
  const sheetH = SHEET_ROWS * TILE * scale;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: TILE * scale,
        height: TILE * scale,
        backgroundImage: `url(${src})`,
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: `-${frame.col * TILE * scale}px -${frame.row * TILE * scale}px`,
        imageRendering: 'pixelated',
        filter,
        zIndex,
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
      {hasWings && <Layer src={WING_SPRITE} frame={frame} scale={scale} filter={bodyFilter} zIndex={1} />}
      <Layer src={BASE_SPRITE} frame={frame} scale={scale} filter={bodyFilter} zIndex={2} />
      {hasHorn && <Layer src={HORN_SPRITE} frame={frame} scale={scale} filter={bodyFilter} zIndex={3} />}
      <Layer src={maneStyle.file} frame={frame} scale={scale} filter={maneFilter} zIndex={4} />
    </div>
  );
}
