/**
 * Ponyby — story/quest data + progress state.
 *
 * A "story" is a small Danish quest: an NPC (giver) gives an intro line,
 * an objective, a target location in the Ponyby world, and a success line.
 * The child completes it by walking to the landmark and doing the task.
 *
 * Progress is persisted to localStorage so a 4-year-old's progress survives
 * a browser refresh, exactly like the rest of the game (achievements, etc.).
 */

import { loadAppearance } from '../services/ponyAppearance';

export const STORAGE_KEY = 'pony_ponyby_progress';

// Landmark ids double as world coordinates (see PonyvillePage.js WORLD).
// Each story targets one landmark so "walk there + do the thing" is the beat.
export const STORIES = [
  {
    id: 'bog',
    emoji: '📚',
    giver: 'Bibliotekar Twi',
    title: 'Twilights forsvundne bog',
    intro: 'Hej! Jeg hedder Twi. Jeg kan ikke finde min røde bog i biblioteket. Kan du hjælpe?',
    objective: 'Gå til biblioteket 📚 og find den røde bog.',
    target: 'library',
    success: 'Fantastisk! Her er min røde bog. Du er en rigtig hjælper!',
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
    success: 'Åh, den glimrer så smukt! Tusind tak for din hjælp!',
    stars: 2,
  },
  {
    id: 'hest',
    emoji: '🐴',
    giver: 'Staldbønderen Zecora',
    title: 'Zecoras lille hest',
    intro: 'Min lille hest har fået ondt i benet. Kan du gå til stalden og give hende en kramme?',
    objective: 'Gå til stalden 🐴 og giv hesten et kram.',
    target: 'stable',
    success: 'Aaaah, tak for krampet! Hesten er glad nu. Godt hjerte, du!',
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
    success: 'WOOHOO! En fest! Tak for ballonen! 🎉',
    stars: 1,
  },
  {
    id: 'slottet',
    emoji: '👑',
    giver: 'Prinsesse Cadance',
    title: 'Cadances stjerne',
    intro: 'Kærlig hilsen fra slottet! Jeg har mistet min lille stjerne. Hent den for mig, kære pony?',
    objective: 'Gå til slottet 👑 og hent prinsessens stjerne.',
    target: 'castle',
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
