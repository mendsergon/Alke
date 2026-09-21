import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { theme as tokens } from '@alke/theme';

export type Scheme = 'light' | 'dark';

/**
 * Both palettes carry the same keys; only the values differ. The shape is
 * taken from light and widened, so a component reads `c.accent` without
 * caring which theme is on. (Dark's PLAN.md-only `record` alias is not
 * exposed — `recordText` and `recordFill` are, in both themes.)
 */
type LightPalette = typeof tokens.light;
export type Palette = {
  [K in keyof LightPalette]: LightPalette[K] extends readonly unknown[] ? readonly string[] : string;
};

type Ctx = {
  scheme: Scheme;
  /** Both palettes expose the same keys, so a component reads one shape. */
  c: Palette;
  /** Light mode carries a 1px border on cards; dark does not (PLAN.md §3). */
  cardBorderWidth: 0 | 1;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const value = useMemo<Ctx>(
    () => ({
      scheme,
      c: tokens[scheme] as unknown as Palette,
      cardBorderWidth: scheme === 'light' ? 1 : 0,
    }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme used outside ThemeProvider');
  return v;
}

export { tokens };
