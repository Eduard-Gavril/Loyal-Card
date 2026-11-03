import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, continuous } from '@/theme'
import Txt from './Txt'

/**
 * The loyalty card itself: the one rich, branded object on screen. Amber gradient (the site's card),
 * stamps as dots, progress and reward state at the bottom. Text is white on a dark enough amber (>= 4.5:1).
 */
export default function StampCard({
  title,
  subtitle,
  count,
  total,
  rewards = 0,
  stampsLabel,
  rewardLabel,
  readyLabel,
  compact = false,
}: {
  title: string
  subtitle?: string
  count: number
  total: number
  rewards?: number
  stampsLabel: string
  rewardLabel?: string
  readyLabel?: string
  compact?: boolean
}) {
  const complete = count >= total
  const dots = Math.min(total, 12)
  return (
    <LinearGradient
      colors={['#C97A1E', '#8A4A12', '#5A300C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.card, compact && s.compact]}
      accessible
      accessibilityLabel={`${title}. ${count} / ${total} ${stampsLabel}${rewards > 0 && readyLabel ? `. ${readyLabel}` : ''}`}
    >
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Txt v="headline" tone="primary" style={s.white} numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt v="footnote" style={s.whiteSoft} numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        <Ionicons name="qr-code" size={compact ? 20 : 24} color="rgba(255,255,255,0.85)" />
      </View>

      <View style={s.dots}>
        {Array.from({ length: dots }).map((_, i) => {
          const filled = i < count
          return (
            <View key={i} style={[s.dot, filled && s.dotFilled]}>
              {filled && <Ionicons name="checkmark" size={13} color="#7A3F10" />}
            </View>
          )
        })}
      </View>

      <View style={s.bottom}>
        <View>
          <Txt v="caption1" style={s.whiteSoft}>
            {stampsLabel.toUpperCase()}
          </Txt>
          <Txt v="title2" style={s.white}>
            {count} / {total}
          </Txt>
        </View>
        {rewards > 0 || complete ? (
          <View style={s.chip}>
            <Ionicons name="gift" size={14} color="#FFF3DC" />
            <Txt v="footnote" style={[s.white, { fontWeight: '600' }]}>
              {readyLabel ?? rewardLabel}
              {rewards > 1 ? ` ×${rewards}` : ''}
            </Txt>
          </View>
        ) : rewardLabel ? (
          <View style={[s.chip, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
            <Ionicons name="gift-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Txt v="footnote" style={s.whiteSoft}>
              {rewardLabel}
            </Txt>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 26, padding: 22, gap: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,226,186,0.35)', ...continuous },
  compact: { padding: 18, gap: 14, borderRadius: 22 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.78)' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  dotFilled: { backgroundColor: '#FFF3DC', borderColor: '#FFF3DC' },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
})
