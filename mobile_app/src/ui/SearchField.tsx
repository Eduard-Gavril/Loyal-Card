import React from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, continuous, ty } from '@/theme'
import PressableScale from './PressableScale'

/** Search field in the page (under the title): magnifier, Body text, clear button. 44pt tall, readable placeholder. */
export default function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder: string
}) {
  return (
    <View style={s.wrap}>
      <Ionicons name="search" size={18} color={colors.labelSecondary} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        keyboardAppearance="dark"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <PressableScale accessibilityRole="button" accessibilityLabel="Clear" onPress={() => onChangeText('')} hitSlop={8} style={s.clear}>
          <Ionicons name="close-circle" size={20} color={colors.labelSecondary} />
        </PressableScale>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.fill,
    marginBottom: 14,
    ...continuous,
  },
  input: { ...ty.body, flex: 1, color: colors.label, paddingVertical: 10 },
  clear: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
})
