import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { tokens, useTheme } from '../theme/theme';

const W = 342;
const H = 120;
const PLOT_LEFT = 6;
const PLOT_RIGHT = 298;
const BASELINE = 94;

/** The e1RM trend: an accent line over a soft fill, with records ringed gold. */
export function E1rmChart({
  axis,
  values,
  records,
  months,
  peak,
}: {
  axis: number[];
  values: number[];
  records: number[];
  months: string[];
  peak: string;
}) {
  const { c } = useTheme();
  const min = axis[0];
  const max = axis[axis.length - 1];
  const yTop = 29.9;
  const yBottom = 79.2;
  const y = (v: number) => yBottom - ((v - min) / (max - min)) * (yBottom - yTop);
  const x = (i: number) => PLOT_LEFT + (i / (values.length - 1)) * (PLOT_RIGHT - PLOT_LEFT);

  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const sans = tokens.fontFamily.sansMedium;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {axis.map((v) => (
        <Line key={v} x1={PLOT_LEFT} y1={y(v)} x2={PLOT_RIGHT} y2={y(v)} stroke={c.border} strokeWidth={1} />
      ))}
      {axis.map((v) => (
        <SvgText key={`l${v}`} x={306} y={y(v) + 4} fontFamily={sans} fontSize={11} fill={c.textSecondary}>
          {String(v)}
        </SvgText>
      ))}
      <Polygon
        points={`${points} ${PLOT_RIGHT.toFixed(1)},${BASELINE} ${PLOT_LEFT.toFixed(1)},${BASELINE}`}
        fill={c.accentSoft}
        opacity={0.75}
      />
      <Polyline
        points={points}
        fill="none"
        stroke={c.accent}
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {records.map((i) => (
        <Circle
          key={i}
          cx={x(i)}
          cy={y(values[i])}
          r={4.5}
          fill={c.surface}
          stroke={c.recordFill}
          strokeWidth={2.25}
        />
      ))}
      <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={5} fill={c.recordFill} />
      <SvgText x={PLOT_LEFT} y={112} fontFamily={sans} fontSize={11} fill={c.textSecondary}>
        {months[0]}
      </SvgText>
      <SvgText x={152} y={112} textAnchor="middle" fontFamily={sans} fontSize={11} fill={c.textSecondary}>
        {months[1]}
      </SvgText>
      <SvgText x={PLOT_RIGHT} y={112} textAnchor="end" fontFamily={sans} fontSize={11} fill={c.textSecondary}>
        {months[2]}
      </SvgText>
      <SvgText
        x={PLOT_RIGHT}
        y={17.9}
        textAnchor="end"
        fontFamily={tokens.fontFamily.sansSemiBold}
        fontSize={12}
        fill={c.recordText}
      >
        {peak}
      </SvgText>
    </Svg>
  );
}
