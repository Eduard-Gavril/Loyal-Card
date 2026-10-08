import { Text, StyleProp, TextStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { resolveProductIcon } from '@/lib/categoryIcons'

interface ProductIconProps {
  emoji?: string | null
  size?: number
  color?: string
  // Applied only to the emoji-text fallback, so callers can match the
  // surrounding font size when this is nested inline inside another <Text>.
  textStyle?: StyleProp<TextStyle>
}

// Renders a product's metadata.emoji value correctly either way it might be
// stored: as a Lucide icon name (written by the web admin's icon picker) or
// as a legacy literal emoji character. Safe to nest inside another <Text>.
export default function ProductIcon({ emoji, size = 18, color, textStyle }: ProductIconProps) {
  const iconName = resolveProductIcon(emoji)
  if (iconName) return <Ionicons name={iconName} size={size} color={color} />
  return <Text style={[{ fontSize: size }, textStyle]}>{emoji ?? '🛍️'}</Text>
}
