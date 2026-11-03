import React, { useState } from 'react'
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { colors, continuous } from '@/theme'
import { fireHaptic } from './PressableScale'
import { EASE_OUT } from './motion'
import Txt from './Txt'

/** Segmented control: a sliding thumb on a fill track. 36pt tall segments inside a 44pt hit area. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const [width, setWidth] = useState(0)
  const reduced = useReducedMotion()
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const segment = width > 0 ? (width - 4) / options.length : 0
  const x = useSharedValue(0)

  React.useEffect(() => {
    x.set(reduced ? index * segment : withTiming(index * segment, { duration: 220, easing: EASE_OUT }))
  }, [index, segment, reduced, x])

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }))

  return (
    <View style={s.track} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {segment > 0 && <Animated.View style={[s.thumb, { width: segment }, thumb]} />}
      {options.map((o) => {
        const selected = o.value === value
        return (
          <Pressable
            key={o.value}
            style={s.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                fireHaptic('selection')
                onChange(o.value)
              }
            }}
          >
            <Txt v="subhead" tone={selected ? 'primary' : 'secondary'} style={{ fontWeight: selected ? '600' : '400' }} numberOfLines={1}>
              {o.label}
            </Txt>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 11, padding: 2, minHeight: 44, ...continuous },
  thumb: { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: 9, backgroundColor: 'rgba(255,226,186,0.20)', ...continuous },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
})
