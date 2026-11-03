import React from 'react'
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native'
import { colors, continuous, ty } from '@/theme'
import Txt from './Txt'

/** Text field: filled 50pt box, Body text, label above in Footnote. Placeholder uses the tertiary label colour. */
export default function Field({
  label,
  error,
  accessory,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string; accessory?: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
          {label}
        </Txt>
      ) : null}
      <View>
      <TextInput
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        keyboardAppearance="dark"
        accessibilityLabel={label ?? rest.placeholder}
        {...rest}
        style={[s.input, rest.multiline && s.multiline, error ? s.error : null, accessory ? { paddingRight: 52 } : null, style]}
      />
      {accessory ? <View style={s.accessory}>{accessory}</View> : null}
      </View>
      {error ? (
        <Txt v="footnote" tone="danger" style={{ marginLeft: 4 }}>
          {error}
        </Txt>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  input: {
    ...ty.body,
    color: colors.label,
    backgroundColor: colors.fill,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    ...continuous,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  error: { borderColor: colors.dangerBorder },
  accessory: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
})
