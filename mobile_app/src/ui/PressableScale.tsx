import React from 'react'
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { EASE_OUT, PRESS_IN_MS, PRESS_OUT_MS, PRESS_SCALE } from './motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type HapticKind = 'none' | 'selection' | 'light' | 'medium'

export function fireHaptic(kind: HapticKind) {
  if (kind === 'selection') Haptics.selectionAsync().catch(() => {})
  else if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  else if (kind === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

/**
 * Pressable with physical feedback: shrinks to 0.97 on press-in (before the tap completes) and eases back on release.
 * One optional haptic per press, fired on commit. Motion is skipped when the system asks for reduced motion.
 */
export default function PressableScale({
  style,
  haptic = 'none',
  scaleTo = PRESS_SCALE,
  onPress,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>
  haptic?: HapticKind
  scaleTo?: number
  children?: React.ReactNode
}) {
  const scale = useSharedValue(1)
  const reduced = useReducedMotion()
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        if (!reduced) scale.set(withTiming(scaleTo, { duration: PRESS_IN_MS, easing: EASE_OUT }))
        rest.onPressIn?.(e)
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: PRESS_OUT_MS, easing: EASE_OUT }))
        rest.onPressOut?.(e)
      }}
      onPress={(e) => {
        fireHaptic(haptic)
        onPress?.(e)
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  )
}
