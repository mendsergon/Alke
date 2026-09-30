import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';
import { iconForMuscle } from '../figure/figure';

/** A weight exercise from its category's collection, as a list row needs it. */
export type Exercise = {
  id: string;
  name: string;
  /** The icon drawn for its main muscles; none when they have no icon. */
  icon: ExerciseIconKey | undefined;
  /** The exercise type's name: Free weight, Cable, Machine. */
  type: string;
  /** Its main muscles, by the names the body figure uses. */
  main: readonly string[];
  /** Its secondary muscles, by the names the body figure uses. */
  secondary: string[];
};

type ExerciseRow = {
  id: string;
  name: string;
  /** The chosen muscle's name, where the category offers one choice. */
  main_muscle?: string;
  expand?: {
    type?: { name: string };
    secondary_muscles?: { figure: string }[];
  };
  /** A checkbox per muscle, where the category ticks its main muscles. */
  [checkbox: string]: unknown;
};

type MuscleRow = { name: string; figure: string };

/** A muscle's checkbox: its name, lower case, spaces as underscores. */
const checkbox = (muscle: string) => muscle.toLowerCase().replace(/ /g, '_');

// The main muscles are the category's own: the one chosen by name, every one
// whose checkbox is ticked, or the category's only muscle.
const toExercise = (r: ExerciseRow, muscles: MuscleRow[]): Exercise => {
  const main = (
    r.main_muscle
      ? muscles.filter((m) => m.name === r.main_muscle)
      : muscles.length === 1
        ? muscles
        : muscles.filter((m) => r[checkbox(m.name)] === true)
  ).map((m) => m.figure);
  return {
    id: r.id,
    name: r.name,
    icon: main[0] === undefined ? undefined : iconForMuscle(main[0]),
    type: r.expand?.type?.name ?? '',
    main,
    secondary: (r.expand?.secondary_muscles ?? []).map((m) => m.figure),
  };
};

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

// Every field of the exercise itself, since a category's checkboxes are named
// after its muscles; of the related records only what a row draws.
const FIELDS = 'expand=type,secondary_muscles&fields=*,expand.type.name,expand.secondary_muscles.figure';

async function fetchWeights(category: { id: string; name: string }, token: string | null): Promise<Exercise[] | null> {
  try {
    const headers: Record<string, string> = token ? { Authorization: token } : {};
    const own = encodeURIComponent(`category="${category.id}"`);
    const [exercises, muscles] = await Promise.all([
      fetch(
        `${POCKETBASE_URL}/api/collections/${weightsCollection(category.name)}/records?perPage=500&sort=created&${FIELDS}`,
        { headers },
      ),
      fetch(`${POCKETBASE_URL}/api/collections/muscles/records?perPage=500&sort=position&filter=${own}&fields=name,figure`, {
        headers,
      }),
    ]);
    if (!exercises.ok || !muscles.ok) return null;
    const { items } = (await exercises.json()) as { items: ExerciseRow[] };
    const { items: theirs } = (await muscles.json()) as { items: MuscleRow[] };
    return items.map((r) => toExercise(r, theirs));
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
      const exercises = await fetchWeights(c, token);
      // The category screen fetches its own list; this only saves it the wait.
      if (exercises) byCategory.set(c.id, exercises);
    }),
  );
}

/**
 * A category's weight exercises, oldest added first. The list rule shows the catalog and
 * the caller's own; the token is sent when there is one.
 */
export async function listExercisesIn(
  category: { id: string; name: string },
  token: string | null,
): Promise<Exercise[] | null> {
  const exercises = await fetchWeights(category, token);
  if (exercises) byCategory.set(category.id, exercises);
  return exercises;
}
