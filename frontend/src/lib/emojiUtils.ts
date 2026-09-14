import type { IconName } from 'lucide-react/dynamic'
import { resolveIconName } from './icons'

/**
 * Get an appropriate Lucide icon name for a product based on its stored icon or,
 * failing that, its name — useful for businesses like gyms, cafes, restaurants, etc.
 */
export function getProductIconName(productName: string, metadata?: { emoji?: string }): IconName {
  // If an icon is already set on the product, use it (also upgrades legacy emoji).
  if (metadata?.emoji) {
    return resolveIconName(metadata.emoji)
  }

  const name = productName.toLowerCase()

  // Fitness & Gym related
  if (name.includes('fitness') || name.includes('gym')) return 'dumbbell'
  if (name.includes('aerobic') || name.includes('cardio')) return 'activity'
  if (name.includes('weights') || name.includes('pesi') || name.includes('sollevamento')) return 'dumbbell'
  if (name.includes('yoga')) return 'activity'
  if (name.includes('pilates')) return 'activity'
  if (name.includes('boxing') || name.includes('pugilato')) return 'dumbbell'
  if (name.includes('running') || name.includes('corsa')) return 'footprints'
  if (name.includes('cycling') || name.includes('spinning') || name.includes('bici')) return 'bike'
  if (name.includes('swimming') || name.includes('nuoto')) return 'waves'
  if (name.includes('dance') || name.includes('danza')) return 'activity'
  if (name.includes('martial') || name.includes('karate') || name.includes('judo')) return 'dumbbell'
  if (name.includes('crossfit')) return 'dumbbell'

  // Food & Beverage
  if (name.includes('espresso') || name.includes('coffee') || name.includes('caffè') || name.includes('caffe')) return 'coffee'
  if (name.includes('cappuccino')) return 'coffee'
  if (name.includes('latte')) return 'milk'
  if (name.includes('tea') || name.includes('tè')) return 'leaf'
  if (name.includes('juice') || name.includes('succo')) return 'cup-soda'
  if (name.includes('smoothie') || name.includes('frullato')) return 'cup-soda'
  if (name.includes('sandwich') || name.includes('panino')) return 'sandwich'
  if (name.includes('pizza')) return 'pizza'
  if (name.includes('pasta')) return 'utensils'
  if (name.includes('burger')) return 'sandwich'
  if (name.includes('salad') || name.includes('insalata')) return 'salad'
  if (name.includes('dessert') || name.includes('dolce') || name.includes('cake')) return 'cake'
  if (name.includes('ice cream') || name.includes('gelato')) return 'ice-cream-cone'
  if (name.includes('bread') || name.includes('pane')) return 'croissant'
  if (name.includes('croissant') || name.includes('brioche')) return 'croissant'

  // Wellness & Beauty
  if (name.includes('massage') || name.includes('massaggio')) return 'sparkles'
  if (name.includes('spa') || name.includes('sauna')) return 'sparkles'
  if (name.includes('manicure') || name.includes('nail')) return 'sparkles'
  if (name.includes('haircut') || name.includes('capelli')) return 'scissors'

  // Retail
  if (name.includes('book') || name.includes('libro')) return 'book'
  if (name.includes('shirt') || name.includes('maglietta')) return 'shirt'
  if (name.includes('shoe') || name.includes('scarpe')) return 'sport-shoe'

  // Generic fallback
  return 'package'
}
