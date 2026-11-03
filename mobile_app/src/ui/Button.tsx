import React from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, continuous, layout } from '@/theme'
import PressableScale from './PressableScale'
import Txt from './Txt'

type Variant = 'filled' | 'tinted' | 'plain' | 'destructive'

/**
 * One filled (amber) button per screen at most; everything else is tinted or plain.
 * 50pt tall (44pt minimum target), 14pt continuous corners, Headline text style.
 */
export default function Button({
  title,
  onPress,
  variant = 'filled',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityLabel,
}: {
  title: string
  onPress?: () => void
  variant?: Variant
  icon?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  disabled?: boolean
  compact?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const filled = variant === 'filled'
  const fg = filled ? colors.onPrimary : variant === 'destructive' ? colors.danger : colors.primary
  const bg =
    filled ? colors.primary : variant === 'tinted' ? colors.primarySoft : variant === 'destructive' ? colors.dangerSoft : 'transparent'
  const off = disabled || loading

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      haptic={filled ? 'light' : 'none'}
      onPress={onPress}
      hitSlop={compact ? 6 : 0}
      style={[s.base, compact && s.compact, { backgroundColor: bg }, disabled && s.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.inner}>
          {icon && <Ionicons name={icon} size={compact ? 17 : 20} color={fg} />}
          <Txt v={compact ? 'subhead' : 'headline'} style={{ color: fg, fontWeight: '600' }} numberOfLines={1}>
            {title}
          </Txt>
        </View>
      )}
    </PressableScale>
  )
}

const s = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...continuous,
  },
  compact: { minHeight: 44, paddingHorizontal: 16 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.4 },
})
