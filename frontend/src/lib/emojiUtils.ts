/**
 * Get appropriate emoji for a product based on its name/type
 * Useful for businesses like gyms, cafes, restaurants, etc.
 */
export function getProductEmoji(productName: string, metadata?: { emoji?: string, type?: string }): string {
  // If emoji is already set in metadata, use it
  if (metadata?.emoji) {
    return metadata.emoji
  }

  const name = productName.toLowerCase()

  // Fitness & Gym related
  if (name.includes('fitness') || name.includes('gym')) return '💪'
  if (name.includes('aerobic') || name.includes('cardio')) return '🤸'
  if (name.includes('weights') || name.includes('pesi') || name.includes('sollevamento')) return '🏋️'
  if (name.includes('yoga')) return '🧘'
  if (name.includes('pilates')) return '🧘‍♀️'
  if (name.includes('boxing') || name.includes('pugilato')) return '🥊'
  if (name.includes('running') || name.includes('corsa')) return '🏃'
  if (name.includes('cycling') || name.includes('spinning') || name.includes('bici')) return '🚴'
  if (name.includes('swimming') || name.includes('nuoto')) return '🏊'
  if (name.includes('dance') || name.includes('danza')) return '💃'
  if (name.includes('martial') || name.includes('karate') || name.includes('judo')) return '🥋'
  if (name.includes('crossfit')) return '🏋️‍♂️'

  // Food & Beverage
  if (name.includes('espresso') || name.includes('coffee') || name.includes('caffè') || name.includes('caffe')) return '☕'
  if (name.includes('cappuccino')) return '☕'
  if (name.includes('latte')) return '🥛'
  if (name.includes('tea') || name.includes('tè')) return '🍵'
  if (name.includes('juice') || name.includes('succo')) return '🧃'
  if (name.includes('smoothie') || name.includes('frullato')) return '🥤'
  if (name.includes('sandwich') || name.includes('panino')) return '🥪'
  if (name.includes('pizza')) return '🍕'
  if (name.includes('pasta')) return '🍝'
  if (name.includes('burger')) return '🍔'
  if (name.includes('salad') || name.includes('insalata')) return '🥗'
  if (name.includes('dessert') || name.includes('dolce') || name.includes('cake')) return '🍰'
  if (name.includes('ice cream') || name.includes('gelato')) return '🍨'
  if (name.includes('bread') || name.includes('pane')) return '🍞'
  if (name.includes('croissant') || name.includes('brioche')) return '🥐'

  // Wellness & Beauty
  if (name.includes('massage') || name.includes('massaggio')) return '💆'
  if (name.includes('spa') || name.includes('sauna')) return '🧖'
  if (name.includes('manicure') || name.includes('nail')) return '💅'
  if (name.includes('haircut') || name.includes('capelli')) return '💇'

  // Retail
  if (name.includes('book') || name.includes('libro')) return '📚'
  if (name.includes('shirt') || name.includes('maglietta')) return '👕'
  if (name.includes('shoe') || name.includes('scarpe')) return '👟'

  // Generic fallback - use a neutral icon
  return '🎯'
}
