import { View } from 'react-native';
import { EXERCISE_ICONS, MUSCLE_REGIONS, type ExerciseIconKey } from './figure.generated';
import { Figure } from './figure';
import { tokens, useTheme } from '../theme/theme';

/** An icon tile that lights every muscle in the group, not just one of them. */
export function GroupIcon({
  base,
  muscles,
  size,
  viewBox,
  seamAll = false,
}: {
  base: ExerciseIconKey;
  muscles: string[];
  size: number;
  viewBox?: string;
  /** Every muscle seamed and visible, the way Progress draws the body. */
  seamAll?: boolean;
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
        seamAll={seamAll}
      />
    </View>
  );
}
