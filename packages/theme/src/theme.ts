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
// Tokens the design exports need and PLAN.md §3 does not define.
//
// Every value below was read out of `design/rungs-ui.html` (the authoritative
// export) by diffing each light screen against its dark twin. They are listed
// here because PLAN.md §3 has no token for them, NOT because they override it.
// They are OPEN and need Stavros's ruling before they become plan values.
// ---------------------------------------------------------------------------

const lightExtra = {
  // Foreground on an accent-filled surface (primary button, checked set mark).
  onAccent: '#FFFFFF',
  // The rung's unfilled track. Distinct from `border` and `surfaceRaised`.
  rungTrack: '#DCD8C9',
  // Background of the gold "PR" chip. Gold's equivalent of `accentSoft`.
  recordSoft: '#F3ECD6',
} as const;

const darkExtra = {
  onAccent: '#10201F',
  rungTrack: '#3E3D38',
  recordSoft: '#3A331F',
  // PLAN.md §3 gives the dark theme one `record` token where light has two.
  // These two names exist so a component can read the same key in both
  // themes; both resolve to dark's single `record` value. No new colour.
  recordText: dark.record,
  recordFill: dark.record,
} as const;

// Body-map heat ramp, weakest to strongest. Five steps, accent-hued only —
// no second hue, per PLAN.md §3 ("Color semantics").
const heatLight = ['#8EA9A5', '#809F9B', '#70938F', '#5D8682', '#427773'] as const;
const heatDark = ['#57605B', '#5F7B74', '#679088', '#6EA298', '#75B1A7'] as const;

// Type styles used by the design exports that PLAN.md §3's table does not
// name. Sizes are in px; `tracking` is in em, as PLAN.md writes it.
const typeExtra = {
  // Serif
  serifCardTitle: { size: 22, lineHeight: 30, weight: 500, tracking: -0.005 },
  serifPanelTitle: { size: 22, lineHeight: 28, weight: 500 },
  serifRowTitle: { size: 20, lineHeight: 26, weight: 500 },
  serifListTitle: { size: 19, lineHeight: 25, weight: 500 },
  // Library's row name: cap height matched to page 05's 10.9pt, on its 22pt line.
  serifRowName: { size: 17, lineHeight: 22, weight: 500 },
  serifProseSmall: { size: 17, lineHeight: 26, weight: 400 },
  // Sans
  buttonLabel: { size: 17, lineHeight: 22, weight: 600, tracking: -0.01 },
  rowTitle: { size: 16, lineHeight: 22, weight: 600, tracking: -0.01 },
  rowLabel: { size: 15, lineHeight: 22, weight: 500, tracking: -0.005 },
  bodySmall: { size: 14, lineHeight: 21, weight: 400 },
  label: { size: 14, lineHeight: 20, weight: 500 },
  captionTight: { size: 13, lineHeight: 18, weight: 400 },
  micro: { size: 12, lineHeight: 17, weight: 400 },
  microTight: { size: 12, lineHeight: 16, weight: 400 },
  tiny: { size: 11, lineHeight: 14, weight: 500 },
  tabLabel: { size: 11, lineHeight: 12, weight: 500 },
  // 11px unit or qualifier set beside a numeral ("kg", "of 4", "this week").
  unitSmall: { size: 11, lineHeight: 14, weight: 500, tracking: 0.01 },
  unitLarge: { size: 18, lineHeight: 22, weight: 500, tracking: 0.01 },
  // The multiplication sign between weight and reps.
  times: { size: 18, lineHeight: 22, weight: 400 },
  // Numerals (always tabular)
  numeralM: { size: 24, lineHeight: 25, weight: 600, tracking: -0.015 },
  numeralS: { size: 19, lineHeight: 20, weight: 600, tracking: -0.015 },
  dataValue: { size: 18, lineHeight: 22, weight: 600 },
  timerValue: { size: 20, lineHeight: 24, weight: 600, tracking: -0.01 },
  nameTitle: { size: 18, lineHeight: 24, weight: 600, tracking: -0.01 },
  avatarInitials: { size: 20, lineHeight: 24, weight: 600 },
  codeChar: { size: 26, lineHeight: 30, weight: 600 },
} as const;

// Font families as @expo-google-fonts exports them.
// The status pill as design page 05 draws it: 62.6 x 27.4pt around an 11pt
// micro-caps label, read off the page at 300 dpi.
const pill = {
  regular: { paddingVertical: 7, paddingHorizontal: 9 },
} as const;

// Explore's template card, read off design page 04 rendered at 300 dpi
// (1222px across a 390pt screen).
const templateCard = {
  dayDot: { size: 6, radius: 2, gap: 3 },
  chipGap: 6,
} as const;

const fontFamily = {
  serifMedium: 'Newsreader_500Medium',
  sansRegular: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
} as const;

// ---------------------------------------------------------------------------

export const theme = {
  light: { ...light, ...lightExtra, heat: heatLight },
  dark: { ...dark, ...darkExtra, heat: heatDark },
  typeface,
  fontFamily,
  type: { ...type, ...typeExtra },
  space,
  radius,
  sizing,
  rung,
  iconTile,
  templateCard,
  pill,
} as const;

export type Theme = typeof theme;
export type LightTheme = typeof theme.light;
export type DarkTheme = typeof theme.dark;
export type TypeStyle = (typeof theme.type)[keyof typeof theme.type];
