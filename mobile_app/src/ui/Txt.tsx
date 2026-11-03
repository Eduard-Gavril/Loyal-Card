import React from 'react'
import { Text, TextProps } from 'react-native'
import { colors, ty, TextStyleName } from '@/theme'

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'tint' | 'onTint' | 'danger' | 'success'

const TONES: Record<Tone, string> = {
  primary: colors.label,
  secondary: colors.labelSecondary,
  tertiary: colors.labelTertiary,
  tint: colors.primary,
  onTint: colors.onPrimary,
  danger: colors.danger,
  success: colors.success,
}

/** Text with an Apple text style (`v`) and a semantic colour (`tone`). Scales with the system text size. */
export default function Txt({ v = 'body', tone = 'primary', style, ...rest }: TextProps & { v?: TextStyleName; tone?: Tone }) {
  return <Text {...rest} style={[ty[v], { color: TONES[tone] }, style]} />
}
