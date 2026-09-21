import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';

/**
 * The line icons, path for path out of design/rungs-ui.html.
 * Every one is drawn on a 24x24 box, stroked, never filled.
 */
const PATHS: Record<string, (p: { s: string; w: number }) => ReactNode> = {
  gym: ({ s, w }) => (
    <>
      <Path d="M5 20.5V6l9-2.5v17" stroke={s} strokeWidth={w} />
      <Path d="M14 7.5h5v13H4.5" stroke={s} strokeWidth={w} />
      <Path d="M11 12.5h.01" stroke={s} strokeWidth={w} />
    </>
  ),
  chevronDown: ({ s, w }) => <Path d="M6 10.5 12 16l6-5.5" stroke={s} strokeWidth={w} />,
  chevronUp: ({ s, w }) => <Path d="M17 14.5 12 9.5l-5 5" stroke={s} strokeWidth={w} />,
  chevronRight: ({ s, w }) => <Path d="M9.5 5.5 16 12l-6.5 6.5" stroke={s} strokeWidth={w} />,
  chevronLeft: ({ s, w }) => <Path d="M14.5 5.5 8 12l6.5 6.5" stroke={s} strokeWidth={w} />,
  calendar: ({ s, w }) => (
    <>
      <Rect x={4} y={5.5} width={16} height={14.5} rx={2.5} stroke={s} strokeWidth={w} />
      <Path d="M4 10h16" stroke={s} strokeWidth={w} />
      <Path d="M8.5 3.5v4" stroke={s} strokeWidth={w} />
      <Path d="M15.5 3.5v4" stroke={s} strokeWidth={w} />
    </>
  ),
  play: ({ s, w }) => <Path d="M8.5 5.5 18 12l-9.5 6.5z" stroke={s} strokeWidth={w} />,
  plus: ({ s, w }) => (
    <>
      <Path d="M12 5.5v13" stroke={s} strokeWidth={w} />
      <Path d="M5.5 12h13" stroke={s} strokeWidth={w} />
    </>
  ),
  home: ({ s, w }) => (
    <>
      <Path d="M4 11.2 12 4.5l8 6.7V20H4z" stroke={s} strokeWidth={w} />
      <Path d="M9.5 20v-5.5h5V20" stroke={s} strokeWidth={w} />
    </>
  ),
  compass: ({ s, w }) => (
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={s} strokeWidth={w} />
      <Path d="M15 9 13.2 13.2 9 15l1.8-4.2z" stroke={s} strokeWidth={w} />
    </>
  ),
  library: ({ s, w }) => (
    <>
      <Path d="M4.5 5.5h4v14h-4z" stroke={s} strokeWidth={w} />
      <Path d="M10.5 5.5h4v14h-4z" stroke={s} strokeWidth={w} />
      <Path d="m16.8 6.6 3.1 13.2" stroke={s} strokeWidth={w} />
    </>
  ),
  chart: ({ s, w }) => (
    <>
      <Path d="M4 4v16h16" stroke={s} strokeWidth={w} />
      <Path d="M7.5 15.5 11 11.5l3 2.5 5.5-7" stroke={s} strokeWidth={w} />
    </>
  ),
  person: ({ s, w }) => (
    <>
      <Circle cx={12} cy={8} r={3.6} stroke={s} strokeWidth={w} />
      <Path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" stroke={s} strokeWidth={w} />
    </>
  ),
  sparkle: ({ s, w }) => (
    <Path d="M12 3.5 13.7 9 19 10.8 13.7 12.6 12 18.1 10.3 12.6 5 10.8 10.3 9z" stroke={s} strokeWidth={w} />
  ),
  qr: ({ s, w }) => (
    <>
      <Path d="M4 8.5V4h4.5" stroke={s} strokeWidth={w} />
      <Path d="M15.5 4H20v4.5" stroke={s} strokeWidth={w} />
      <Path d="M20 15.5V20h-4.5" stroke={s} strokeWidth={w} />
      <Path d="M8.5 20H4v-4.5" stroke={s} strokeWidth={w} />
      <Rect x={8.5} y={8.5} width={7} height={7} rx={1} stroke={s} strokeWidth={w} />
    </>
  ),
  search: ({ s, w }) => (
    <>
      <Circle cx={11} cy={11} r={6.5} stroke={s} strokeWidth={w} />
      <Path d="m16 16 4 4" stroke={s} strokeWidth={w} />
    </>
  ),
  users: ({ s, w }) => (
    <>
      <Circle cx={7} cy={6} r={2.2} stroke={s} strokeWidth={w} />
      <Circle cx={17} cy={6} r={2.2} stroke={s} strokeWidth={w} />
      <Circle cx={12} cy={18.5} r={2.2} stroke={s} strokeWidth={w} />
      <Path d="M7 8.2v2.3c0 3 5 2.6 5 5.6" stroke={s} strokeWidth={w} />
      <Path d="M17 8.2v2.3c0 3-5 2.6-5 5.6" stroke={s} strokeWidth={w} />
    </>
  ),
  timer: ({ s, w }) => (
    <>
      <Circle cx={12} cy={13.5} r={7.5} stroke={s} strokeWidth={w} />
      <Path d="M12 9.5v4l2.5 1.8" stroke={s} strokeWidth={w} />
      <Path d="M9.5 3h5" stroke={s} strokeWidth={w} />
    </>
  ),
  check: ({ s, w }) => <Path d="M5 12.5 9.8 17 19 6.5" stroke={s} strokeWidth={w} />,
  dots: ({ s, w }) => (
    <>
      <Circle cx={12} cy={5.5} r={1.2} stroke={s} strokeWidth={w} />
      <Circle cx={12} cy={12} r={1.2} stroke={s} strokeWidth={w} />
      <Circle cx={12} cy={18.5} r={1.2} stroke={s} strokeWidth={w} />
    </>
  ),
  arrowUp: ({ s, w }) => (
    <>
      <Path d="M12 18.5v-13" stroke={s} strokeWidth={w} />
      <Path d="M6.5 11 12 5.5 17.5 11" stroke={s} strokeWidth={w} />
    </>
  ),
  arrowDown: ({ s, w }) => (
    <>
      <Path d="M12 5.5v13" stroke={s} strokeWidth={w} />
      <Path d="M6.5 13 12 18.5 17.5 13" stroke={s} strokeWidth={w} />
    </>
  ),
  equals: ({ s, w }) => (
    <>
      <Path d="M5.5 9.5h13" stroke={s} strokeWidth={w} />
      <Path d="M5.5 14.5h13" stroke={s} strokeWidth={w} />
    </>
  ),
  diamond: ({ s, w }) => <Path d="M12 3.5 20 12l-8 8.5L4 12z" stroke={s} strokeWidth={w} />,
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size,
  color,
  width = 1.6,
}: {
  name: IconName;
  size: number;
  color: string;
  width?: number;
}) {
  const draw = PATHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {draw({ s: color, w: width })}
    </Svg>
  );
}
