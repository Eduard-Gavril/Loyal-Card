import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { colors } from '@/theme'

/**
 * The warm glow behind every screen: two soft amber lights, one top-left and one bottom-right,
 * on the near-black background (same as the website). Static: no animation, so it costs nothing at runtime.
 */
export default function AmbientBackground({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="glowA" cx="8%" cy="6%" rx="70%" ry="42%" fx="8%" fy="6%" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor="#C8741A" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#C8741A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowB" cx="95%" cy="96%" rx="75%" ry="42%" fx="95%" fy="96%" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor="#B8451A" stopOpacity="0.42" />
            <Stop offset="1" stopColor="#B8451A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowA)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowB)" />
      </Svg>
    </View>
  )
}
