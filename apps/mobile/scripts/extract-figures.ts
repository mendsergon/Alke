/**
 * Reads design/rungs-ui.html and writes src/figure/figure.generated.ts.
 *
 * The design export draws every exercise icon and both body maps from one
 * silhouette plus a fixed list of muscle regions. This pulls that geometry out
 * once so the app renders the same figure instead of a copy per screen.
 *
 * Run from apps/mobile:  pnpm figures
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const source = resolve(repoRoot, 'design/rungs-ui.html');
const target = resolve(here, '../src/figure/figure.generated.ts');

const html = readFileSync(source, 'utf8');

type FigureView = 'front' | 'back';

type Svg = { raw: string; id: string | null; viewBox: string | null; index: number };
type Region = { d: string; transform: string; fill: string; stroke: string; strokeWidth: string };
type Icon = {
  slug: string;
  label: string;
  muscle: string;
  view: FigureView;
  viewBox: string;
  strokeWidth: number;
  paint: number[];
  accent: number[];
};
type Strip = {
  key: string;
  view: FigureView;
  viewBox: string;
  strokeWidth: number;
  paint: number[];
  accent: number[];
};

const ICON_BODY = '#B3AC95';
const ACCENT = '#2C6E6A';

/** Every <svg> in the file, with the clipPath id it declares (if any). */
function svgs(): Svg[] {
  const out: Svg[] = [];
  for (const m of html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)) {
    const raw = m[0];
    const id = /<clipPath id="([^"]+)"/.exec(raw)?.[1] ?? null;
    const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1] ?? null;
    if (m.index === undefined) throw new Error('svg match without an index');
    out.push({ raw, id, viewBox, index: m.index });
  }
  return out;
}

function silhouetteOf(raw: string): string | null {
  return /<\/defs><path d="([^"]*)" fill="([^"]*)" fill-rule="evenodd">/.exec(raw)?.[1] ?? null;
}

function regionsOf(raw: string): Region[] {
  return [...raw.matchAll(
    /<path d="([^"]*)" transform="translate\(([^)]*)\)" fill="([^"]*)" stroke="([^"]*)" stroke-width="([^"]*)"/g,
  )].map((m) => ({
    d: m[1]!,
    transform: m[2]!,
    fill: m[3]!,
    stroke: m[4]!,
    strokeWidth: m[5]!,
  }));
}

const all = svgs();

// --- the two body maps -----------------------------------------------------
const frontMap = all.find((s) => s.id === 'bm-lightfrontmap');
const backMap = all.find((s) => s.id === 'bm-lightbackmap');
if (!frontMap || !backMap) throw new Error('body map svgs not found');

const views: Record<FigureView, { silhouette: string | null; regions: string[] }> = {
  front: { silhouette: silhouetteOf(frontMap.raw), regions: regionsOf(frontMap.raw).map((r) => r.d) },
  back: { silhouette: silhouetteOf(backMap.raw), regions: regionsOf(backMap.raw).map((r) => r.d) },
};
const transform = regionsOf(frontMap.raw)[0]!.transform;
const viewBoxFull = frontMap.viewBox;

const indexOfRegion = {
  front: new Map(views.front.regions.map((d, i) => [d, i])),
  back: new Map(views.back.regions.map((d, i) => [d, i])),
};

