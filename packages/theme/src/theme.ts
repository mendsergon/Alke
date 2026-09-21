/**
 * Alke design tokens.
 *
 * Every value here is transcribed from PLAN.md §3 ("Design system"). PLAN.md
 * is the source of truth: if this file and PLAN.md ever disagree, PLAN.md
 * wins and this file is wrong. Nothing else in the repository may hardcode
 * a hex value or a type size — everything reads from this module.
 *
 * KNOWN ASYMMETRY (transcribed exactly, not corrected): PLAN.md's light
 * theme table lists two record tokens, `record-text` and `record-fill`.
 * Its dark theme table lists only one, `record`. This file mirrors that
 * asymmetry as `light.recordText` / `light.recordFill` vs. `dark.record`.
 * No token was invented to make the two themes symmetrical — flagging this
 * for Stavros to resolve.
 */

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

const light = {
  bg: '#FAF9F5',
  surface: '#EAE7DA',
  surfaceRaised: '#DCD7C4',
  border: '#D6D1BE',
  iconBody: '#B3AC95',
  text: '#1F1E1C',
  textSecondary: '#5C5A53',
  accent: '#2C6E6A',
  accentSoft: '#E2ECEA',
  recordText: '#8A6D0B',
  recordFill: '#C9A227',
  destructive: '#A33A2A',
} as const;

const dark = {
  bg: '#1F1E1C',
  surface: '#2E2D29',
  surfaceRaised: '#3A3935',
  border: '#43423C',
  iconBody: '#5A574D',
  text: '#EDEBE4',
  textSecondary: '#A8A59C',
  accent: '#78B9AE',
  accentSoft: '#23332F',
  record: '#C9A227',
  destructive: '#E08A78',
} as const;

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

// Newsreader (serif): screen titles, program names, report prose.
// Geist (sans): all other UI, and all numerals — numerals always use the
// `tnum` (tabular figures) font feature.
const typeface = {
  serif: 'Newsreader',
  sans: 'Geist',
  numeralFeature: 'tnum',
} as const;

const type = {
  screenTitle: { size: 30, lineHeight: 34 },
  section: { size: 24, lineHeight: 30 },
  heading: { size: 26, lineHeight: 32 },
  reportProse: { size: 19, lineHeight: 29 },
  numeralXL: { size: 44, lineHeight: 47, weight: 600 },
  numeralL: { size: 28, lineHeight: 30 },
  body: { size: 15, lineHeight: 22 },
  caption: { size: 13, lineHeight: 19 },
  microCaps: { size: 11, lineHeight: 14, tracking: '0.09em' },
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

// 4px base scale.
const space = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
} as const;

// ---------------------------------------------------------------------------
// Radii
// ---------------------------------------------------------------------------

const radius = {
  chip: 8,
  button: 12,
  row: 12,
  card: 16,
  rung: 999,
} as const;

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

const sizing = {
  primaryButtonHeight: { min: 56, max: 64 },
  tapTarget: { ios: 44, android: 48 },
} as const;

// ---------------------------------------------------------------------------
// The rung — signature element: a 6px fully-rounded track.
// ---------------------------------------------------------------------------

const rung = {
  trackHeight: 6,
  radius: 999,
} as const;

// ---------------------------------------------------------------------------
// Exercise icon tiles
// ---------------------------------------------------------------------------

const iconTile = {
  size: {
    listRow: 44,
    exerciseDetail: 52,
    sessionHeader: 56,
  },
  radius: 12,
  // Tiles above 56px use a 16px radius instead of the default 12px.
  radiusAbove56: 16,
} as const;

// ---------------------------------------------------------------------------

export const theme = {
  light,
  dark,
  typeface,
  type,
  space,
  radius,
  sizing,
  rung,
  iconTile,
} as const;

export type Theme = typeof theme;
export type LightTheme = typeof light;
export type DarkTheme = typeof dark;
export type TypeStyle = typeof type[keyof typeof type];
