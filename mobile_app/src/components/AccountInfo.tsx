import React from 'react'
import { useRouter } from 'expo-router'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { PLAN_NAMES, usePlanUsage } from '@/lib/plan'
import { ListGroup, ListRow } from '@/ui/List'

/** Who is signed in and with what rights: email, account type (owner / staff / super admin) and, for the shop, the plan. */
export default function AccountInfo({ showPlan = true }: { showPlan?: boolean }) {
  const router = useRouter()
  const { user, role, tenantId } = useAdminStore()
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const { usage } = usePlanUsage(showPlan ? tenantId : null)

  const roleLabel = role === 'owner' ? a.roleOwner : role === 'staff' ? a.roleStaff : role === 'super_admin' ? a.roleSuperAdmin : String(role ?? '')

  return (
    <ListGroup header={a.accountTitle}>
      <ListRow icon="person-circle-outline" title={user?.email ?? ''} subtitle={`${a.accountTypeLabel}: ${roleLabel}`} />
      {showPlan && usage ? (
        <ListRow
          icon="ribbon-outline"
          title={a.planLabel}
          value={PLAN_NAMES[usage.effective_plan]}
          onPress={role === 'owner' ? () => router.push('/admin/settings') : undefined}
        />
      ) : null}
    </ListGroup>
  )
}