// --- the exercise icon set -------------------------------------------------
// Each tile in "The set" carries a name and a "<muscle> · <view>" caption
// right after its <svg>, and its clipPath id ends in the tile size.
const icons: Icon[] = [];
for (const s of all) {
  if (!s.id?.startsWith('ex-light') || !s.id.endsWith('64')) continue;
  const slug = s.id.slice('ex-light'.length, -2);
  if (icons.some((i) => i.slug === slug)) continue;

  const after = html.slice(s.index + s.raw.length, s.index + s.raw.length + 600);
  const m = /^<\/span><div[^>]*>([^<]+)<\/div><div[^>]*>([^<]+)<\/div>/.exec(after);
  if (!m) throw new Error(`no caption for ${slug}`);
  const label = m[1]!;
  const [muscle, view] = m[2]!.split('·').map((x) => x.trim()) as [string, string];
  if (view !== 'front' && view !== 'back') throw new Error(`bad view "${view}" for ${slug}`);
  const viewed: FigureView = view;

  const regions = regionsOf(s.raw);
  const lookup = indexOfRegion[viewed];
  const paint = regions.map((r) => {
    const i = lookup.get(r.d);
    if (i === undefined) throw new Error(`region of ${slug} is not in the ${view} figure`);
    return i;
  });
  const accent = regions
    .map((r, i) => (r.fill.toUpperCase() === ACCENT ? paint[i]! : -1))
    .filter((i) => i >= 0);
  if (accent.length === 0) throw new Error(`${slug} highlights nothing`);

  icons.push({
    slug,
    label: label.replace(/&amp;/g, '&'),
    muscle,
    view: viewed,
    viewBox: s.viewBox!,
    strokeWidth: Number(regions[0]!.strokeWidth),
    paint,
    accent,
  });
}
icons.sort((a, b) => a.slug.localeCompare(b.slug));

// --- the tall program figures on Explore ----------------------------------
// Same figure, cropped to the whole body, several muscles in accent at once.
const strips: Strip[] = [];
for (const s of all) {
  if (!s.id?.startsWith('ex-light') || !s.viewBox?.startsWith('91.5 0.0 200.0')) continue;
  const regions = regionsOf(s.raw);
  const view: FigureView = indexOfRegion.front.has(regions[0]!.d) ? 'front' : 'back';
  const lookup = indexOfRegion[view];
  const paint = regions.map((r) => lookup.get(r.d));
  if (paint.some((i) => i === undefined)) continue;
  const painted = paint as number[];
  const accent = regions
    .map((r, i) => (r.fill.toUpperCase() === ACCENT ? painted[i]! : -1))
    .filter((i) => i >= 0);
  const key = `${view}:${accent.join(',')}`;
  if (strips.some((x) => x.key === key)) continue;
  strips.push({
    key,
    view,
    viewBox: s.viewBox!,
    strokeWidth: Number(regions[0]!.strokeWidth),
    paint: painted,
    accent,
  });
}

// --- emit ------------------------------------------------------------------
const q = (v: unknown): string => JSON.stringify(v);
const lines: string[] = [];
lines.push('/* GENERATED by apps/mobile/scripts/extract-figures.ts — do not edit by hand. */');
lines.push('/* Geometry read out of design/rungs-ui.html. Colours come from @alke/theme. */');
lines.push('');
lines.push(`export const FIGURE_VIEW_BOX = ${q(viewBoxFull)};`);
lines.push(`export const REGION_TRANSLATE = ${q(transform)};`);
lines.push('');
lines.push('export type FigureView = "front" | "back";');
lines.push('');
lines.push('export const FIGURE: Record<FigureView, { silhouette: string; regions: readonly string[] }> = {');
for (const view of ['front', 'back'] as const) {
  lines.push(`  ${view}: {`);
  lines.push(`    silhouette: ${q(views[view].silhouette)},`);
  lines.push('    regions: [');
  for (const d of views[view].regions) lines.push(`      ${q(d)},`);
  lines.push('    ],');
  lines.push('  },');
}
lines.push('};');
lines.push('');
lines.push('export type ExerciseIconKey =');
lines.push(icons.map((i) => `  | ${q(i.slug)}`).join('\n') + ';');
lines.push('');
lines.push('export type ExerciseIconDef = {');
lines.push('  label: string;');
lines.push('  muscle: string;');
lines.push('  view: FigureView;');
lines.push('  viewBox: string;');
lines.push('  strokeWidth: number;');
lines.push('  /** Canonical region indices, in the order the export paints them. */');
lines.push('  paint: readonly number[];');
lines.push('  /** The regions that carry the accent. */');
lines.push('  accent: readonly number[];');
lines.push('};');
lines.push('');
lines.push('export const EXERCISE_ICONS: Record<ExerciseIconKey, ExerciseIconDef> = {');
for (const i of icons) {
  lines.push(`  ${q(i.slug)}: {`);
  lines.push(`    label: ${q(i.label)},`);
  lines.push(`    muscle: ${q(i.muscle)},`);
  lines.push(`    view: ${q(i.view)},`);
  lines.push(`    viewBox: ${q(i.viewBox)},`);
  lines.push(`    strokeWidth: ${i.strokeWidth},`);
  lines.push(`    paint: [${i.paint.join(', ')}],`);
  lines.push(`    accent: [${i.accent.join(', ')}],`);
  lines.push('  },');
}
lines.push('};');
lines.push('');
lines.push('/** The tall whole-body figures used on Explore, in export order. */');
lines.push('export const FIGURE_STRIPS: readonly Omit<ExerciseIconDef, "label" | "muscle">[] = [');
for (const s of strips) {
  lines.push('  {');
  lines.push(`    view: ${q(s.view)},`);
  lines.push(`    viewBox: ${q(s.viewBox)},`);
  lines.push(`    strokeWidth: ${s.strokeWidth},`);
  lines.push(`    paint: [${s.paint.join(', ')}],`);
  lines.push(`    accent: [${s.accent.join(', ')}],`);
  lines.push('  },');
}
lines.push('];');
lines.push('');
lines.push('/** Muscle name -> the regions that mean it, from the icon set. */');
lines.push('export const MUSCLE_REGIONS: Record<string, { view: FigureView; regions: readonly number[] }> = {');
const byMuscle = new Map<string, Icon>();
for (const i of icons) if (!byMuscle.has(i.muscle)) byMuscle.set(i.muscle, i);
for (const [muscle, i] of byMuscle) {
  lines.push(`  ${q(muscle)}: { view: ${q(i.view)}, regions: [${i.accent.join(', ')}] },`);
}
lines.push('};');
lines.push('');

