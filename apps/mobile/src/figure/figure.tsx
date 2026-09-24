import { useRef } from 'react';
import { Image, PixelRatio, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import {
  ClipOp,
  FillType,
  PaintStyle,
  Skia,
  createPicture,
  type SkPath,
  type SkPicture,
} from '@shopify/react-native-skia';
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

// Each region's bounds in figure space, from its path's points (control points
// included, so the box always contains the curve). Worked out once per region.
const bounds = new Map<string, readonly [number, number, number, number]>();
function regionBounds(view: FigureView, r: number, d: string, tx: number, ty: number) {
  const key = `${view}:${r}`;
  let b = bounds.get(key);
  if (!b) {
    const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) {
      x0 = Math.min(x0, n[i]);
      x1 = Math.max(x1, n[i]);
      y0 = Math.min(y0, n[i + 1]);
      y1 = Math.max(y1, n[i + 1]);
    }
    b = [x0 + tx, y0 + ty, x1 + tx, y1 + ty];
    bounds.set(key, b);
  }
  return b;
}

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
  // Only the regions that fall inside the crop are drawn: an exercise icon
  // shows a corner of the body, and the rest would be drawn and never seen.
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
  const visible = paint.filter((r) => {
    const [x0, y0, x1, y1] = regionBounds(view, r, figure.regions[r], tx, ty);
    return x1 >= vx && x0 <= vx + vw && y1 >= vy && y0 <= vy + vh;
  });

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
        {visible.map((r, i) => {
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

// Every figure path parsed once, the regions already moved into place.
const skPaths = new Map<string, SkPath>();
function skPath(key: string, d: string, tx: number, ty: number, evenOdd: boolean): SkPath {
  let path = skPaths.get(key);
  if (!path) {
    const builder = Skia.PathBuilder.MakeFromPath(Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make());
    builder.offset(tx, ty);
    if (evenOdd) builder.setFillType(FillType.EvenOdd);
    path = builder.build();
    skPaths.set(key, path);
  }
  return path;
}

// Each icon drawn once per size and palette, then replayed. A list of the same
// exercise icon is one recording shown many times, not many drawings.
const pictures = new Map<string, SkPicture>();
function iconPicture(
  icon: ExerciseIconKey,
  size: number,
  seamAll: boolean,
  colors: { accent: string; body: string; recess: string },
): SkPicture {
  const key = `${icon}|${size}|${seamAll}|${colors.accent}|${colors.body}|${colors.recess}`;
  let picture = pictures.get(key);
  if (!picture) {
    const def = EXERCISE_ICONS[icon];
    const figure = FIGURE[def.view];
    const [tx, ty] = REGION_TRANSLATE.split(',').map(Number);
    const [vx, vy, vw, vh] = def.viewBox.split(' ').map(Number);
    // The viewBox fitted and centred, as SVG's default xMidYMid meet does.
    const scale = Math.min(size / vw, size / vh);
    const accentSet = new Set(def.accent);
    const silhouette = skPath(`${def.view}:silhouette`, figure.silhouette, 0, 0, true);
    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    const stroke = Skia.Paint();
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);
    stroke.setStrokeWidth(def.strokeWidth);
    picture = createPicture((canvas) => {
      canvas.translate((size - vw * scale) / 2 - vx * scale, (size - vh * scale) / 2 - vy * scale);
      canvas.scale(scale, scale);
      fill.setColor(Skia.Color(seamAll ? colors.recess : colors.body));
      canvas.drawPath(silhouette, fill);
      canvas.save();
      canvas.clipPath(silhouette, ClipOp.Intersect, true);
      for (const r of def.paint) {
        const [x0, y0, x1, y1] = regionBounds(def.view, r, figure.regions[r], tx, ty);
        if (x1 < vx || x0 > vx + vw || y1 < vy || y0 > vy + vh) continue;
        const path = skPath(`${def.view}:${r}`, figure.regions[r], tx, ty, false);
        const lit = accentSet.has(r);
        fill.setColor(Skia.Color(lit ? colors.accent : colors.body));
        canvas.drawPath(path, fill);
        if (seamAll || lit) {
          stroke.setColor(Skia.Color(seamAll ? colors.recess : colors.body));
          canvas.drawPath(path, stroke);
        }
      }
      canvas.restore();
    }, Skia.XYWHRect(0, 0, size, size));
    pictures.set(key, picture);
  }
  return picture;
}

// Each icon as a bitmap at the screen's pixel density, drawn once from its
// picture. A plain image mounts as one view with nothing to set up, where a
// Skia canvas per card cost several milliseconds each to mount.
const bitmaps = new Map<string, string>();
function iconBitmap(
  icon: ExerciseIconKey,
  size: number,
  seamAll: boolean,
  colors: { accent: string; body: string; recess: string },
): string {
  const scale = PixelRatio.get();
  const key = `${icon}|${size}|${scale}|${seamAll}|${colors.accent}|${colors.body}|${colors.recess}`;
  let uri = bitmaps.get(key);
  if (!uri) {
    const px = Math.round(size * scale);
    const surface = Skia.Surface.Make(px, px);
    if (!surface) return '';
    const canvas = surface.getCanvas();
    canvas.scale(px / size, px / size);
    canvas.drawPicture(iconPicture(icon, size, seamAll, colors));
    uri = `data:image/png;base64,${surface.makeImageSnapshot().encodeToBase64()}`;
    bitmaps.set(key, uri);
  }
  return uri;
}

/**
 * An exercise icon's bitmap drawn at `size`, for a tile that changes size:
 * shown smaller it is scaled down, never blurred up.
 */
export function useExerciseIconUri(icon: ExerciseIconKey, size: number, seamAll = false): string {
  const { c } = useTheme();
  return iconBitmap(icon, size, seamAll, {
    accent: c.accent,
    body: c.iconBody,
    recess: mix(c.iconBody, c.bg, 0.45),
  });
}

/** The tile an exercise icon sits in: surface-raised, radius 12 (16 over 56). */
export function ExerciseIcon({
  icon,
  size,
  seamAll = false,
}: {
  icon: ExerciseIconKey;
  size: number;
  /** Every muscle seamed and visible, the way Progress draws the body. */
  seamAll?: boolean;
}) {
  const { c } = useTheme();
  const inner = size - (size > 56 ? 4 : 3);
  const uri = iconBitmap(icon, inner, seamAll, {
    accent: c.accent,
    body: c.iconBody,
    recess: mix(c.iconBody, c.bg, 0.45),
  });
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
      <Image source={{ uri }} style={{ width: inner, height: inner }} />
    </View>
  );
}
