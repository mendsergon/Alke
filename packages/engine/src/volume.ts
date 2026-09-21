/**
 * Weekly volume by fractional set counting. PLAN.md §1.4: a set counts 1.0
 * for a primary muscle and 0.5 for a secondary (Pelland et al. 2024).
 * Warm-ups are excluded from every metric (§1.3).
 */
export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

export type LoggedSet = {
  exerciseId: string;
  weight: number;
  reps: number;
  rir?: number;
  type: SetType;
};

export type Exercise = {
  id: string;
  name: string;
  /** Muscles this movement trains, and how much of a set each one gets. */
  primary: string[];
  secondary: string[];
};

export function countsTowardVolume(set: LoggedSet): boolean {
  return set.type !== 'warmup';
}

/** Fractional sets per muscle over the sets given. */
export function weeklyVolume(
  sets: readonly LoggedSet[],
  exercises: ReadonlyMap<string, Exercise>,
): Map<string, number> {
  const out = new Map<string, number>();
  const add = (muscle: string, amount: number) => {
    out.set(muscle, (out.get(muscle) ?? 0) + amount);
  };
  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const ex = exercises.get(set.exerciseId);
    if (!ex) continue;
    for (const m of ex.primary) add(m, 1);
    for (const m of ex.secondary) add(m, 0.5);
  }
  return out;
}
