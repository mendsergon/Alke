import { POCKETBASE_URL } from "./pocketbase";
import type { ExerciseIconKey } from "../figure/figure.generated";
import { iconForMuscle } from "../figure/figure";

/** A weight exercise from its category's collection, as a list row needs it. */
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

type ExerciseRow = Omit<Exercise, "icon" | "type" | "main" | "secondary"> & {
  /** The chosen muscle's name; absent where the category has one muscle. */
  main_muscle?: string;
  expand?: {
    type?: { name: string };
    secondary_muscles?: { figure: string }[];
  };
};

type MuscleRow = { name: string; figure: string };

// The main muscle is one of the category's own: the one chosen by name, or
// the category's only muscle.
const toExercise = (r: ExerciseRow, muscles: MuscleRow[]): Exercise => {
  const main =
    (r.main_muscle
      ? muscles.find((m) => m.name === r.main_muscle)
      : muscles.length === 1
        ? muscles[0]
        : undefined
    )?.figure ?? "";
  return {
    id: r.id,
    name: r.name,
    icon: iconForMuscle(main),
    type: r.expand?.type?.name ?? "",
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
  return `weights_${category.toLowerCase().replace(/ /g, "_")}`;
}

const FIELDS =
  "expand=type,secondary_muscles&fields=id,name,main_muscle,expand.type.name,expand.secondary_muscles.figure";

async function fetchWeights(
  category: { id: string; name: string },
  token: string | null,
): Promise<Exercise[] | null> {
  try {
    const headers: Record<string, string> = token
      ? { Authorization: token }
      : {};
    const [exercises, muscles] = await Promise.all([
      fetch(
        `${POCKETBASE_URL}/api/collections/${weightsCollection(category.name)}/records?perPage=500&sort=name&${FIELDS}`,
        { headers },
      ),
      fetch(
        `${POCKETBASE_URL}/api/collections/muscles/records?perPage=500&sort=position&filter=${encodeURIComponent(`category="${category.id}"`)}&fields=name,figure`,
        { headers },
      ),
    ]);
    if (!exercises.ok || !muscles.ok) return null;
    const { items } = (await exercises.json()) as { items: ExerciseRow[] };
    const { items: own } = (await muscles.json()) as { items: MuscleRow[] };
    return items.map((r) => toExercise(r, own));
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
 * A category's weight exercises, by name. The list rule shows the catalog and
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
