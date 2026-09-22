import { View } from 'react-native';
import { Figure } from '../figure/figure';
import { FIGURE, MUSCLE_REGIONS, type FigureView } from '../figure/figure.generated';
import { useTheme } from '../theme/theme';
import { Txt } from '../theme/text';
import { heatColor, mix } from './heat';
import type { MuscleScore } from '../mock/mock-data';

const BODY_VIEW_BOX = '-5.0 -5.0 393.5 727.8';
const BODY_STROKE = 1.8;

function fillsFor(view: FigureView, scores: MuscleScore[], stops: readonly string[]) {
  const byRegion = new Map<number, string>();
  for (const { muscle, score } of scores) {
    const def = MUSCLE_REGIONS[muscle];
    if (!def || def.view !== view) continue;
    const colour = heatColor(stops, score);
    for (const r of def.regions) byRegion.set(r, colour);
  }
  return (r: number) => byRegion.get(r);
}

function Side({ view, label, scores }: { view: FigureView; label: string; scores: MuscleScore[] }) {
  const { c } = useTheme();
  // The body sits a shade behind its muscles, and the seams between them are
  // drawn in that same shade, so an unlit body still reads as a body.
  const recess = mix(c.iconBody, c.bg, 0.45);
  return (
    <View style={{ flexGrow: 1, alignItems: 'center', gap: 8 }}>
      <Figure
        view={view}
        viewBox={BODY_VIEW_BOX}
        paint={FIGURE[view].regions.map((_, i) => i)}
        width={134}
        height={248}
        strokeWidth={BODY_STROKE}
        fillFor={fillsFor(view, scores, c.heat)}
        outline={recess}
        base={recess}
      />
      <Txt variant="micro" weight={500} color={c.textSecondary} tracking={0.04}>
        {label}
      </Txt>
    </View>
  );
}

export function BodyMap({ scores }: { scores: MuscleScore[] }) {
  const { c } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-end' }}>
        <Side view="front" label="Front" scores={scores} />
        <Side view="back" label="Back" scores={scores} />
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt variant="tiny" weight={400} color={c.textSecondary}>
            weaker
          </Txt>
          <View style={{ flexDirection: 'row', borderRadius: 3, overflow: 'hidden' }}>
            {c.heat.map((stop) => (
              <View key={stop} style={{ width: 26, height: 10, backgroundColor: stop }} />
            ))}
          </View>
          <Txt variant="tiny" weight={400} color={c.textSecondary}>
            stronger
          </Txt>
        </View>
      </View>
    </View>
  );
}
