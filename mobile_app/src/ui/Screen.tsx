import React from 'react'
import { Platform, RefreshControlProps, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { layout, colors } from '@/theme'
import AmbientBackground from '@/components/AmbientBackground'
import Txt from './Txt'

/**
 * Scrolling screen under a native navigation bar and above the native tab bar.
 * On iOS `contentInsetAdjustmentBehavior="automatic"` keeps content clear of the large title and the tab bar and
 * lets it scroll underneath them (the bars blur it). The background is transparent: the amber glow is drawn once at the root.
 */
export function ScreenScroll({
  children,
  refreshControl,
  contentStyle,
  bottomPad = 24,
  title,
}: {
  children: React.ReactNode
  refreshControl?: React.ReactElement<RefreshControlProps>
  contentStyle?: StyleProp<ViewStyle>
  bottomPad?: number
  /** Page title, shown big at the top of the content on iOS (the bar itself stays empty). */
  title?: string
}) {
  // The ScrollView stays the first child of the screen (the native large title tracks it); the glow is a sibling behind it.
  const content = (
    <>
    <ScrollView
      style={s.flex}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={refreshControl}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ paddingHorizontal: layout.margin, paddingTop: 8, paddingBottom: bottomPad }, contentStyle]}
    >
      {title && Platform.OS === 'ios' ? (
        <Txt v="largeTitle" accessibilityRole="header" style={{ marginBottom: 16 }}>
          {title}
        </Txt>
      ) : null}
      {children}
    </ScrollView>
    <AmbientBackground style={s.behind} />
    </>
  )
  // Android: the native header already sits below the status bar, so no extra inset is needed.
  return content
}

/** A fixed (non scrolling) screen with the same margins, for centred or full-height layouts. */
export function ScreenFixed({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <AmbientBackground />
      <SafeAreaView style={s.flex} edges={['top', 'bottom']}>
        <View style={[s.flex, { paddingHorizontal: layout.margin }, style]}>{children}</View>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({ flex: { flex: 1 }, behind: { zIndex: -1 } })
