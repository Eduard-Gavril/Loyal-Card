// ─────────────────────────────────────────────────────────────────
// LoyalCard design system — "Ivory" (light) / "Midnight" (dark)
// Base: warm white / ivory surfaces, near-black ink.
// Accent: violet only. Black ("night") for premium surfaces.
// ─────────────────────────────────────────────────────────────────
import { useClientStore } from '@/store'

const lightColors = {
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
}

export type Palette = { [K in keyof typeof lightColors]: string }

// Static light palette — admin screens (always light) and the type/shadow
// tokens below keep importing this directly.
export const colors: Palette = lightColors

// "Midnight" — neutral near-black dark theme. Backgrounds and surfaces stay
// gray (no violet cast); violet lives only in interactive accents.
export const darkColors: Palette = {
  bg: '#0F0F13',
  bgDeep: '#18181D',
  surface: '#1B1B21',
  overlay: 'rgba(0,0,0,0.6)',

  ink: '#F2F2F4',
  inkMid: '#C4C4CC',
  inkSoft: '#8F8F99',
  inkFaint: '#5D5D67',

  border: '#27272E',
  borderStrong: '#36363F',

  primary: '#8B5CF6',
  primaryPressed: '#A78BFA',
  primarySoft: '#211E2D',     // barely-violet tinted surface
  primaryBorder: '#332D47',
  violet: '#8B5CF6',
  violetLight: '#A78BFA',

  // Night surfaces sit slightly above the dark background
  night: '#222229',
  nightSoft: '#2B2B33',
  nightBorder: '#3C3C46',
  onNight: '#FFFFFF',
  onNightSoft: '#ABABB6',

  success: '#34D399',
  successSoft: '#122A20',
  successBorder: '#1E4634',
  danger: '#F87171',
  dangerSoft: '#331519',
  dangerBorder: '#55232A',
}

// Active palette for the client app; admin screens stay on the static light
// `colors` export.
export function useTheme(): Palette {
  const darkMode = useClientStore((st) => st.darkMode)
  return darkMode ? darkColors : colors
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
