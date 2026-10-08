import { Ionicons } from '@expo/vector-icons'

type IoniconName = keyof typeof Ionicons.glyphMap

// product_categories.icon is a shared DB column: the web admin panel writes
// Lucide icon names into it (see frontend/src/lib/icons.ts CURATED_ICON_NAMES).
// Mobile has no Lucide renderer, so this maps that same curated set to the
// closest Ionicons glyph — keeping the *stored* value identical across both
// apps (a category made on web renders sensibly here, and vice versa).
const LUCIDE_TO_IONICON: Record<string, IoniconName> = {
  // Food & Drink
  coffee: 'cafe-outline',
  'cup-soda': 'water-outline',
  pizza: 'pizza-outline',
  sandwich: 'fast-food-outline',
  cake: 'gift-outline',
  croissant: 'restaurant-outline',
  'ice-cream-cone': 'restaurant-outline',
  wine: 'wine-outline',
  // Fitness
  dumbbell: 'barbell-outline',
  activity: 'pulse-outline',
  bike: 'bicycle-outline',
  footprints: 'walk-outline',
  waves: 'water-outline',
  trophy: 'trophy-outline',
  // Beauty & Wellness
  scissors: 'cut-outline',
  sparkles: 'sparkles-outline',
  'flower-2': 'flower-outline',
  gem: 'diamond-outline',
  'wand-2': 'color-wand-outline',
  'spray-can': 'flask-outline',
  // Retail & Shop
  'shopping-bag': 'bag-outline',
  shirt: 'shirt-outline',
  gift: 'gift-outline',
  tag: 'pricetag-outline',
  'shopping-cart': 'cart-outline',
  store: 'storefront-outline',
  // General
  package: 'cube-outline',
  star: 'star-outline',
  heart: 'heart-outline',
  home: 'home-outline',
  smartphone: 'phone-portrait-outline',
  camera: 'camera-outline',
  wrench: 'build-outline',
  briefcase: 'briefcase-outline',
}

export const DEFAULT_CATEGORY_ICON = 'package'

// The picker offers this same curated set so a category created on mobile
// stores a name web already knows how to render too.
export const CURATED_CATEGORY_ICONS = Object.keys(LUCIDE_TO_IONICON)

export function resolveCategoryIcon(icon?: string | null): IoniconName {
  if (!icon) return LUCIDE_TO_IONICON[DEFAULT_CATEGORY_ICON]
  return LUCIDE_TO_IONICON[icon] ?? LUCIDE_TO_IONICON[DEFAULT_CATEGORY_ICON]
}

// products.metadata.emoji is the other shared, cross-app field: the web admin
// panel's icon picker (frontend/src/lib/icons.ts) now writes a Lucide icon
// *name* there instead of a literal emoji character, for any product created
// or edited on web since that change shipped. Mobile still only knew how to
// print that value as literal text — so a product edited on web renders here
// as a big ugly word (e.g. "shopping-bag") instead of a small icon. Lucide
// names are always lowercase-kebab-case ASCII; no real emoji matches that
// pattern, so this distinguishes "icon name to resolve" from "legacy emoji
// character to print as-is" without needing to enumerate every possible name.
const ICON_NAME_PATTERN = /^[a-z0-9-]+$/

export function resolveProductIcon(value?: string | null): IoniconName | null {
  if (!value || !ICON_NAME_PATTERN.test(value)) return null
  return LUCIDE_TO_IONICON[value] ?? LUCIDE_TO_IONICON[DEFAULT_CATEGORY_ICON]
}
