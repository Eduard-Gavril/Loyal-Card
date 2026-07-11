import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAdminStore } from '@/store'
import { colors } from '@/theme'

export default function AdminLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { user, tenantId } = useAdminStore()

  useEffect(() => {
    const isLoginScreen = segments.at(-1) === 'login'
    if (!isLoginScreen && (!user || !tenantId)) {
      // Stale or invalid session — go back to login
      router.replace('/admin/login')
    }
  }, [user, tenantId, segments])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  )
}
