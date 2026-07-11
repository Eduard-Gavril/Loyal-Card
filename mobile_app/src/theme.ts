// ─────────────────────────────────────────────────────────────────
// LoyalCard design system — "Ivory"
// Base: warm white / ivory surfaces, near-black ink.
// Accent: violet only. Black ("night") for premium surfaces.
// ─────────────────────────────────────────────────────────────────

export const colors = {
  // Surfaces
  bg: '#FAF9F6',          // ivory app background
  bgDeep: '#F3F1EB',      // inset / recessed areas
  surface: '#FFFFFF',     // cards
  overlay: 'rgba(26,22,37,0.45)',

  // Ink (text)
  ink: '#1A1625',         // headings — near-black, violet undertone
  inkMid: '#4C4657',      // body / secondary
  inkSoft: '#8A8496',     // muted labels
  inkFaint: '#B6B1C0',    // placeholders, disabled

  // Hairlines
  border: '#ECE9E2',
  borderStrong: '#DDD9CF',

  // Violet accent
  primary: '#6D28D9',
  primaryPressed: '#5B21B6',
  primarySoft: '#F2EDFC',     // violet-tinted surface
  primaryBorder: '#E3DAF8',
  violet: '#7C3AED',
  violetLight: '#A78BFA',     // on dark surfaces only

  // Night (black premium surfaces)
  night: '#17121F',
  nightSoft: '#241D31',
  nightBorder: '#332A45',
  onNight: '#FFFFFF',
  onNightSoft: '#B6ACD1',

  // Semantic (used sparingly)
  success: '#0E9F6E',
  successSoft: '#E6F6EF',
  successBorder: '#C4EADA',
  danger: '#DC2626',
  dangerSoft: '#FDEDED',
  dangerBorder: '#F6CFCF',
} as const

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

// Shadows tuned for light backgrounds (iOS shadow* + Android elevation)
export const shadows = {
  card: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 6,
  },
  primaryBtn: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  night: {
    shadowColor: '#17121F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
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
