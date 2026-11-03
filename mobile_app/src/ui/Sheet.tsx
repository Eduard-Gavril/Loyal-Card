import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { colors } from '@/theme'
import AmbientBackground from '@/components/AmbientBackground'
import PressableScale from './PressableScale'
import Txt from './Txt'

/**
 * A page sheet (native UISheet on iOS, full screen on Android): a Cancel / title / Done bar over the content.
 * The bar is the functional layer, so it carries the blur; the content below it does not.
 */
export default function Sheet({
  visible,
  title,
  onClose,
  onDone,
  doneLabel,
  cancelLabel,
  doneDisabled,
  children,
}: {
  visible: boolean
  title: string
  onClose: () => void
  onDone?: () => void
  doneLabel?: string
  cancelLabel: string
  doneDisabled?: boolean
  children: React.ReactNode
}) {
  // Reduce Transparency: the bar becomes opaque instead of blurred
  const [opaque, setOpaque] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setOpaque).catch(() => {})
  }, [])
  const Bar: React.ElementType = opaque ? View : BlurView
  const barProps = opaque ? { style: [s.bar, { backgroundColor: colors.bgDeep }] } : { intensity: 40, tint: 'dark', style: s.bar }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <AmbientBackground />
        <SafeAreaView style={s.safe} edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}>
          <Bar {...barProps}>
            <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel={cancelLabel} hitSlop={8} style={s.barBtn}>
              <Txt v="body" tone="tint">
                {cancelLabel}
              </Txt>
            </PressableScale>
            <Txt v="headline" numberOfLines={1} style={s.title} accessibilityRole="header">
              {title}
            </Txt>
            {onDone && doneLabel ? (
              <PressableScale
                onPress={onDone}
                disabled={doneDisabled}
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={doneLabel}
                hitSlop={8}
                style={[s.barBtn, { alignItems: 'flex-end' }, doneDisabled && { opacity: 0.4 }]}
              >
                <Txt v="headline" tone="tint">
                  {doneLabel}
                </Txt>
              </PressableScale>
            ) : (
              <View style={s.barBtn} />
            )}
          </Bar>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={s.content}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  barBtn: { minWidth: 72, minHeight: 44, justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
})
