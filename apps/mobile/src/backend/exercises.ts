import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';

/** An exercise from the `exercises` collection, as a list row needs it. */
export type Exercise = {
  id: string;
  name: string;
  icon: ExerciseIconKey;
};

/**
 * The exercises whose main muscle is this category, by name. The list rule
 * shows the catalog and the caller's own; the token is sent when there is one.
 */
export async function listExercisesIn(categoryId: string, token: string | null): Promise<Exercise[] | null> {
  const filter = encodeURIComponent(`main_muscle = "${categoryId}"`);
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/exercises/records?perPage=200&sort=name&fields=id,name,icon&filter=${filter}`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return null;
    return ((await response.json()) as { items: Exercise[] }).items;
  } catch {
    return null;
  }
}