// --- muscles that also show in the other view ------------------------------
// An icon lights a muscle in one view, but some muscles show in both — the
// triceps' outer edge shows from the front. A region no icon owns belongs to
// the muscle whose colour it carries in both the light and the dark body map,
// when that colour is that muscle's alone.
const fillMap = (id: string, view: FigureView) => {
  const svg = all.find((x) => x.id === id);
  if (!svg) throw new Error(`body map ${id} not found`);
  return new Map(regionsOf(svg.raw).map((r) => [indexOfRegion[view].get(r.d)!, r.fill.toUpperCase()]));
};
const fills: Record<FigureView, { light: Map<number, string>; dark: Map<number, string> }> = {
  front: { light: fillMap('bm-lightfrontmap', 'front'), dark: fillMap('bm-darkfrontmap', 'front') },
  back: { light: fillMap('bm-lightbackmap', 'back'), dark: fillMap('bm-darkbackmap', 'back') },
};
const owned: Record<FigureView, Set<number>> = { front: new Set(), back: new Set() };
for (const i of byMuscle.values()) for (const r of i.accent) owned[i.view].add(r);
const colourAt = (view: FigureView, r: number) => `${fills[view].light.get(r)}|${fills[view].dark.get(r)}`;
const colourOf = (i: Icon) => colourAt(i.view, i.accent[0]!);
const colourCount = new Map<string, number>();
for (const i of byMuscle.values()) colourCount.set(colourOf(i), (colourCount.get(colourOf(i)) ?? 0) + 1);
lines.push('/** Regions a muscle also covers in the view its icon does not use. */');
lines.push('export const MUSCLE_ALSO: Record<string, { view: FigureView; regions: readonly number[] }> = {');
for (const [muscle, i] of byMuscle) {
  if (colourCount.get(colourOf(i)) !== 1) continue;
  const other: FigureView = i.view === 'front' ? 'back' : 'front';
  const extra = views[other].regions
    .map((_, r) => r)
    .filter((r) => !owned[other].has(r) && colourAt(other, r) === colourOf(i));
  if (extra.length > 0) lines.push(`  ${q(muscle)}: { view: ${q(other)}, regions: [${extra.join(', ')}] },`);
}
lines.push('};');
lines.push('');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, lines.join('\n'), 'utf8');

console.log(
  `front regions ${views.front.regions.length}, back regions ${views.back.regions.length}, ` +
    `icons ${icons.length}, strips ${strips.length}`,
);
console.log(icons.map((i) => `${i.slug}:${i.muscle}/${i.view}`).join('  '));
