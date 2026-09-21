import { useRef } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import {
  EXERCISE_ICONS,
  FIGURE,
  REGION_TRANSLATE,
  type ExerciseIconKey,
  type FigureView,
} from './figure.generated';
import { tokens, useTheme } from '../theme/theme';

let seq = 0;

/**
 * The layered body figure: one silhouette in the icon-body tone, with every
 * muscle drawn as its own region on top of it, clipped to the silhouette.
 * Changing a region's fill is all a heat map or a highlight ever does.
 */
export function Figure({
  view,
  viewBox,
  paint,
  accent = [],
  width,
  height,
  strokeWidth,
  fillFor,
}: {
  view: FigureView;
  viewBox: string;
  /** Canonical region indices, in paint order. */
  paint: readonly number[];
  accent?: readonly number[];
  width: number;
  height: number;
  strokeWidth: number;
  /** Overrides the fill of a region — used by the body map. */
  fillFor?: (region: number) => string | undefined;
}) {
  const { c } = useTheme();
  const id = useRef(`fig${++seq}`).current;
  const figure = FIGURE[view];
  const accentSet = new Set(accent);
  const [tx, ty] = REGION_TRANSLATE.split(',').map(Number);

  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      <Defs>
        <ClipPath id={id}>
          <Path d={figure.silhouette} clipRule="evenodd" />
        </ClipPath>
      </Defs>
      <Path d={figure.silhouette} fill={c.iconBody} fillRule="evenodd" />
      <G clipPath={`url(#${id})`}>
        {paint.map((r, i) => (
          <Path
            key={`${r}-${i}`}
            d={figure.regions[r]}
            translateX={tx}
            translateY={ty}
            fill={fillFor?.(r) ?? (accentSet.has(r) ? c.accent : c.iconBody)}
            stroke={c.iconBody}
            strokeWidth={strokeWidth}
          />
        ))}
      </G>
    </Svg>
  );
}

/** The tile an exercise icon sits in: surface-raised, radius 12 (16 over 56). */
export function ExerciseIcon({ icon, size }: { icon: ExerciseIconKey; size: number }) {
  const { c } = useTheme();
  const def = EXERCISE_ICONS[icon];
  const inner = size - (size > 56 ? 4 : 3);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size > 56 ? tokens.iconTile.radiusAbove56 : tokens.iconTile.radius,
        backgroundColor: c.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Figure
        view={def.view}
        viewBox={def.viewBox}
        paint={def.paint}
        accent={def.accent}
        width={inner}
        height={inner}
        strokeWidth={def.strokeWidth}
      />
    </View>
  );
}
