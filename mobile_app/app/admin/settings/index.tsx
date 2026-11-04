import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { PLAN_NAMES } from '@/lib/plan'
import { useSettings } from '@/lib/settingsContext'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Txt from '@/ui/Txt'

/** The Settings menu: one row per topic, each pushing its own screen (same grouping as the tabs of the web page). */
export default function AdminSettingsMenu() {
  const router = useRouter()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const { form, loading, plan, isOwner, deletionScheduledAt } = useSettings()

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Txt v="subhead" tone="secondary">
          {t.loading}
        </Txt>
      </View>
    )
  }

  const hasPosition = form.latitude != null && form.longitude != null

  return (
    <ScreenScroll title={a.settings} bottomPad={48}>
      <ListGroup>
        <ListRow icon="storefront-outline" title={a.settingsProfile} value={form.name} onPress={() => router.push('/admin/settings/profile')} />
        <ListRow
          icon="location-outline"
          title={a.settingsLocation}
          value={hasPosition ? form.city || undefined : a.settingsNotSet}
          onPress={() => router.push('/admin/settings/location')}
        />
        <ListRow
          icon="card-outline"
          title={a.settingsPlan}
          value={plan ? PLAN_NAMES[plan.effective_plan] : undefined}
          onPress={() => router.push('/admin/settings/plan')}
        />
      </ListGroup>

      {/* Owner only: staff can't reach Settings at all, the check stays as defense-in-depth */}
      {isOwner && (
        <ListGroup>
          <ListRow icon="people-outline" title={a.settingsStaff} onPress={() => router.push('/admin/settings/team')} />
        </ListGroup>
      )}

      {/* The destructive entry sits alone at the bottom, in the danger colour */}
      {isOwner && (
        <ListGroup footer={deletionScheduledAt ? a.deleteBizScheduled(new Date(deletionScheduledAt).toLocaleDateString()) : undefined}>
          <ListRow destructive icon="trash-outline" title={a.deleteBizTitle} onPress={() => router.push('/admin/settings/danger')} />
        </ListGroup>
      )}
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
})
