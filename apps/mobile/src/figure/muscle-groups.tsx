import { View } from 'react-native';
import {
  EXERCISE_ICONS,
  MUSCLE_REGIONS,
  type ExerciseIconKey,
} from './figure.generated';
import { Figure } from './figure';
import { tokens, useTheme } from '../theme/theme';

/**
 * The thirteen muscle groups and the icon that lights a whole group at once.
 *
 * Kept here, not in a screen. Library is programs only (PLAN.md §2), so
 * nothing renders these today — but the group definitions and the multi-muscle
 * lighting are real work that is not derivable from the generated icon set,
 * and wherever exercises end up living they are what that screen will need.
 *
 * OPEN: PLAN.md does not say where exercises live now that Library is programs
 * only. Until it does, this file has no consumer.
 */

/**
 * The muscle groups, in Stavros's order. Several are whole regions rather
 * than the single muscles the body map draws, so each one lights every muscle
 * it covers: Back is lats, traps and erectors together, Shoulders is all
 * three delt heads, Forearms carries brachialis and Abs carries obliques.
 *
 * `base` only supplies the crop and the paint order from the generated icon
 * set; the accent is rebuilt from MUSCLE_REGIONS below.
 */
export const MUSCLE_GROUPS: {
  name: string;
  base: ExerciseIconKey;
  muscles: string[];
  /** Overrides the base icon's crop when it frames the wrong thing. */
  viewBox?: string;
}[] = [
  { name: 'Chest', base: 'bench', muscles: ['Chest'] },
  { name: 'Back', base: 'row', muscles: ['Lats', 'Traps', 'Erectors'] },
  { name: 'Biceps', base: 'curl', muscles: ['Biceps'] },
  { name: 'Triceps', base: 'pushdown', muscles: ['Triceps'] },
  { name: 'Shoulders', base: 'ohp', muscles: ['Delts', 'Side delts'] },
  { name: 'Quads', base: 'squat', muscles: ['Quads'] },
  { name: 'Hamstrings', base: 'rdl', muscles: ['Hamstrings'] },
  { name: 'Adductors', base: 'adduction', muscles: ['Adductors'] },
  { name: 'Glutes', base: 'hipthrust', muscles: ['Glutes'], viewBox: '116.0 286.0 160.0 160.0' },
  { name: 'Calves', base: 'calfraise', muscles: ['Calves'] },
  // MUSCLE_REGIONS['Obliques'] runs 19 to 28, but 19 and 20 are lats and
  // 27 and 28 are hip flexors, so the obliques are named by region here
  // rather than by that entry.
  { name: 'Abs', base: 'crunch', muscles: ['Abs', '#21', '#22', '#23', '#24', '#25', '#26'] },
  { name: 'Forearms', base: 'wristcurl', muscles: ['Forearms', 'Brachialis'] },
  // Back view. Region 14 is the neck there; MUSCLE_REGIONS only maps the
  // front one, so it is named by region.
  { name: 'Neck', base: 'row', muscles: ['#14', '#49', '#50', '#51'], viewBox: '131.5 0.0 120.0 120.0' },
];

/** An icon tile that lights every muscle in the group, not just one of them. */
export function GroupIcon({
  base,
  muscles,
  size,
  viewBox,
}: {
  base: ExerciseIconKey;
  muscles: string[];
  size: number;
  viewBox?: string;
}) {
  const { c } = useTheme();
  const def = EXERCISE_ICONS[base];
  const accent = muscles.flatMap((m) => {
    // '#n' names a single figure region, for groups the muscle map splits oddly.
    if (m.startsWith('#')) return [Number(m.slice(1))];
    const region = MUSCLE_REGIONS[m];
    return region && region.view === def.view ? [...region.regions] : [];
  });
  const inner = size - 4;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.iconTile.radiusAbove56,
        backgroundColor: c.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Figure
        view={def.view}
        viewBox={viewBox ?? def.viewBox}
        paint={def.paint}
        accent={accent}
        width={inner}
        height={inner}
        strokeWidth={def.strokeWidth}
      />
    </View>
  );
}
