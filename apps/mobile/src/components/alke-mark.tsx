import Svg, { Path } from 'react-native-svg';
import { tokens, useTheme } from '../theme/theme';

/**
 * The Alke mark: an A for Alke (Ἀλκή, strength), drawn in the rung's own
 * geometry — one 6px stroke, fully-rounded caps and joins, in the accent.
 * Nothing else on the mark; it has to read at 20px on a tab and at 1024px
 * on a store listing.
 *
 * The crossbar was first drawn as a part-filled rung. At mark scale the
 * unfilled remainder read as a defect behind the right leg, so the bar is
 * solid and the rung shows only in the stroke weight and the round caps.
 */
export function AlkeMark({ size, color }: { size: number; color?: string }) {
  const { c } = useTheme();
  const stroke = color ?? c.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Apex at 32,12; feet at 14,52 and 50,52; the bar tucks into the legs. */}
      <Path
        d="M22.3 38h19.4"
        stroke={stroke}
        strokeWidth={tokens.rung.trackHeight}
        strokeLinecap="round"
      />
      <Path
        d="M14 52 32 12l18 40"
        stroke={stroke}
        strokeWidth={tokens.rung.trackHeight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
