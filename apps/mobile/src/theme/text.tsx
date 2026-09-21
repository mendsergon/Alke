import { Text, type TextProps, type TextStyle } from 'react-native';
import { tokens, useTheme } from './theme';

type Variant = keyof typeof tokens.type;
type Family = 'serif' | 'sans';
type Weight = 400 | 500 | 600;

const FAMILY: Record<Family, Record<Weight, string>> = {
  // Newsreader is only ever set at 500 in the design.
  serif: {
    400: tokens.fontFamily.serifMedium,
    500: tokens.fontFamily.serifMedium,
    600: tokens.fontFamily.serifMedium,
  },
  sans: {
    400: tokens.fontFamily.sansRegular,
    500: tokens.fontFamily.sansMedium,
    600: tokens.fontFamily.sansSemiBold,
  },
};

export type TxtProps = TextProps & {
  variant?: Variant;
  family?: Family;
  weight?: Weight;
  /** A palette key, or a literal colour that already came from the palette. */
  color?: string;
  caps?: boolean;
  /** Tabular figures. Always on for numerals. */
  tnum?: boolean;
  /** Overrides the variant's tracking, in em. */
  tracking?: number;
};

export function Txt({
  variant = 'body',
  family = 'sans',
  weight,
  color,
  caps,
  tnum,
  tracking,
  style,
  ...rest
}: TxtProps) {
  const { c } = useTheme();
  const t = tokens.type[variant] as {
    size: number;
    lineHeight: number;
    weight?: number;
    tracking?: number | string;
  };

  const w = (weight ?? (t.weight as Weight | undefined) ?? 400) as Weight;
  const emRaw = tracking ?? t.tracking;
  const em = typeof emRaw === 'string' ? parseFloat(emRaw) : emRaw;

  const s: TextStyle = {
    fontFamily: FAMILY[family][w],
    fontSize: t.size,
    lineHeight: t.lineHeight,
    color: color ?? c.text,
  };
  if (em) s.letterSpacing = t.size * em;
  if (caps) s.textTransform = 'uppercase';
  if (tnum) s.fontVariant = ['tabular-nums'];

  return <Text {...rest} style={[s, style]} />;
}

/** The 11/14 0.09em uppercase label used as every section eyebrow. */
export function MicroCaps(props: TxtProps) {
  const { c } = useTheme();
  return <Txt variant="microCaps" weight={600} caps color={c.textSecondary} {...props} />;
}
