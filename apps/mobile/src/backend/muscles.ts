import { POCKETBASE_URL } from './pocketbase';
import type { ExerciseIconKey } from '../figure/figure.generated';

/**
 * The `muscle_categories` collection (`backend/migrations/*_exercise_catalog.go`):
 * the categories exercises are grouped by, in Stavros's order.
 */
export type MuscleCategory = {
  id: string;
  name: string;
  position: number;
  muscles: string[];
  icon: ExerciseIconKey;
  icon_muscles: string[];
  icon_crop: string;
};

export async function listMuscleCategories(): Promise<MuscleCategory[] | null> {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/muscle_categories/records?sort=position&perPage=50`,
    );
    if (!response.ok) return null;
    return ((await response.json()) as { items: MuscleCategory[] }).items;
  } catch {
    return null;
  }
}
