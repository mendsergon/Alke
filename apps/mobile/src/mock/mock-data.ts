/**
 * MOCK DATA — NOT PRODUCT CONTENT, NOT SEED DATA.
 *
 * Every value here is transcribed from the design exports in `design/`, which
 * PLAN.md says still carry the placeholder name "Rungs" and placeholder copy,
 * numbers, names and volume ranges. PLAN.md §1.5 is explicit that the
 * high-volume set counts shown in the mocks contradict Alke's low-volume,
 * high-effort defaults and must never become defaults or seed data.
 *
 * Nothing outside src/mock may import anything but the types.
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

// --- the user's gym --------------------------------------------------------
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

// --- home ------------------------------------------------------------------
/**
 * Which of the three Home states (PLAN.md §2) the app shows. The design
 * exports draw all three; flip this to look at the other two.
 */
export const MOCK_HOME_STATE: 'training' | 'rest' | 'no-program' = 'rest';

export const MOCK_TODAY = 'Saturday 19 September';
export const MOCK_REST_DAY = 'Sunday 20 September';

export const MOCK_NEXT_SESSION: SessionPlan = {
  program: 'Foundation Four',
  where: 'Week 3 · Day 2 — Lower',
  chips: ['5 exercises', '18 sets', '≈ 52 min'],
};

export const MOCK_WEEK: WeekStat[] = [
  { label: 'Sessions', value: '3', suffix: 'of 4', done: 75, target: 100 },
  { label: 'Sets', value: '47', suffix: 'this week', done: 62, target: 100 },
  { label: 'Muscles in range', value: '11', suffix: 'of 21', done: 52, target: 100 },
];

export const MOCK_REPORT_TEASER: ReportTeaser = {
  eyebrow: 'New report',
  week: 'Week 38',
  line: '79 of 84 sets · two groups under range',
};

export const MOCK_CHECK_IN = ['Sleep', 'Fatigue', 'Stress', 'Sore', 'Mood'];

export const MOCK_NEXT_AFTER_REST = {
  title: 'Monday — Upper',
  detail: 'Foundation Four · Week 3 · Day 3',
};

export const MOCK_STARTING_POINTS = [
  { name: 'Foundation Four', detail: '4 days · full body · beginner' },
  { name: 'Upper / Lower Six', detail: '6 days · split · intermediate' },
];

// --- explore ---------------------------------------------------------------
export const MOCK_EXPLORE_FILTERS = ['Featured', 'Strength', 'Hypertrophy', '3 day'];

export const MOCK_SHARED_PROGRAMS: SharedProgram[] = [
  {
    name: 'Bridge to Five',
    by: 'by M. Alaric',
    featured: true,
    daysPerWeek: 5,
    weekLength: 7,
    chips: ['12 weeks', 'intermediate', 'barbell'],
    saves: '2,140 saved',
    strip: 0,
  },
  {
    name: 'Northgate Novice',
    by: 'Coach Rey · 8 weeks',
    daysPerWeek: 3,
    weekLength: 7,
    chips: ['novice', 'barbell'],
    saves: '312 saved',
    strip: 1,
  },
  {
    name: 'Hall Hypertrophy',
    by: 'S. Okonkwo · 12 weeks',
    daysPerWeek: 5,
    weekLength: 7,
    chips: ['hypertrophy', 'machines'],
    saves: '884 saved',
    strip: 2,
  },
];

// --- library ---------------------------------------------------------------
export const MOCK_PROGRAMS: ProgramRow[] = [
  { name: 'Foundation Four', status: 'Active', detail: 'Week 3 of 12 · 4 days', done: 25, target: 100 },
  {
    name: 'Bridge to Five',
    status: 'Forked',
    detail: 'Week 9 of 12 · forked from M. Alaric',
    done: 75,
    target: 100,
  },
  { name: 'Deload Week', status: 'Draft', detail: 'Not started · 3 days', done: 0, target: 100 },
  {
    name: 'Northgate Novice',
    status: 'Saved',
    detail: 'Week 8 of 8 · finished 4 Sep',
    done: 100,
    target: 100,
  },
];

export const MOCK_EXERCISE_COUNT = '248 · 6 custom';

export const MOCK_EXERCISES: ExerciseRow[] = [
  { name: 'Barbell Back Squat', detail: 'Quads · barbell · 42 sessions', icon: 'squat' },
  { name: 'Romanian Deadlift', detail: 'Hamstrings · barbell · 18 sessions', icon: 'rdl' },
  { name: 'Kroc Row (custom)', detail: 'Lats · dumbbell · 9 sessions', icon: 'row' },
  { name: 'Dumbbell Lateral Raise', detail: 'Side delts · dumbbell · 27 sessions', icon: 'lateral' },
];

