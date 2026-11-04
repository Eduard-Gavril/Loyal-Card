import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, continuous } from '@/theme'
import Txt from './Txt'

/** A padded block of fields, with a footnote header above it (same rhythm as a ListGroup). */
export default function FormGroup({ header, footer, children }: { header?: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      {header ? (
        <Txt v="footnote" tone="secondary" style={s.header} accessibilityRole="header">
          {header.toUpperCase()}
        </Txt>
      ) : null}
      <View style={s.form}>{children}</View>
      {footer ? (
        <Txt v="footnote" tone="secondary" style={s.footer}>
          {footer}
        </Txt>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  header: { marginLeft: 16, marginBottom: 6 },
  footer: { marginHorizontal: 16, marginTop: 8 },
  form: { gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...continuous },
})
