import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';
import { iconForMuscle } from '../figure/figure';

/** An exercise from the `exercises` collection, as a list row needs it. */
export type Exercise = {
  id: string;
  name: string;
  /** The icon drawn for its main muscle; none when that muscle has no icon. */
  icon: ExerciseIconKey | undefined;
  /** The exercise type's name: Free weight, Cable, Machine. */
  type: string;
  /** Its main muscle, by the name the body figure uses. */
  main: string;
  /** Its secondary muscles, by the names the body figure uses. */
  secondary: string[];
};

type ExerciseRow = Omit<Exercise, 'icon' | 'type' | 'main' | 'secondary'> & {
  expand?: {
    type?: { name: string };
    main_muscle?: { figure: string };
    secondary_muscles?: { figure: string }[];
  };
};

const toExercise = (r: ExerciseRow): Exercise => ({
  id: r.id,
  name: r.name,
  icon: iconForMuscle(r.expand?.main_muscle?.figure ?? ''),
  type: r.expand?.type?.name ?? '',
  main: r.expand?.main_muscle?.figure ?? '',
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
 * The collection a category's weight exercises live in: weights_ and the
 * category's name, lower case, spaces as underscores (weights_chest, …).
 */
export function weightsCollection(category: string): string {
  return `weights_${category.toLowerCase().replace(/ /g, '_')}`;
}

const FIELDS =
  'expand=type,main_muscle,secondary_muscles&fields=id,name,expand.type.name,expand.main_muscle.figure,expand.secondary_muscles.figure';

async function fetchWeights(category: string, token: string | null): Promise<Exercise[] | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/${weightsCollection(category)}/records?perPage=500&sort=name&${FIELDS}`,
      { headers: token ? { Authorization: token } : {} },
    );
    if (!response.ok) return null;
    const { items } = (await response.json()) as { items: ExerciseRow[] };
    return items.map(toExercise);
  } catch {
    return null;
  }
}

/**
 * Every category's weight exercises, fetched together and filed by category.
 * Called where the categories are listed, before one is opened.
 */
export async function prefetchExercises(
  categories: readonly { id: string; name: string }[],
  token: string | null,
): Promise<void> {
  await Promise.all(
    categories.map(async (c) => {
      const exercises = await fetchWeights(c.name, token);
      // The category screen fetches its own list; this only saves it the wait.
      if (exercises) byCategory.set(c.id, exercises);
    }),
  );
}

/**
 * A category's weight exercises, by name. The list rule shows the catalog and
 * the caller's own; the token is sent when there is one.
 */
export async function listExercisesIn(
  category: { id: string; name: string },
  token: string | null,
): Promise<Exercise[] | null> {
  const exercises = await fetchWeights(category.name, token);
  if (exercises) byCategory.set(category.id, exercises);
  return exercises;
}
