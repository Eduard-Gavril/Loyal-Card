import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { useSettings } from '@/lib/settingsContext'
import PlanCard from '@/components/PlanCard'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'

/** The subscription plan with usage meters (plans are managed from the website, see PlanCard). */
export default function SettingsPlan() {
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const { plan, planLoading } = useSettings()

  return (
    <ScreenScroll title={a.settingsPlan} bottomPad={48}>
      {plan ? (
        <PlanCard usage={plan} />
      ) : planLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  center: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
})
