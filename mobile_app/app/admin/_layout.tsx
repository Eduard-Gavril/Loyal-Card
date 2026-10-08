import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAdminStore } from '@/store'
import { useTheme } from '@/theme'

// Routes a 'staff' admin may open — mirrors the web app's requireOwner()
// gate in App.tsx, which sends staff anywhere else straight to /admin/scan.
// 'login' isn't listed here: it's handled by the isLoginScreen check above.
const STAFF_ALLOWED_SEGMENTS = new Set(['scanner'])

export default function AdminLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { user, tenantId, role } = useAdminStore()
  const colors = useTheme()

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

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  )
}
