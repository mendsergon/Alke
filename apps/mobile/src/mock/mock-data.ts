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
 *
 * Still transcribed, and still marked mock, are MOCK_SESSION, MOCK_WEEKLY_REPORT
 * and the join-gym values: the session, report and join screens are outside
 * this pass and are untouched.
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

export type ProgramRow = {
  name: string;
  status: 'Active' | 'Forked' | 'Draft' | 'Saved';
  detail: string;
  done: number;
  target: number;
};

export type ExerciseRow = { name: string; detail: string; icon: ExerciseIconKey };

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

/** A template the app ships. No author, no save count — it is not shared content. */
export type Template = {
  id: string;
  name: string;
  daysPerWeek: number;
  weekLength: number;
  /** What the split is, in the user's words. */
  focus: string;
  chips: string[];
  /** Index into FIGURE_STRIPS. */
  strip: number;
};

export type SessionSet = {
  index: number;
  state: 'done' | 'current' | 'empty';
  weight: string;
  reps: string;
  rir: string;
  fill: number;
  target: number;
  record?: boolean;
};

export type HistoryRow = {
  name: string;
  detail: string;
  done: number;
  target: number;
  record?: boolean;
};

export type MuscleScore = { muscle: string; score: number };

export type Recommendation = {
  muscle: string;
  verdict: 'more' | 'keep' | 'less';
  reason: string;
};

export type RecordByReps = { range: string; weight: string; reps: string; date: string };

// ===========================================================================
// CATALOG — real content, shipped with the app
// ===========================================================================

/**
 * The exercise table: movement, the muscle it trains and the equipment it
 * needs. PLAN.md §1.1 calls this the single most important data asset. This is
 * the first slice of it; the full table and its boolean equipment expressions
 * are a later job.
 */
export const EXERCISE_CATALOG: ExerciseRow[] = [
  { name: 'Barbell Back Squat', detail: 'Quads · barbell', icon: 'squat' },
  { name: 'Romanian Deadlift', detail: 'Hamstrings · barbell', icon: 'rdl' },
  { name: 'Barbell Row', detail: 'Lats · barbell', icon: 'row' },
  { name: 'Bench Press', detail: 'Chest · barbell', icon: 'bench' },
  { name: 'Overhead Press', detail: 'Front delts · barbell', icon: 'ohp' },
  { name: 'Dumbbell Lateral Raise', detail: 'Side delts · dumbbell', icon: 'lateral' },
  { name: 'Face Pull', detail: 'Rear delts · cable', icon: 'facepull' },
  { name: 'Barbell Curl', detail: 'Biceps · barbell', icon: 'curl' },
  { name: 'Triceps Pushdown', detail: 'Triceps · cable', icon: 'pushdown' },
  { name: 'Hip Thrust', detail: 'Glutes · barbell', icon: 'hipthrust' },
  { name: 'Standing Calf Raise', detail: 'Calves · machine', icon: 'calfraise' },
  { name: 'Back Extension', detail: 'Erectors · bodyweight', icon: 'backext' },
];

/**
 * Starter templates. Structure only — days, split, level. No author and no
 * save count, because nobody has shared anything.
 *
 * OPEN: which templates actually ship is a product decision PLAN.md does not
 * fix. These three describe common structures and are placeholders for it.
 */
export const FEATURED_TEMPLATES: Template[] = [
  {
    id: 'full-body-3',
    name: 'Full Body Three',
    daysPerWeek: 3,
    weekLength: 7,
    focus: 'Full body, three days a week',
    chips: ['beginner', 'barbell'],
    strip: 1,
  },
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower Four',
    daysPerWeek: 4,
    weekLength: 7,
    focus: 'Upper and lower, alternating',
    chips: ['intermediate', 'barbell'],
    strip: 0,
  },
  {
    id: 'push-pull-legs-6',
    name: 'Push Pull Legs Six',
    daysPerWeek: 6,
    weekLength: 7,
    focus: 'Push, pull, legs, twice over',
    chips: ['advanced', 'machines'],
    strip: 2,
  },
];

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

/** Programs the person has added from a template. Empty until they add one. */
export const USER_PROGRAMS: ProgramRow[] = [];

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

// ===========================================================================
// Untouched by this pass: the session, report and join-gym screens
// ===========================================================================

/** Read only by the join-gym screen, which is outside this pass. */
export const MOCK_GYM: Gym = {
  name: 'Northgate Strength Hall',
  shortName: 'Northgate',
  place: 'Dover Row',
  members: 142,
  machines: 34,
};

export const MOCK_GYM_EQUIPMENT = [
  '4 power racks',
  'Deadlift platform',
  '6 adjustable benches',
  'Cable crossover',
  'Trap bar',
  'Dumbbells to 50 kg',
];

export const MOCK_GYM_CODE = 'NGH7';

export const MOCK_SESSION = {
  position: 'Exercise 2 of 5',
  exercise: 'Barbell Back Squat',
  icon: 'squat' as ExerciseIconKey,
  last: 'Last · 100 × 8  ·  100 × 7  ·  95 × 8',
  restLeft: '1:42',
  restOf: 'rest of 2:30',
  restDone: 31,
  restTarget: 100,
  miniBar: { exercise: 'Barbell Back Squat', detail: 'Set 3 of 4 · exercise 2 of 5', timer: '1:42' },
  sets: [
    { index: 1, state: 'done', weight: '100', reps: '8', rir: '2', fill: 68, target: 100 },
    { index: 2, state: 'done', weight: '100', reps: '8', rir: '2', fill: 68, target: 100 },
    { index: 3, state: 'current', weight: '102.5', reps: '6', rir: '1', fill: 74, target: 100, record: true },
    { index: 4, state: 'empty', weight: '—', reps: '—', rir: '—', fill: 0, target: 100 },
  ] satisfies SessionSet[],
};

export const MOCK_WEEKLY_REPORT = {
  week: 'Week 38',
  dates: '13 – 19 September',
  prose:
    'Four sessions, seventy-nine of the eighty-four sets you planned. Squat and press both moved up a step. Two groups came in under range — the two you cut when a session runs long.',
  recommendations: [
    { muscle: 'Hamstrings', verdict: 'more', reason: '6 sets against a range of 8 to 14.' },
    { muscle: 'Rear delts', verdict: 'more', reason: '5 sets. Rowing carryover is not enough.' },
    { muscle: 'Lats', verdict: 'keep', reason: '19 sets, top of range, e1RM rising.' },
    { muscle: 'Side delts', verdict: 'less', reason: '16 direct sets plus pressing carryover.' },
  ] satisfies Recommendation[],
};
