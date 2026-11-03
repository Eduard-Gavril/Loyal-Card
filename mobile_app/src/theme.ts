// ─────────────────────────────────────────────────────────────────
// LoyalCard design system — "Amber glass" (same look as the website)
// Near-black warm background with amber glow, translucent glass surfaces,
// amber accent. One dark theme: there is no light mode.
// Token names are kept from the old palette so screens did not need rewrites.
// ─────────────────────────────────────────────────────────────────

export const colors = {
  // Surfaces
  bg: '#0B0907',                    // app background (the glow is drawn above it, see AmbientBackground)
  bgDeep: '#13100C',                // inset / recessed areas (inputs)
  surface: '#1A1510',               // cards
  overlay: 'rgba(0,0,0,0.62)',

  // Ink (text)
  ink: '#F7F0E6',                   // headings
  inkMid: '#CDBFAE',                // body / secondary
  inkSoft: '#9A8C7A',               // muted labels
  inkFaint: '#6B5F52',              // placeholders, disabled

  // Apple-style semantic layers (use these in new code)
  label: '#F7F0E6',                          // primary text
  labelSecondary: 'rgba(247,240,230,0.64)',  // secondary text (>= 4.5:1 on bg)
  labelTertiary: 'rgba(247,240,230,0.40)',   // disabled, decorative: never for essential text
  placeholder: 'rgba(247,240,230,0.58)',     // placeholder text in fields (>= 4.5:1 on the field fill)
  grouped: 'rgba(255,226,186,0.075)',        // grouped list / card background
  fill: 'rgba(255,226,186,0.10)',            // controls: inputs, segmented track
  fillPressed: 'rgba(255,226,186,0.18)',     // pressed row
  separator: 'rgba(255,226,186,0.12)',       // hairline between rows

  // Hairlines
  border: 'rgba(255,226,186,0.14)',
  borderStrong: 'rgba(255,226,186,0.26)',

  // Amber accent
  primary: '#FFB12A',
  primaryPressed: '#F59E0B',
  primarySoft: 'rgba(255,177,42,0.14)',     // amber-tinted surface
  primaryBorder: 'rgba(255,177,42,0.38)',
  violet: '#FFB12A',                        // legacy name: the accent
  violetLight: '#FFD166',                   // accent on dark surfaces
  onPrimary: '#1A1000',                     // text/icons on the amber accent

  // Night (premium surfaces, e.g. the loyalty card itself)
  night: '#2A1D10',
  nightSoft: '#36250F',
  nightBorder: '#5A4122',
  onNight: '#FFFFFF',
  onNightSoft: '#D8C3A3',

  // Semantic (used sparingly)
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.12)',
  successBorder: 'rgba(52,211,153,0.34)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  dangerBorder: 'rgba(248,113,113,0.36)',
}

export type Palette = { [K in keyof typeof colors]: string }

// Kept so screens can keep calling useTheme(); there is a single palette now.
export function useTheme(): Palette {
  return colors
}

// Wraps a style factory with a per-palette cache so StyleSheet.create runs at
// most once per theme instead of on every render.
export function createThemedStyles<T>(factory: (colors: Palette) => T): (colors: Palette) => T {
  const cache = new WeakMap<object, T>()
  return (palette) => {
    const cached = cache.get(palette)
    if (cached) return cached
    const built = factory(palette)
    cache.set(palette, built)
    return built
  }
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const

// Shadows (iOS shadow* + Android elevation)
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 6,
  },
  primaryBtn: {
    shadowColor: '#FFB12A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  night: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 8,
  },
} as const

export const type = {
  // Big screen title
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.4 },
  // Section heading
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.ink, letterSpacing: -0.2 },
  // Card titles
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.ink },
  // Body text
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.inkMid, lineHeight: 20 },
  // Small helper text
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.inkSoft, lineHeight: 17 },
  // Uppercase section labels
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.inkSoft,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
} as const

// ── Typography: Apple's text styles (HIG › Typography). System font (SF on iOS), scales with Dynamic Type.
// Body is 17pt; nothing below 11pt. Weight and size carry the hierarchy, not colour.
export const ty = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1:     { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2:     { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3:     { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline:   { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.41 },
  body:       { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout:    { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.32 },
  subhead:    { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote:   { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption1:   { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  caption2:   { fontSize: 11, lineHeight: 13, fontWeight: '400' as const, letterSpacing: 0.07 },
} as const

export type TextStyleName = keyof typeof ty

// iOS "continuous" (squircle) corners; ignored on Android.
export const continuous = { borderCurve: 'continuous' as const }

// 8pt grid, 16pt page margins, 44pt minimum hit target (HIG › Layout, Accessibility)
export const layout = {
  margin: 16,
  gap: 8,
  rowMin: 52,
  target: 44,
  cardRadius: 22,
  controlRadius: 14,
} as const
