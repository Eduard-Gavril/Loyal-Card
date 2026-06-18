import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function TabLayout() {
  const { language, totalRewards } = useClientStore()
  const t = getTranslation(language)
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0d2e',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#4b5563',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: t.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t.discoverPartners,
          tabBarLabel: t.tabs.partners,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.dashboard.title,
          tabBarLabel: t.tabs.myCards,
          tabBarBadge: totalRewards > 0 ? totalRewards : undefined,
          tabBarBadgeStyle: { backgroundColor: '#f59e0b', color: '#000', fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile.title,
          tabBarLabel: t.tabs.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
