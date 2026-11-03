import React from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { PLAN_NAMES, UPGRADE_URL, type PlanUsage } from '@/lib/plan'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

function Meter({ label, used, max, unlimited }: { label: string; used: number; max: number | null; unlimited: string }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const ratio = max === null ? 0 : max === 0 ? 1 : Math.min(used / max, 1)
  const fill = ratio >= 1 ? colors.danger : ratio >= 0.8 ? colors.violetLight : colors.primary
  return (
    <View style={s.meter}>
      <View style={s.meterTop}>
        <Text style={s.meterLabel}>{label}</Text>
        <Text style={s.meterValue}>{used} / {max === null ? unlimited : max}</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${ratio * 100}%`, backgroundColor: fill }]} />
      </View>
    </View>
  )
}

/** The business's plan with usage meters and a warning at 80% / 100% of a limit. */
export default function PlanCard({ usage }: { usage: PlanUsage }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const rows = [
    { label: a.planStores, used: usage.usage.stores, max: usage.limits.stores },
    { label: a.planClients, used: usage.usage.active_clients, max: usage.limits.active_clients },
    { label: a.planRules, used: usage.usage.rules, max: usage.limits.rules },
    { label: a.planStaff, used: usage.usage.staff, max: usage.limits.staff },
  ]
  const ratios = rows.map((r) => (r.max === null ? 0 : r.max === 0 ? (r.used > 0 ? 1 : 0) : r.used / r.max))
  const worst = Math.max(0, ...ratios)
  const full = rows.some((r) => r.max !== null && r.max > 0 && r.used >= r.max)
  const top = usage.effective_plan === 'enterprise'

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>{a.planTitle}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{PLAN_NAMES[usage.effective_plan]}</Text>
        </View>
      </View>

      {usage.effective_plan !== usage.plan && (
        <Text style={s.warn}>{a.planDowngraded(PLAN_NAMES[usage.effective_plan])}</Text>
      )}

      <View style={s.meters}>
        {rows.map((r) => (
          <Meter key={r.label} label={r.label} used={r.used} max={r.max} unlimited={a.planUnlimited} />
        ))}
      </View>

      {worst >= 0.8 && (
        <Text style={[s.note, { color: full ? colors.danger : colors.violetLight }]}>
          {full ? a.planReached : a.planNear}
        </Text>
      )}

      {!top && (
        <TouchableOpacity style={s.upgradeBtn} onPress={() => Linking.openURL(UPGRADE_URL)} activeOpacity={0.85}>
          <Ionicons name="arrow-up-circle-outline" size={18} color={colors.onPrimary} />
          <Text style={s.upgradeText}>{a.planUpgrade}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  card: { padding: 18, marginBottom: 24, gap: 14, borderRadius: radius.xl, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  badge: {
    backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder, borderWidth: 1,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { color: colors.violetLight, fontSize: 12, fontWeight: '700' },
  warn: { color: colors.violetLight, fontSize: 13, lineHeight: 18 },
  meters: { gap: 12 },
  meter: { gap: 6 },
  meterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meterLabel: { color: colors.inkMid, fontSize: 13 },
  meterValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  track: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,226,186,0.1)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  note: { fontSize: 13, lineHeight: 18 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12,
    ...shadows.primaryBtn,
  },
  upgradeText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
}))
