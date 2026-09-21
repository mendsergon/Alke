import { describe, expect, it } from 'vitest';
import {
  bestE1rm,
  bestRepsAtWeight,
  e1rm,
  effectiveReps,
  isE1rmRecord,
  recordsByRepRange,
  weeklyVolume,
  type DatedSet,
  type Exercise,
  type LoggedSet,
} from '../src';

const squat: Exercise = {
  id: 'squat',
  name: 'Barbell Back Squat',
  primary: ['Quads'],
  secondary: ['Glutes', 'Hamstrings'],
};
const row: Exercise = { id: 'row', name: 'Row', primary: ['Lats'], secondary: ['Biceps'] };
const catalog = new Map([squat, row].map((e) => [e.id, e]));

const set = (over: Partial<LoggedSet> = {}): LoggedSet => ({
  exerciseId: 'squat',
  weight: 100,
  reps: 5,
  type: 'working',
  ...over,
});
const dated = (over: Partial<DatedSet> = {}): DatedSet => ({ ...set(), at: '2026-09-01', ...over });

describe('e1RM', () => {
  it('uses Epley', () => {
    // 100 · (1 + 5/30) = 116.666…
    expect(e1rm({ weight: 100, reps: 5 })).toBeCloseTo(116.667, 3);
  });

  it('uses Brzycki', () => {
    // 100 · 36/(37 − 5) = 112.5
    expect(e1rm({ weight: 100, reps: 5 }, 'brzycki')).toBeCloseTo(112.5, 5);
  });

  it('adds RIR to reps', () => {
    expect(effectiveReps(5, 2)).toBe(7);
    expect(e1rm({ weight: 100, reps: 5, rir: 2 })).toBeCloseTo(e1rm({ weight: 100, reps: 7 })!, 9);
  });

  it('gives nothing above the high-rep cap', () => {
    expect(e1rm({ weight: 60, reps: 20 })).toBeNull();
    // RIR pushes effective reps over the cap too.
    expect(e1rm({ weight: 60, reps: 11, rir: 4 })).toBeNull();
  });

  it('rejects empty sets', () => {
    expect(e1rm({ weight: 0, reps: 5 })).toBeNull();
    expect(e1rm({ weight: 100, reps: 0 })).toBeNull();
  });
});

describe('weekly volume', () => {
  it('counts 1.0 primary and 0.5 secondary', () => {
    const v = weeklyVolume([set(), set()], catalog);
    expect(v.get('Quads')).toBe(2);
    expect(v.get('Glutes')).toBe(1);
    expect(v.get('Hamstrings')).toBe(1);
  });

  it('excludes warm-ups', () => {
    const v = weeklyVolume([set({ type: 'warmup' }), set()], catalog);
    expect(v.get('Quads')).toBe(1);
  });

  it('adds across exercises', () => {
    const v = weeklyVolume([set(), set({ exerciseId: 'row' })], catalog);
    expect(v.get('Quads')).toBe(1);
    expect(v.get('Lats')).toBe(1);
    expect(v.get('Biceps')).toBe(0.5);
  });

  it('ignores an exercise missing from the catalog', () => {
    expect(weeklyVolume([set({ exerciseId: 'ghost' })], catalog).size).toBe(0);
  });
});

describe('records', () => {
  const history: DatedSet[] = [
    dated({ weight: 100, reps: 5, at: '2026-09-01' }),
    dated({ weight: 105, reps: 3, at: '2026-09-08' }),
    dated({ weight: 90, reps: 8, at: '2026-09-15' }),
    dated({ weight: 200, reps: 5, at: '2026-09-15', type: 'warmup' }),
  ];

  it('finds the best e1RM and ignores warm-ups', () => {
    // 100x5 = 116.67 beats 105x3 = 115.5 and 90x8 = 114; the 200 is a warm-up.
    const best = bestE1rm(history);
    expect(best?.set.weight).toBe(100);
    expect(best?.value).toBeCloseTo(116.667, 3);
  });

  it('records the heaviest weight per rep range', () => {
    const byRange = recordsByRepRange(history);
    expect(byRange.find((r) => r.range === '1–3')?.weight).toBe(105);
    expect(byRange.find((r) => r.range === '4–6')?.weight).toBe(100);
    expect(byRange.find((r) => r.range === '7–10')?.weight).toBe(90);
    expect(byRange.find((r) => r.range === '11–15')).toBeUndefined();
  });

  it('finds the most reps at a weight', () => {
    expect(bestRepsAtWeight(history, 100)).toBe(5);
    expect(bestRepsAtWeight(history, 200)).toBe(0);
  });

  it('spots a new e1RM record', () => {
    expect(isE1rmRecord(dated({ weight: 110, reps: 5 }), history)).toBe(true);
    expect(isE1rmRecord(dated({ weight: 80, reps: 5 }), history)).toBe(false);
    expect(isE1rmRecord(dated({ weight: 300, reps: 5, type: 'warmup' }), history)).toBe(false);
  });

  it('treats an empty history as a record', () => {
    expect(isE1rmRecord(dated(), [])).toBe(true);
  });
});
