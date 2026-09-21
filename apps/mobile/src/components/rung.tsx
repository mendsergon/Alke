import { View } from 'react-native';
import { tokens, useTheme } from '../theme/theme';

/**
 * The rung. A fully-rounded track with a proportional accent fill and, when
 * the value is a record, a gold cap at the end of the fill (PLAN.md §3).
 * Every rung takes a target, so the caller states the ratio outright.
 */
export function Rung({
  value,
  target,
  record = false,
  muted = false,
}: {
  value: number;
  target: number;
  record?: boolean;
  /** An untouched rung: the fill takes the border tone rather than accent. */
  muted?: boolean;
}) {
  const { c } = useTheme();
  const h = tokens.rung.trackHeight;
  const pct = target <= 0 ? 0 : Math.max(0, Math.min(1, value / target)) * 100;

  return (
    <View
      style={{
        position: 'relative',
        width: '100%',
        height: h,
        borderRadius: tokens.rung.radius,
        backgroundColor: c.rungTrack,
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: tokens.rung.radius,
          backgroundColor: muted ? c.border : c.accent,
        }}
      />
      {record ? (
        <View
          style={{
            position: 'absolute',
            top: -1,
            left: `${pct}%`,
            marginLeft: -2,
            width: 4,
            height: h + 2,
            borderRadius: tokens.rung.radius,
            backgroundColor: c.recordFill,
          }}
        />
      ) : null}
    </View>
  );
}
