/**
 * Personal records. PLAN.md §1.4: by e1RM, by reps at a given weight, and by
 * weight per rep range. Warm-ups never set a record (§1.3).
 */
import { e1rm, type Formula } from './e1rm';
import { countsTowardVolume, type LoggedSet } from './volume';

export type DatedSet = LoggedSet & { at: string };

export type RepRange = { label: string; min: number; max: number };

/** The ranges the export draws on the exercise screen. */
export const REP_RANGES: RepRange[] = [
  { label: '1–3', min: 1, max: 3 },
  { label: '4–6', min: 4, max: 6 },
  { label: '7–10', min: 7, max: 10 },
  { label: '11–15', min: 11, max: 15 },
];

export type RecordByRange = {
  range: string;
  weight: number;
  reps: number;
  at: string;
};

/** The best e1RM over the sets given, with the set that produced it. */
export function bestE1rm(
  sets: readonly DatedSet[],
  formula: Formula = 'epley',
): { value: number; set: DatedSet } | null {
  let best: { value: number; set: DatedSet } | null = null;
  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const value = e1rm(set, formula);
    if (value === null) continue;
    if (!best || value > best.value) best = { value, set };
  }
  return best;
}

/** Heaviest weight lifted in each rep range, and when. */
export function recordsByRepRange(
  sets: readonly DatedSet[],
  ranges: readonly RepRange[] = REP_RANGES,
): RecordByRange[] {
  const out: RecordByRange[] = [];
  for (const range of ranges) {
    let best: DatedSet | null = null;
    for (const set of sets) {
      if (!countsTowardVolume(set)) continue;
      if (set.reps < range.min || set.reps > range.max) continue;
      if (!best || set.weight > best.weight) best = set;
    }
    if (best) out.push({ range: range.label, weight: best.weight, reps: best.reps, at: best.at });
  }
  return out;
}

/** Most reps ever done at a given weight. */
export function bestRepsAtWeight(sets: readonly DatedSet[], weight: number): number {
  let best = 0;
  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    if (set.weight !== weight) continue;
    if (set.reps > best) best = set.reps;
  }
  return best;
}

/** True when this set beats every earlier set's e1RM. */
export function isE1rmRecord(
  candidate: DatedSet,
  earlier: readonly DatedSet[],
  formula: Formula = 'epley',
): boolean {
  const value = e1rm(candidate, formula);
  if (value === null || !countsTowardVolume(candidate)) return false;
  const previous = bestE1rm(earlier, formula);
  return previous === null || value > previous.value;
}
