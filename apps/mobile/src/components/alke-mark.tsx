import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/theme';

/**
 * The Alke mark: an A built as a ladder of rungs.
 *
 * The letter is the A of Alke (Ἀλκή). What makes it Alke's A and not a
 * typeface's is that the crossbars are rungs — the signature element from
 * PLAN.md §3 — two of them, widening as the legs splay, so the mark is a
 * ladder you climb. Same fully-rounded stroke the rung uses.
 */
const STROKE = 7;

export function AlkeMark({ size, color }: { size: number; color?: string }) {
  const { c } = useTheme();
  const stroke = color ?? c.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Apex 32,10 — feet 12,54 and 52,54. Rungs tuck inside the legs. */}
      <Path d="M23.9 34h16.2" stroke={stroke} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M19.3 45h25.4" stroke={stroke} strokeWidth={STROKE} strokeLinecap="round" />
      <Path
        d="M12 54 32 10l20 44"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
