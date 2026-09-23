import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { theme as tokens } from '@alke/theme';

export type Scheme = 'light' | 'dark';
/** What the user picked. 'system' follows the phone; the app opens on dark. */
export type SchemePreference = Scheme | 'system';

/** Alke opens dark. The phone's own setting is only followed on 'system'. */
const DEFAULT_PREFERENCE: SchemePreference = 'dark';

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
  /** The stored choice, which may be 'system'. */
  preference: SchemePreference;
  setPreference: (next: SchemePreference) => void;
  /** Steps light → dark → system → light, for the Profile row. */
  cyclePreference: () => void;
};

const ORDER: SchemePreference[] = ['light', 'dark', 'system'];

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<SchemePreference>(DEFAULT_PREFERENCE);

  const cyclePreference = useCallback(() => {
    setPreference((p) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length]!);
  }, []);

  const scheme: Scheme = preference === 'system' ? system : preference;

  // The window behind the app. Left unset, expo-system-ui paints it white or
  // black from the phone's own setting, not Alke's; iOS 26 rounds the corners
  // of screens in a push and that colour shows round the edges.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(tokens[scheme].bg);
  }, [scheme]);

  const value = useMemo<Ctx>(
    () => ({
      scheme,
      c: tokens[scheme] as unknown as Palette,
      cardBorderWidth: scheme === 'light' ? 1 : 0,
      preference,
      setPreference,
      cyclePreference,
    }),
    [scheme, preference, cyclePreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme used outside ThemeProvider');
  return v;
}

export { tokens };
