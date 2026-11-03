import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { largeTitle, navBase, inlineTitle } from '@/ui/nav'

// Routes a 'staff' admin may open — mirrors the web app's requireOwner()
// gate in App.tsx, which sends staff anywhere else straight to /admin/scan.
// 'login' isn't listed here: it's handled by the isLoginScreen check above.
const STAFF_ALLOWED_SEGMENTS = new Set(['scanner'])

export default function AdminLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { user, tenantId, role } = useAdminStore()
  const { language } = useClientStore()
  const a = getTranslation(language).admin

  useEffect(() => {
    const isLoginScreen = segments.at(-1) === 'login'
    if (!isLoginScreen && (!user || !tenantId)) {
      // Stale or invalid session — go back to login
      router.replace('/admin/login')
      return
    }
    if (!isLoginScreen && role === 'staff' && !STAFF_ALLOWED_SEGMENTS.has(segments.at(-1) ?? '')) {
      // Staff accounts are scan-only — same restriction as the web app.
      router.replace('/admin/scanner')
    }
  }, [user, tenantId, role, segments])

  const large = largeTitle as object
  const inline = inlineTitle as object

  return (
    <Stack screenOptions={{ ...(navBase as object), headerShown: true }}>
      <Stack.Screen name="login" options={{ title: '', ...inline }} />
      <Stack.Screen name="dashboard" options={{ title: a.title, headerBackVisible: false, gestureEnabled: false, ...large }} />
      <Stack.Screen name="scanner" options={{ title: a.scanCard, ...inline }} />
      <Stack.Screen name="products" options={{ title: a.products, ...large }} />
      <Stack.Screen name="clients" options={{ title: a.clients, ...large }} />
      <Stack.Screen name="scan-history" options={{ title: a.history, ...large }} />
      <Stack.Screen name="reports" options={{ title: a.reports, ...large }} />
      <Stack.Screen name="settings" options={{ title: a.settings, ...large }} />
    </Stack>
  )
}
