import { Stack } from 'expo-router'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { SettingsProvider } from '@/lib/settingsContext'
import SettingsSaveButton from '@/components/SettingsSaveButton'
import { navBase, inlineTitle } from '@/ui/nav'

/**
 * Settings is a small hierarchy of lists, like the system Settings app: a menu (index) that pushes one screen per topic.
 * The business data is loaded once here and shared, so Save in the bar covers every screen that edits it.
 */
export default function SettingsLayout() {
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const inline = inlineTitle as object
  const save = () => <SettingsSaveButton />

  return (
    <SettingsProvider>
      <Stack screenOptions={{ ...(navBase as object), headerShown: true }}>
        <Stack.Screen name="index" options={{ title: a.settings, headerRight: save, ...inline }} />
        <Stack.Screen name="profile" options={{ title: a.settingsProfile, headerRight: save, ...inline }} />
        <Stack.Screen name="location" options={{ title: a.settingsLocation, headerRight: save, ...inline }} />
        <Stack.Screen name="plan" options={{ title: a.settingsPlan, ...inline }} />
        <Stack.Screen name="team" options={{ title: a.settingsStaff, ...inline }} />
        <Stack.Screen name="danger" options={{ title: a.deleteBizTitle, ...inline }} />
      </Stack>
    </SettingsProvider>
  )
}