// --- the live session ------------------------------------------------------
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

// --- progress --------------------------------------------------------------
/** Strength relative to the user, 0 to 1, per muscle. Drives the body map. */
export const MOCK_MUSCLE_SCORES: MuscleScore[] = [
  { muscle: 'Lats', score: 0.96 },
  { muscle: 'Quads', score: 0.88 },
  { muscle: 'Side delts', score: 0.84 },
  { muscle: 'Chest', score: 0.77 },
  { muscle: 'Traps', score: 0.74 },
  { muscle: 'Hamstrings', score: 0.7 },
  { muscle: 'Glutes', score: 0.66 },
  { muscle: 'Erectors', score: 0.62 },
  { muscle: 'Triceps', score: 0.58 },
  { muscle: 'Biceps', score: 0.54 },
  { muscle: 'Delts', score: 0.5 },
  { muscle: 'Abs', score: 0.46 },
  { muscle: 'Obliques', score: 0.42 },
  { muscle: 'Rear delts', score: 0.38 },
  { muscle: 'Calves', score: 0.34 },
  { muscle: 'Forearms', score: 0.3 },
  { muscle: 'Brachialis', score: 0.26 },
  { muscle: 'Adductors', score: 0.22 },
  { muscle: 'Neck', score: 0.18 },
];

export const MOCK_TOP_MUSCLES = [
  { muscle: 'Lats', score: 96 },
  { muscle: 'Quads', score: 88 },
  { muscle: 'Side delts', score: 84 },
  { muscle: 'Mid chest', score: 77 },
];

export const MOCK_EXERCISE_DETAIL = {
  name: 'Back Squat',
  subtitle: 'Estimated 1RM · Epley',
  icon: 'squat' as ExerciseIconKey,
  e1rm: '150.0',
  unit: 'kg',
  delta: '+7.5',
  deltaWindow: 'in 8 weeks',
  ranges: ['8 w', '6 mo', '1 y', 'All'],
  activeRange: '6 mo',
  chart: {
    axis: [130, 140, 150],
    values: [130, 132.5, 131, 135, 137.5, 136, 140, 142.5, 141, 145, 147.5, 150],
    records: [1, 4, 7, 10, 11],
    months: ['Apr', 'Jun', 'Sep'],
    peak: '150 kg — PR',
  },
  records: [
    { range: '1–3', weight: '150', reps: '3', date: '12 Sep' },
    { range: '4–6', weight: '137.5', reps: '5', date: '29 Aug' },
    { range: '7–10', weight: '122.5', reps: '9', date: '5 Sep' },
  ] satisfies RecordByReps[],
};

export const MOCK_HISTORY: HistoryRow[] = [
  { name: 'Foundation Four · Lower', detail: 'Thu 18 Sep · 18 of 18 sets · 7.4 t', done: 100, target: 100, record: true },
  { name: 'Foundation Four · Upper', detail: 'Tue 16 Sep · 16 of 18 sets · 5.9 t', done: 89, target: 100 },
  { name: 'Empty workout', detail: 'Sun 14 Sep · 9 of 9 sets · 2.8 t', done: 100, target: 100 },
  { name: 'Foundation Four · Lower', detail: 'Fri 12 Sep · 18 of 20 sets · 7.1 t', done: 90, target: 100, record: true },
  { name: 'Foundation Four · Upper', detail: 'Wed 10 Sep · 16 of 18 sets · 5.6 t', done: 89, target: 100 },
];

export const MOCK_REPORTS = {
  latest: {
    week: 'Week 38',
    prose:
      'Four sessions, seventy-nine of the eighty-four sets you planned. Squat and press both moved up a step.',
  },
  archive: [
    { week: 'Week 37', detail: '6 – 12 September · 84 of 84 sets', done: 100, target: 100 },
    { week: 'Week 36', detail: '30 Aug – 5 September · 71 of 84 sets', done: 85, target: 100 },
    { week: 'Week 35', detail: '23 – 29 August · 80 of 84 sets', done: 95, target: 100 },
  ],
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

// --- profile ---------------------------------------------------------------
export const MOCK_PROFILE = {
  initials: 'SK',
  name: 'Stavros K.',
  detail: '412 sessions · since Mar 2024',
  memberships: { count: '2 memberships', detail: 'Northgate · Lamia Barbell Club' },
  subscription: { name: 'Alke Pro', detail: 'Per-muscle breakdown · gym owner tools' },
  settings: [
    { name: 'Units and plates', detail: 'Kilograms · 2.5 kg increment' },
    { name: 'Notifications', detail: 'Rest timer, weekly report' },
    { name: 'Export and privacy', detail: 'Download everything you have logged' },
  ],
};
