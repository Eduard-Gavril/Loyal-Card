import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, continuous } from '@/theme'
import Button from './Button'
import Txt from './Txt'

/** Empty state: one icon, one headline, one line of help, one action. */
export default function Empty({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={s.wrap}>
      <View style={s.icon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Txt v="title3" style={s.center}>
        {title}
      </Txt>
      {message ? (
        <Txt v="subhead" tone="secondary" style={s.center}>
          {message}
        </Txt>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: 12, alignSelf: 'stretch' }} /> : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  icon: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...continuous },
  center: { textAlign: 'center' },
})
