import { ActivityIndicator, StyleSheet } from 'react-native'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { useSettings } from '@/lib/settingsContext'
import { colors } from '@/theme'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

/** Save action in the navigation bar. Only present while there is something to save, so the bar stays empty otherwise. */
export default function SettingsSaveButton() {
  const { dirty, saving, save } = useSettings()
  const { language } = useClientStore()
  const label = getTranslation(language).admin.save
  if (!dirty && !saving) return null
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={save}
      disabled={saving}
      haptic="light"
      hitSlop={8}
      style={s.btn}
    >
      {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Txt v="headline" tone="tint">{label}</Txt>}
    </PressableScale>
  )
}

const s = StyleSheet.create({
  btn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
})
