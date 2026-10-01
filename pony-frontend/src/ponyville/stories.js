/**
 * Ponyby — story/quest data + progress state.
 *
 * A "story" is a small Danish quest: an NPC (giver) gives an intro, a target
 * location in the Ponyby world, and a little d6 challenge. The child completes
 * it by walking to the landmark, opening the dialog, and rolling the die — the
 * result is read aloud (voice). Progress persists to localStorage.
 */

import { loadAppearance } from '../services/ponyAppearance';

export const STORAGE_KEY = 'pony_ponyby_progress';

// Shared voice lines (Danish, kid-friendly). Win line is per-story (success).
export const ROLL_PROMPT = 'Kast terningen og se, om det lykkedes!';
export const FAIL_LINES = [
  'Næsten! Prøv igen, du kan det!',
  'Hov, ikke helt. Giv den et mere!',
  'Det var tæt på. Kast igen!',
];

// Landmark ids double as world coordinates (see PonyvillePage.js LANDMARKS).
// Each story targets one landmark and has a d6 target number (higher = harder).
// Ordered by difficulty so the walk-around ramps up: 3,3,4 then 4,4,5.
export const STORIES = [
  {
    id: 'bog',
    emoji: '📚',
    giver: 'Bibliotekar Twi',
    title: 'Twilights forsvundne bog',
    intro: 'Hej! Jeg hedder Twi. Jeg kan ikke finde min røde bog i biblioteket. Kan du hjælpe?',
    objective: 'Gå til biblioteket 📚 og find den røde bog.',
    target: 'library',
    diceTarget: 3,
    success: 'Fantastisk! Her er min røde bog. Du er en rigtig hjælper!',
    stars: 1,
  },
  {
    id: 'hest',
    emoji: '🐴',
    giver: 'Staldbønderen Zecora',
    title: 'Zecoras lille hest',
    intro: 'Min lille hest har fået ondt i benet. Kan du gå til stalden og give hende et kram?',
    objective: 'Gå til stalden 🐴 og giv hesten et kram.',
    target: 'stable',
    diceTarget: 3,
    success: 'Aaaah, tak for krammet! Hesten er glad nu. Godt hjerte, du!',
    stars: 1,
  },
  {
    id: 'park',
    emoji: '🌳',
    giver: 'Parkvagten Pinkie',
    title: 'Pinkies flyvende ballonfest',
    intro: 'Vupti! Mine balloner er flyvet op i parken! Få fat i den røde ballon for mig!',
    objective: 'Gå til parken 🌳 og fang den røde ballon.',
    target: 'park',
    diceTarget: 4,
    success: 'WOOHOO! En fest! Tak for ballonen! 🎉',
    stars: 1,
  },
  {
    id: 'apple',
    emoji: '🍎',
    giver: 'Bønderen Applejack',
    title: 'Æblerne ruller væk',
    intro: 'Vau! Min kurv er fuld af æbler, men de ruller ned ad bakken. Hjælp mig med at fange dem!',
    objective: 'Gå til frugthaven 🍎 og fang de rullende æbler.',
    target: 'orchard',
    diceTarget: 4,
    success: 'Tak! Nu har jeg alle mine æbler. Du kan ALT!',
    stars: 2,
  },
  {
    id: 'skole',
    emoji: '✏️',
    giver: 'Læreren Rarity',
    title: 'Raritys glimmer-sten',
    intro: 'Hej lille pony! Jeg har gemt en skøn glimmer-sten på skolen. Hent den til mig!',
    objective: 'Gå til skolen ✏️ og hent den glimrende sten.',
    target: 'school',
    diceTarget: 4,
    success: 'Åh, den glimrer så smukt! Tusind tak for din hjælp!',
    stars: 2,
  },
  {
    id: 'slottet',
    emoji: '👑',
    giver: 'Prinsesse Cadance',
    title: 'Cadances stjerne',
    intro: 'Kærlig hilsen fra slottet! Jeg har mistet min lille stjerne. Hent den for mig, kære pony?',
    objective: 'Gå til slottet 👑 og hent prinsessens stjerne.',
    target: 'castle',
    diceTarget: 5,
    success: 'Den er tryg igen. Du er min helt i dag. 🌟',
    stars: 3,
  },
];

export function getStory(id) {
  return STORIES.find((s) => s.id === id);
}

/**
 * Load saved progress. Shape:
 *   { done: { [id]: true }, active: 'bog' | null }
 * `active` = the story currently offered/in-progress (the one to chase).
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { done: {}, active: null, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { done: {}, active: null };
}

/** First not-yet-done story is the active one; once all done, null. */
export function computeActive(progress) {
  if (progress.active && !progress.done[progress.active]) return progress.active;
  const next = STORIES.find((s) => !progress.done[s.id]);
  return next ? next.id : null;
}

export function saveProgress(progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* ignore */ }
}

export function completeStory(id) {
  const progress = loadProgress();
  progress.done[id] = true;
  progress.active = computeActive({ ...progress, active: null });
  saveProgress(progress);
  return progress;
}

/** Total stars earned so far (sum of stars for completed stories). */
export function starsEarned(progress) {
  return STORIES.reduce((sum, s) => sum + (progress.done[s.id] ? s.stars : 0), 0);
}

export function countDone(progress) {
  return STORIES.reduce((n, s) => n + (progress.done[s.id] ? 1 : 0), 0);
}

export { loadAppearance };
