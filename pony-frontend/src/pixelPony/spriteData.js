/**
 * Data for the pixel pony configurator: sprite sheet layout and available
 * customization options. Body/mane/tail sheets are 8x8 grids of 32x32
 * frames. Horn/wing are small single-frame accent overlays (the source
 * asset pack's horn/wing sheets are just 1-3px alignment markers, not
 * visible art, so those two are hand-drawn flat 32x32 overlays instead).
 */

export const TILE = 32;
export const SHEET_COLS = 8;
export const SHEET_ROWS = 8;

// Default idle frame — a side-facing standing pose shared by every sheet.
export const IDLE_FRAME = { row: 0, col: 0 };
// A second frame used to animate a gentle idle bob in the big preview.
export const IDLE_FRAME_2 = { row: 0, col: 1 };

export const BASE_SPRITE = '/sprites/pony/base.png';
// Flat single-frame overlays (not sheets) — always drawn at the same spot.
// The source pack's horn/wing/tail sheets are just 1-3px alignment markers,
// not visible art, so these three are hand-drawn accents instead.
export const TAIL_SPRITE = '/sprites/pony/tail.png';
export const HORN_SPRITE = '/sprites/pony/horn.png';
export const WING_SPRITE = '/sprites/pony/wing.png';

export const PONY_TYPES = [
  { id: 'jordpony', label: 'Jordpony', hasHorn: false, hasWings: false },
  { id: 'pegasus', label: 'Pegasus', hasHorn: false, hasWings: true },
  { id: 'enhjorning', label: 'Enhjørning', hasHorn: true, hasWings: false },
  { id: 'alicorn', label: 'Alicorn', hasHorn: true, hasWings: true },
];

export const MANE_STYLES = [
  { id: 'bookish', label: 'Boglig', file: '/sprites/pony/mane-bookish.png' },
  { id: 'bubbly', label: 'Boblende', file: '/sprites/pony/mane-bubbly.png' },
  { id: 'clean', label: 'Ren', file: '/sprites/pony/mane-clean.png' },
  { id: 'dramatic', label: 'Dramatisk', file: '/sprites/pony/mane-dramatic.png' },
  { id: 'fabulous', label: 'Fabelagtig', file: '/sprites/pony/mane-fabulous.png' },
  { id: 'fancy', label: 'Fin', file: '/sprites/pony/mane-fancy.png' },
  { id: 'fiesty', label: 'Vild', file: '/sprites/pony/mane-fiesty.png' },
  { id: 'friendly', label: 'Venlig', file: '/sprites/pony/mane-friendly.png' },
  { id: 'genki', label: 'Energisk', file: '/sprites/pony/mane-genki.png' },
  { id: 'inquisitive', label: 'Nysgerrig', file: '/sprites/pony/mane-inquisitive.png' },
  { id: 'intelligent', label: 'Klog', file: '/sprites/pony/mane-intelligent.png' },
  { id: 'perky', label: 'Kæk', file: '/sprites/pony/mane-perky.png' },
  { id: 'ponytail', label: 'Hestehale', file: '/sprites/pony/mane-ponytail.png' },
  { id: 'practical', label: 'Praktisk', file: '/sprites/pony/mane-practical.png' },
  { id: 'reserved', label: 'Rolig', file: '/sprites/pony/mane-reserved.png' },
  { id: 'stoic', label: 'Stærk', file: '/sprites/pony/mane-stoic.png' },
  { id: 'tough', label: 'Tuf', file: '/sprites/pony/mane-tough.png' },
];

export const COLOR_OPTIONS = [
  { id: 'original', label: 'Rødbrun', filter: 'none' },
  { id: 'pink', label: 'Lyserød', filter: 'hue-rotate(300deg) saturate(1.3)' },
  { id: 'purple', label: 'Lilla', filter: 'hue-rotate(220deg) saturate(1.4)' },
  { id: 'blue', label: 'Blå', filter: 'hue-rotate(150deg) saturate(1.5)' },
  { id: 'teal', label: 'Turkis', filter: 'hue-rotate(120deg) saturate(1.4)' },
  { id: 'green', label: 'Grøn', filter: 'hue-rotate(80deg) saturate(1.3)' },
  { id: 'yellow', label: 'Gul', filter: 'hue-rotate(-30deg) saturate(1.5) brightness(1.15)' },
  { id: 'white', label: 'Hvid', filter: 'saturate(0.15) brightness(1.7)' },
  { id: 'black', label: 'Sort', filter: 'brightness(0.35)' },
];

export const DEFAULT_APPEARANCE = {
  ponyType: PONY_TYPES[0].id,
  mane: MANE_STYLES[0].id,
  bodyColor: COLOR_OPTIONS[1].id,
  maneColor: COLOR_OPTIONS[6].id,
  hasTail: true,
  hasHorn: false,
  hasWings: false,
};

export function getManeStyle(id) {
  return MANE_STYLES.find(m => m.id === id) || MANE_STYLES[0];
}

export function getColorOption(id) {
  return COLOR_OPTIONS.find(c => c.id === id) || COLOR_OPTIONS[0];
}

export function getPonyType(id) {
  return PONY_TYPES.find(t => t.id === id) || PONY_TYPES[0];
}
