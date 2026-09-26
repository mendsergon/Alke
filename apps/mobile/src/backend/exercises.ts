import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';

/** An exercise from the `exercises` collection, as a list row needs it. */
export type Exercise = {
  id: string;
  name: string;
  icon: ExerciseIconKey;
  /** The exercise type's name: Free weight, Cable, Machine. */
  type: string;
  /** Its secondary muscles, by the names the body figure uses. */
  secondary: string[];
};

type ExerciseRow = Omit<Exercise, 'type' | 'secondary'> & {
  expand?: {
    type?: { name: string };
    main_muscle?: { category: string };
    secondary_muscles?: { figure: string }[];
  };
};

const toExercise = (r: ExerciseRow): Exercise => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  type: r.expand?.type?.name ?? '',
  secondary: (r.expand?.secondary_muscles ?? []).map((m) => m.figure),
});

// Each category's exercises as last fetched, so a category screen can open
// with its list already in the first frame.
const byCategory = new Map<string, Exercise[]>();

/** A category's exercises from the last fetch, if there has been one. */
export function cachedExercisesIn(categoryId: string): Exercise[] | undefined {
  return byCategory.get(categoryId);
}

/**
 * Every exercise the caller can see, fetched once and filed by the category its
 * main muscle belongs to.
 * Called where the categories are listed, before one is opened.
 */
export async function prefetchExercises(categoryIds: readonly string[], token: string | null): Promise<void> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/exercises/records?perPage=1000&sort=name&expand=type,main_muscle,secondary_muscles&fields=id,name,icon,expand.type.name,expand.main_muscle.category,expand.secondary_muscles.figure`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return;
    const { items } = (await response.json()) as { items: ExerciseRow[] };
    for (const id of categoryIds) {
      byCategory.set(
        id,
        items.filter((r) => r.expand?.main_muscle?.category === id).map(toExercise),
      );
    }
  } catch {
    // The category screen fetches its own list; this only saves it the wait.
  }
}

/**
 * The exercises whose main muscle belongs to this category, by name. The list rule
 * shows the catalog and the caller's own; the token is sent when there is one.
 */
export async function listExercisesIn(categoryId: string, token: string | null): Promise<Exercise[] | null> {
  const filter = encodeURIComponent(`main_muscle.category = "${categoryId}"`);
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/exercises/records?perPage=200&sort=name&expand=type,secondary_muscles&fields=id,name,icon,expand.type.name,expand.secondary_muscles.figure&filter=${filter}`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return null;
    const { items } = (await response.json()) as { items: ExerciseRow[] };
    const exercises = items.map(toExercise);
    byCategory.set(categoryId, exercises);
    return exercises;
  } catch {
    return null;
  }
}
