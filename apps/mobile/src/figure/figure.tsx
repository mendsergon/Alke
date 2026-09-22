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
import { mix } from '../components/heat';

let seq = 0;

/**
 * The layered body figure: one silhouette in the icon-body tone, with every
 * muscle drawn as its own region on top of it, clipped to the silhouette.
 * Changing a region's fill is all a heat map or a highlight ever does.
 *
 * Two ways to seam it, because the figure does two different jobs.
 *
 * As an exercise icon it is a mark: the design export says it is "coloured in
 * two flat tones: the body in #B3AC95 (light) / #5A574D (dark), the target
 * muscle in the accent … each lit region is seamed in the body tone so
 * neighbouring lit muscles stay separate masses". Seaming every muscle there
 * turns a 44px mark into faceted plating and loses the two tones it is built
 * on. That is the default.
 *
 * As the body map it is a diagram, and reading volume per muscle depends on
 * every muscle being visible whether or not it carries any — an unworked
 * muscle is exactly the thing you need to be able to see. That is `seamAll`.
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
  outline,
  base,
  seamAll = false,
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
  /**
   * The seam drawn around a lit region. Defaults to the body tone, which is
   * what separates two lit muscles lying against each other.
   */
  outline?: string;
  /** The silhouette under the muscle regions. Defaults to the body tone. */
  base?: string;
  /**
   * Seam every muscle, not only the lit ones, over a recessed silhouette —
   * the body map's reading, where an unlit muscle still has to be legible.
   */
  seamAll?: boolean;
}) {
  const { c } = useTheme();
  // The shade the body sits at when every muscle is seamed, so the seams have
  // something to be drawn against.
  const recess = mix(c.iconBody, c.bg, 0.45);
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
      <Path
        d={figure.silhouette}
        fill={base ?? (seamAll ? recess : c.iconBody)}
        fillRule="evenodd"
      />
      <G clipPath={`url(#${id})`}>
        {paint.map((r, i) => {
          const custom = fillFor?.(r);
          // Lit = carrying the accent, or given its own colour by a heat map.
          // Only those are seamed; the rest are the body, and the body is one
          // tone.
          const lit = custom !== undefined || accentSet.has(r);
          const seamed = seamAll || lit;
          return (
            <Path
              key={`${r}-${i}`}
              d={figure.regions[r]}
              translateX={tx}
              translateY={ty}
              fill={custom ?? (accentSet.has(r) ? c.accent : c.iconBody)}
              stroke={seamed ? outline ?? (seamAll ? recess : c.iconBody) : 'none'}
              strokeWidth={seamed ? strokeWidth : 0}
            />
          );
        })}
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
