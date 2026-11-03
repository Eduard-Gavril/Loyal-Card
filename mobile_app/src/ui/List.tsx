import React from 'react'
import { StyleProp, StyleSheet, Switch, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, continuous, layout } from '@/theme'
import PressableScale from './PressableScale'
import Txt from './Txt'

/**
 * Inset grouped list (like Settings): a rounded container with hairline separators.
 * Content layer: translucent fill, no blur and no glass (glass is reserved for bars and sheets).
 */
export function ListGroup({
  header,
  footer,
  children,
  style,
}: {
  header?: string
  footer?: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const rows = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={[{ marginBottom: 24 }, style]}>
      {header ? (
        <Txt v="footnote" tone="secondary" style={s.header} accessibilityRole="header">
          {header.toUpperCase()}
        </Txt>
      ) : null}
      <View style={s.group}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {row}
            {i < rows.length - 1 && <View style={s.separator} />}
          </React.Fragment>
        ))}
      </View>
      {footer ? (
        <Txt v="footnote" tone="secondary" style={s.footer}>
          {footer}
        </Txt>
      ) : null}
    </View>
  )
}

/** One row: optional icon tile, title/subtitle, trailing value / control / chevron. Min 52pt tall. */
export function ListRow({
  icon,
  iconColor = colors.primary,
  leading,
  title,
  subtitle,
  value,
  right,
  onPress,
  chevron,
  destructive,
  switchValue,
  onSwitchChange,
  disabled,
  accessibilityLabel,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  iconColor?: string
  /** Replaces the icon tile (logo, avatar...) */
  leading?: React.ReactNode
  title: string
  subtitle?: string
  value?: string
  right?: React.ReactNode
  onPress?: () => void
  chevron?: boolean
  destructive?: boolean
  switchValue?: boolean
  onSwitchChange?: (v: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}) {
  const isSwitch = switchValue !== undefined
  const tappable = !!onPress && !isSwitch
  const content = (
    <View style={s.row}>
      {leading}
      {!leading && icon && (
        <View style={[s.iconTile, { backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft }]}>
          <Ionicons name={icon} size={18} color={destructive ? colors.danger : iconColor} />
        </View>
      )}
      <View style={s.rowText}>
        <Txt v="body" tone={destructive ? 'danger' : 'primary'} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="footnote" tone="secondary" numberOfLines={3}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt v="body" tone="secondary" numberOfLines={1} style={s.value}>
          {value}
        </Txt>
      ) : null}
      {right}
      {isSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.fill, true: colors.primary }}
          thumbColor="#fff"
          ios_backgroundColor={colors.fill}
        />
      )}
      {(chevron ?? tappable) && <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />}
    </View>
  )

  if (!tappable) return content
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.985}
    >
      {content}
    </PressableScale>
  )
}

const s = StyleSheet.create({
  header: { marginLeft: 16, marginBottom: 6, letterSpacing: 0 },
  footer: { marginHorizontal: 16, marginTop: 8 },
  group: {
    backgroundColor: colors.grouped,
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...continuous,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 16 },
  row: { minHeight: layout.rowMin, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...continuous },
  rowText: { flex: 1, gap: 1 },
  value: { maxWidth: '45%' },
})
