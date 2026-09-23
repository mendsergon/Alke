/**
 * App data, in two halves.
 *
 * CATALOG is real content the app ships with: the exercise table and the
 * starter program templates. It is safe to show.
 *
 * USER DATA is everything a person produces by training — programs they have
 * added, sessions, sets, records, reports, their gym. It starts EMPTY and only
 * fills when they use the app. Nothing here is transcribed from the design
 * exports: those exports show how the app looks, not what it contains, and
 * PLAN.md §1 says their copy, numbers, names and volume ranges are placeholder.
 *
 * The screens read the empty values below and render their empty states. When
 * a store lands, these become its initial state and nothing on the screens
 * needs to change.
 */
import type { ExerciseIconKey } from '../figure/figure.generated';

export type Gym = { name: string; shortName: string; place: string; members: number; machines: number };

export type WeekStat = { label: string; value: string; suffix: string; done: number; target: number };

export type SessionPlan = {
  program: string;
  where: string;
  chips: string[];
};

export type ReportTeaser = { eyebrow: string; week: string; line: string };

export type ExerciseRow = {
  name: string;
  /** The muscle this movement trains first. Exercises are grouped by it. */
  muscle: string;
  equipment: string;
  icon: ExerciseIconKey;
};

export type SharedProgram = {
  name: string;
  by: string;
  featured?: boolean;
  daysPerWeek: number;
  weekLength: number;
  chips: string[];
  saves: string;
  /** Index into FIGURE_STRIPS — the whole-body figure the export draws. */
  strip: number;
};

export type HistoryRow = {
  name: string;
  detail: string;
  done: number;
  target: number;
  record?: boolean;
};

export type MuscleScore = { muscle: string; score: number };

// ===========================================================================
// CATALOG — real content, shipped with the app
// ===========================================================================

/**
 * The exercise table is served, not shipped. PLAN.md §1.1 calls it the single
 * most important data asset; it lives on the backend and nothing is invented
 * here to stand in for it.
 */
export const EXERCISE_CATALOG: ExerciseRow[] = [];

/** The weekly targets the status block measures against. Nothing is done yet. */
export const WEEK_TARGETS: WeekStat[] = [
  { label: 'Sessions', value: '0', suffix: 'of 0', done: 0, target: 0 },
  { label: 'Sets', value: '0', suffix: 'this week', done: 0, target: 0 },
  { label: 'Muscles in range', value: '0', suffix: 'of 21', done: 0, target: 21 },
];

export const CHECK_IN_SLIDERS = ['Sleep', 'Fatigue', 'Stress', 'Sore', 'Mood'];

// ===========================================================================
// USER DATA — empty until the person trains
// ===========================================================================

/** No gym joined. The chip and the Profile card both read this. */
export const ACTIVE_GYM: Gym | null = null;
export const GYM_MEMBERSHIPS: Gym[] = [];

/** Exercises the person created themselves, on top of the catalog. */
export const USER_CUSTOM_EXERCISES: ExerciseRow[] = [];

/** Programs other people have shared. Nothing until the social layer exists. */
export const SHARED_PROGRAMS: SharedProgram[] = [];

/** Programs published by the active gym. Nothing without a gym. */
export const GYM_PROGRAMS: SharedProgram[] = [];

/** Every session logged, newest first. */
export const USER_HISTORY: HistoryRow[] = [];

/** Fractional weekly volume per muscle, 0 to 1. Drives the body map. */
export const USER_MUSCLE_SCORES: MuscleScore[] = [];

/** Weekly reports. PLAN.md §8 #11 leaves the minimum data window open. */
export const USER_REPORTS: { latest: { week: string; prose: string } | null; archive: HistoryRow[] } = {
  latest: null,
  archive: [],
};
