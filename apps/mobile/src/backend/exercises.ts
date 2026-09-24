import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';

/** An exercise from the `exercises` collection, as a list row needs it. */
export type Exercise = {
  id: string;
  name: string;
  icon: ExerciseIconKey;
  /** The exercise type's name: Free weight, Cable, Machine. */
  type: string;
};

type ExerciseRow = Omit<Exercise, 'type'> & { main_muscle?: string; expand?: { type?: { name: string } } };

const toExercise = (r: ExerciseRow): Exercise => ({ id: r.id, name: r.name, icon: r.icon, type: r.expand?.type?.name ?? '' });

// Each category's exercises as last fetched, so a category screen can open
// with its list already in the first frame.
const byCategory = new Map<string, Exercise[]>();

/** A category's exercises from the last fetch, if there has been one. */
export function cachedExercisesIn(categoryId: string): Exercise[] | undefined {
  return byCategory.get(categoryId);
}

/**
 * Every exercise the caller can see, fetched once and filed by main muscle.
 * Called where the categories are listed, before one is opened.
 */
export async function prefetchExercises(categoryIds: readonly string[], token: string | null): Promise<void> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/exercises/records?perPage=1000&sort=name&expand=type&fields=id,name,icon,main_muscle,expand.type.name`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return;
    const { items } = (await response.json()) as { items: ExerciseRow[] };
    for (const id of categoryIds) {
      byCategory.set(
        id,
        items.filter((r) => r.main_muscle === id).map(toExercise),
      );
    }
  } catch {
    // The category screen fetches its own list; this only saves it the wait.
  }
}

/**
 * The exercises whose main muscle is this category, by name. The list rule
 * shows the catalog and the caller's own; the token is sent when there is one.
 */
export async function listExercisesIn(categoryId: string, token: string | null): Promise<Exercise[] | null> {
  const filter = encodeURIComponent(`main_muscle = "${categoryId}"`);
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/exercises/records?perPage=200&sort=name&expand=type&fields=id,name,icon,expand.type.name&filter=${filter}`,
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
