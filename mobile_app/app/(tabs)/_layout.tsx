import { NativeTabs } from 'expo-router/native-tabs'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors } from '@/theme'

/**
 * The platform's real tab bar (Liquid Glass on iOS 26, system tab bar before, Material on Android).
 * Four peer sections, single-word labels, filled symbol when selected. Tabs never slide.
 */
export default function TabLayout() {
  const { language, totalRewards } = useClientStore()
  const t = getTranslation(language)

  return (
    <NativeTabs
      tintColor={colors.primary}
      iconColor={{ default: colors.labelSecondary, selected: colors.primary }}
      labelStyle={{ default: { color: colors.labelSecondary }, selected: { color: colors.primary } }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t.tabs.home}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="partners">
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
        <NativeTabs.Trigger.Label>{t.tabs.partners}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Icon sf={{ default: 'creditcard', selected: 'creditcard.fill' }} md="credit_card" />
        <NativeTabs.Trigger.Label>{t.tabs.myCards}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={totalRewards <= 0}>{String(totalRewards)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>{t.tabs.profile}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
