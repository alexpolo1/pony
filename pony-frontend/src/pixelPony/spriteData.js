/**
 * Data for the pixel pony configurator: sprite sheet layout and available
 * customization options. The base body and mane sheets are 8x8 grids of
 * 32x32 frames. Eyes/tail/horn/wings are small single-frame accent
 * overlays — the source asset pack's horn/wing/tail sheets turned out to
 * be either 1-3px alignment markers or unrelated expression icons, not
 * visible body-part art, so those are hand-drawn flat 32x32 overlays.
 */

export const TILE = 32;
export const SHEET_COLS = 8;
export const SHEET_ROWS = 8;

// Default idle frame — a side-facing standing pose shared by every sheet.
export const IDLE_FRAME = { row: 0, col: 0 };
// A second frame used to animate a gentle idle bob in the big preview.
export const IDLE_FRAME_2 = { row: 0, col: 1 };

export const BASE_SPRITE = '/sprites/pony/base.png';
export const EYE_SPRITE = '/sprites/pony/eye.png';

export const PONY_TYPES = [
  { id: 'jordpony', label: 'Jordpony', hasHorn: false, hasWings: false },
  { id: 'pegasus', label: 'Pegasus', hasHorn: false, hasWings: true },
  { id: 'enhjorning', label: 'Enhjørning', hasHorn: true, hasWings: false },
  { id: 'alicorn', label: 'Alicorn', hasHorn: true, hasWings: true },
];

// Of the source pack's 17 "mane" files, only these actually contain hair
// art at the idle frame — the rest (dramatic/fabulous/inquisitive/
// intelligent/perky/friendly/practical/stoic/tough) turned out to be small
// eye/expression icons unrelated to hair, so they're excluded here.
export const MANE_STYLES = [
  { id: 'bookish', label: 'Boglig', file: '/sprites/pony/mane-bookish.png' },
  { id: 'bubbly', label: 'Boblende', file: '/sprites/pony/mane-bubbly.png' },
  { id: 'clean', label: 'Ren', file: '/sprites/pony/mane-clean.png' },
  { id: 'fancy', label: 'Fin', file: '/sprites/pony/mane-fancy.png' },
  { id: 'fiesty', label: 'Vild', file: '/sprites/pony/mane-fiesty.png' },
  { id: 'genki', label: 'Energisk', file: '/sprites/pony/mane-genki.png' },
  { id: 'ponytail', label: 'Hestehale', file: '/sprites/pony/mane-ponytail.png' },
  { id: 'reserved', label: 'Rolig', file: '/sprites/pony/mane-reserved.png' },
];

// Hand-drawn accent styles (no matching art existed in the source pack).
export const TAIL_STYLES = [
  { id: 'long', label: 'Lang', file: '/sprites/pony/tail-long.png' },
  { id: 'short', label: 'Kort', file: '/sprites/pony/tail-short.png' },
  { id: 'curly', label: 'Krøllet', file: '/sprites/pony/tail-curly.png' },
];

export const HORN_STYLES = [
  { id: 'spike', label: 'Spids', file: '/sprites/pony/horn-spike.png' },
  { id: 'swirl', label: 'Snoet', file: '/sprites/pony/horn-swirl.png' },
  { id: 'nub', label: 'Lille', file: '/sprites/pony/horn-nub.png' },
];

export const WING_STYLES = [
  { id: 'folded', label: 'Foldet', file: '/sprites/pony/wing-folded.png' },
  { id: 'spread', label: 'Udspredt', file: '/sprites/pony/wing-spread.png' },
];

// hue-rotate degrees are calibrated against base.png's own hue (~0deg, red)
// so the *body* color actually matches its label (previously "Blå" rendered
// green and "Lilla" rendered blue, since the rotations were tuned for a
// baseline that didn't match the real sprite). Mane/tail/horn sit at a
// different baseline hue (~30deg, orange), so the same rotation lands on a
// nearby-but-not-identical hue there -- an accepted tradeoff of sharing one
// palette across every layer.
export const COLOR_OPTIONS = [
  { id: 'original', label: 'Original', filter: 'none' },
  { id: 'pink', label: 'Lyserød', filter: 'hue-rotate(330deg) saturate(1.3)' },
  { id: 'purple', label: 'Lilla', filter: 'hue-rotate(275deg) saturate(1.4)' },
  { id: 'blue', label: 'Blå', filter: 'hue-rotate(215deg) saturate(1.5)' },
  { id: 'teal', label: 'Turkis', filter: 'hue-rotate(180deg) saturate(1.4)' },
  { id: 'green', label: 'Grøn', filter: 'hue-rotate(125deg) saturate(1.3)' },
  { id: 'yellow', label: 'Gul', filter: 'hue-rotate(50deg) saturate(1.5) brightness(1.15)' },
  { id: 'white', label: 'Hvid', filter: 'saturate(0.15) brightness(1.7)' },
  { id: 'black', label: 'Sort', filter: 'brightness(0.35)' },
];

export const DEFAULT_APPEARANCE = {
  ponyType: PONY_TYPES[0].id,
  mane: MANE_STYLES[0].id,
  bodyColor: COLOR_OPTIONS[1].id,
  maneColor: COLOR_OPTIONS[6].id,
  tail: TAIL_STYLES[0].id,
  tailColor: COLOR_OPTIONS[6].id,
  eyeColor: COLOR_OPTIONS[0].id,
  hasHorn: false,
  horn: HORN_STYLES[0].id,
  hornColor: COLOR_OPTIONS[6].id,
  hasWings: false,
  wing: WING_STYLES[0].id,
  wingColor: COLOR_OPTIONS[0].id,
};

export function getManeStyle(id) {
  return MANE_STYLES.find(m => m.id === id) || MANE_STYLES[0];
}

export function getTailStyle(id) {
  return TAIL_STYLES.find(t => t.id === id) || TAIL_STYLES[0];
}

export function getHornStyle(id) {
  return HORN_STYLES.find(h => h.id === id) || HORN_STYLES[0];
}

export function getWingStyle(id) {
  return WING_STYLES.find(w => w.id === id) || WING_STYLES[0];
}

export function getColorOption(id) {
  return COLOR_OPTIONS.find(c => c.id === id) || COLOR_OPTIONS[0];
}

export function getPonyType(id) {
  return PONY_TYPES.find(t => t.id === id) || PONY_TYPES[0];
}
