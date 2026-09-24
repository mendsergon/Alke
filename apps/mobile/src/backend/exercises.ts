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

type ExerciseRow = Omit<Exercise, 'type'> & { expand?: { type?: { name: string } } };

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
    return items.map((r) => ({ id: r.id, name: r.name, icon: r.icon, type: r.expand?.type?.name ?? '' }));
  } catch {
    return null;
  }
}
