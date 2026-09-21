/**
 * Estimated one-rep max. PLAN.md §1.4.
 *
 *   Epley    w · (1 + r/30)
 *   Brzycki  w · 36/(37 − r)
 *
 * When RIR is logged the effective reps are reps + RIR, because a set left
 * two in the tank is the same stimulus as a set of reps + 2 taken to failure.
 */
export type Formula = 'epley' | 'brzycki';

/**
 * OPEN (PLAN.md §8 #10): the rep cap above which a set yields no e1RM.
 * 12 is a placeholder and is not a decision. Stavros sets the real value.
 */
export const HIGH_REP_CAP_OPEN = 12;

export function effectiveReps(reps: number, rir?: number): number {
  return reps + (rir ?? 0);
}

export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function brzycki(weight: number, reps: number): number {
  // The formula diverges as reps approach 37; the cap keeps it far away.
  return (weight * 36) / (37 - reps);
}

/**
 * The e1RM of one set, or null when the set is above the high-rep cap and
 * the estimate would not be trustworthy.
 */
export function e1rm(
  { weight, reps, rir }: { weight: number; reps: number; rir?: number },
  formula: Formula = 'epley',
  cap: number = HIGH_REP_CAP_OPEN,
): number | null {
  if (weight <= 0 || reps <= 0) return null;
  const r = effectiveReps(reps, rir);
  if (r > cap) return null;
  return formula === 'epley' ? epley(weight, r) : brzycki(weight, r);
}
