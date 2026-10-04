import { View } from 'react-native';
import { Figure } from '../figure/figure';
import { FIGURE, MUSCLE_ALSO, MUSCLE_REGIONS, type FigureView } from '../figure/figure.generated';
import { useTheme } from '../theme/theme';
import type { Exercise } from '../backend/exercises';
import { BODY_STROKE, BODY_VIEW_BOX } from './body-map';

/** A muscle's regions in a view: where its icon draws it, and where it also shows. */
function regionsIn(view: FigureView, muscle: string): readonly number[] {
  return [MUSCLE_REGIONS[muscle], MUSCLE_ALSO[muscle]].flatMap((r) => (r && r.view === view ? r.regions : []));
}

const [, , VIEW_W, VIEW_H] = BODY_VIEW_BOX.split(' ').map(Number) as [number, number, number, number];

/**
 * What a workout trains, as the whole figure front and back, drawn the way
 * Progress draws the body: every muscle seamed, the ones the workout's
 * exercises hit lit — their main muscles in the accent, their secondary ones
 * in the weaker accent, as an exercise's icon lights them (Stavros, 4 October
 * 2026).
 */
export function WorkoutBody({ exercises, height }: { exercises: readonly Exercise[]; height: number }) {
  const { c } = useTheme();
  const fill = (view: FigureView) => {
    const fills = new Map<number, string>();
    for (const e of exercises) e.secondary.forEach((m) => regionsIn(view, m).forEach((r) => fills.set(r, c.accentSecondary)));
    // A muscle that is main for one exercise and secondary for another is main.
    for (const e of exercises) e.main.forEach((m) => regionsIn(view, m).forEach((r) => fills.set(r, c.accent)));
    return (r: number) => fills.get(r);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {(['front', 'back'] as const).map((view) => (
        <Figure
          key={view}
          view={view}
          viewBox={BODY_VIEW_BOX}
          paint={FIGURE[view].regions.map((_, i) => i)}
          width={(height * VIEW_W) / VIEW_H}
          height={height}
          strokeWidth={BODY_STROKE}
          fillFor={fill(view)}
          seamAll
        />
      ))}
    </View>
  );
}
