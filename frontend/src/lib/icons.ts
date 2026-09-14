import { iconNames, type IconName } from 'lucide-react/dynamic'

export const DEFAULT_ICON_NAME: IconName = 'package'

const validIconNames = new Set<string>(iconNames)

// Hand-picked icons covering every business type LoyalCard supports (cafe/food,
// fitness, beauty, retail, general/services) — shown by default before the admin
// types anything into the icon search.
export const CURATED_ICON_NAMES: IconName[] = [
  // Food & Drink
  'coffee', 'cup-soda', 'pizza', 'sandwich', 'cake', 'croissant', 'ice-cream-cone', 'wine',
  // Fitness
  'dumbbell', 'activity', 'bike', 'footprints', 'waves', 'trophy',
  // Beauty & Wellness
  'scissors', 'sparkles', 'flower-2', 'gem', 'wand-2', 'spray-can',
  // Retail & Shop
  'shopping-bag', 'shirt', 'gift', 'tag', 'shopping-cart', 'store',
  // General
  'package', 'star', 'heart', 'home', 'smartphone', 'camera', 'wrench', 'briefcase',
]

// Maps every emoji the old picker ever let an admin choose to a comparable Lucide
// icon, so existing products/categories keep a sensible icon after the switch from
// emoji to Lucide instead of falling back to the generic package icon.
const LEGACY_EMOJI_TO_ICON: Record<string, IconName> = {
  '📦': 'package',
  '☕': 'coffee',
  '🍵': 'leaf',
  '🧃': 'cup-soda',
  '🥤': 'cup-soda',
  '🍺': 'beer',
  '🍷': 'wine',
  '🥛': 'milk',
  '🍕': 'pizza',
  '🍔': 'sandwich',
  '🌭': 'sandwich',
  '🥪': 'sandwich',
  '🌮': 'sandwich',
  '🌯': 'sandwich',
  '🍜': 'soup',
  '🍱': 'utensils',
  '🍣': 'fish',
  '🍰': 'cake',
  '🧁': 'cake',
  '🍩': 'donut',
  '🍪': 'cookie',
  '🍦': 'ice-cream-cone',
  '🥗': 'salad',
  '🍞': 'croissant',
  '🥐': 'croissant',
  '🥯': 'donut',
  '🧀': 'package',
  '🎁': 'gift',
  '💪': 'dumbbell',
  '🏋️': 'dumbbell',
  '🧘': 'activity',
  '🤸': 'activity',
  '🚴': 'bike',
  '🏃': 'footprints',
  '🥊': 'dumbbell',
  '⚽': 'trophy',
  '🏀': 'trophy',
  '🎾': 'trophy',
  '🏸': 'trophy',
  '🏊': 'waves',
  '🤾': 'activity',
  '🏓': 'trophy',
  '💅': 'sparkles',
  '💇': 'scissors',
  '💆': 'sparkles',
  '🧖': 'sparkles',
  '✂️': 'scissors',
  '🧴': 'spray-can',
  '💄': 'sparkles',
  '🪒': 'scissors',
  '🧼': 'soap-dispenser-droplet',
  '👕': 'shirt',
  '👗': 'shirt',
  '👟': 'sport-shoe',
  '👜': 'handbag',
  '💍': 'gem',
  '🕶️': 'glasses',
  '🧢': 'graduation-cap',
  '👶': 'baby',
  '📚': 'book',
  '🎮': 'gamepad-2',
  '🎨': 'paintbrush',
  '🎵': 'music',
  '📷': 'camera',
  '🛍️': 'shopping-bag',
  '🐾': 'paw-print',
  '🚗': 'car',
  '📱': 'smartphone',
  '🏠': 'home',
  '🔧': 'wrench',
  '💼': 'briefcase',
  '✨': 'sparkles',
  '⭐': 'star',
}

// Resolves any stored value (a proper Lucide name, a legacy emoji, or empty/junk)
// to a valid Lucide icon name that's safe to pass to <AppIcon>.
export function resolveIconName(value?: string | null): IconName {
  if (!value) return DEFAULT_ICON_NAME
  if (validIconNames.has(value)) return value as IconName
  return LEGACY_EMOJI_TO_ICON[value] || DEFAULT_ICON_NAME
}

// SQL VALUES fragment for the one-time DB migration — kept here so the mapping
// only has to be maintained in one place. Not used at runtime.
export const LEGACY_EMOJI_TO_ICON_ENTRIES = Object.entries(LEGACY_EMOJI_TO_ICON)
