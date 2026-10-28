import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Subscription plan of the business and how much of it is used. The numbers come from the database
// (plan_limits table + get_plan_usage()), which is also what enforces them, so the screens only display it.

export type PlanId = 'starter' | 'business' | 'pro' | 'enterprise'

export interface PlanUsage {
  plan: PlanId
  effective_plan: PlanId
  plan_status: 'active' | 'past_due' | 'canceled'
  plan_expires_at: string | null
  /** null = unlimited */
  limits: {
    stores: number | null
    active_clients: number | null
    rules: number | null
    staff: number | null
    can_export: boolean
    can_white_label: boolean
    can_multi_level: boolean
  }
  usage: { stores: number; active_clients: number; rules: number; staff: number }
}

export const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  business: 'Business',
  pro: 'Professional',
  enterprise: 'Enterprise',
}

export async function fetchPlanUsage(tenantId: string): Promise<PlanUsage | null> {
  const { data, error } = await supabase.rpc('get_plan_usage', { p_tenant: tenantId })
  if (error || !data) return null
  return data as PlanUsage
}

/** Plan of the signed-in business. `usage` stays null if it could not be loaded: screens then behave as before (no limits shown). */
export function usePlanUsage(tenantId: string | null) {
  const [usage, setUsage] = useState<PlanUsage | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setUsage(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setUsage(await fetchPlanUsage(tenantId))
    } catch {
      setUsage(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { usage, loading, reload }
}

/** True for an error raised by the database/functions because of the plan (limit reached or feature not included). */
export function isPlanError(err: unknown): boolean {
  const msg = typeof err === 'string' ? err : (err as { message?: string } | null)?.message ?? ''
  return /PLAN_(LIMIT|FEATURE|PROTECTED)/.test(msg)
}

/** "PLAN_LIMIT: your Starter plan allows 1 ..." -> "Your Starter plan allows 1 ..." */
export function planErrorText(err: unknown): string {
  const msg = typeof err === 'string' ? err : (err as { message?: string } | null)?.message ?? ''
  const text = msg.replace(/^.*?PLAN_(LIMIT|FEATURE|PROTECTED):\s*/, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
