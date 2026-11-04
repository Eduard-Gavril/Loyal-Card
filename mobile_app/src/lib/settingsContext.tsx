import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useRouter, useSegments } from 'expo-router'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { usePlanUsage, isPlanError, planErrorText, type PlanUsage } from '@/lib/plan'

export interface TenantSettings {
  name: string
  logo_url: string
  brand_color: string
  welcome_message: string
  active: boolean
  address: string
  city: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  type: string
  description: string
}

const EMPTY: TenantSettings = {
  name: '',
  logo_url: '',
  brand_color: '#7c3aed',
  welcome_message: '',
  active: true,
  address: '',
  city: '',
  postal_code: '',
  latitude: null,
  longitude: null,
  type: '',
  description: '',
}

interface SettingsContextValue {
  form: TenantSettings
  setForm: React.Dispatch<React.SetStateAction<TenantSettings>>
  loading: boolean
  saving: boolean
  /** True when the form differs from what is saved: drives the Save button in the bar. */
  dirty: boolean
  save: () => Promise<void>
  plan: PlanUsage | null
  planLoading: boolean
  canLogo: boolean
  isOwner: boolean
  /** Set while the business is in its 14 day deletion grace period. */
  deletionScheduledAt: string | null
  setDeletionScheduledAt: (v: string | null) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}

/**
 * Holds the business settings once for every sub-screen of Settings (Profile, Location...), so a change made in one
 * screen survives going back to the menu and is saved with the single Save button in the bar, like the web page.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const { tenantId, role } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const isOwner = role === 'owner'
  const { usage: plan, loading: planLoading } = usePlanUsage(tenantId)
  const canLogo = !plan || plan.limits.can_white_label

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TenantSettings>(EMPTY)
  const [originalForm, setOriginalForm] = useState<TenantSettings | null>(null)
  const [rawMetadata, setRawMetadata] = useState<Record<string, any>>({})
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('name, logo_url, brand_color, metadata, active, deletion_scheduled_at, address, city, postal_code, latitude, longitude')
        .eq('id', tenantId)
        .single()
      if (error) throw error
      if (data) {
        const meta = (data.metadata as Record<string, any>) ?? {}
        setRawMetadata(meta)
        setDeletionScheduledAt((data as any).deletion_scheduled_at ?? null)
        const loaded: TenantSettings = {
          name: data.name ?? '',
          logo_url: data.logo_url ?? '',
          brand_color: data.brand_color ?? '#7c3aed',
          welcome_message: meta.welcome_message ?? '',
          active: data.active ?? true,
          address: (data as any).address ?? '',
          city: (data as any).city ?? '',
          postal_code: (data as any).postal_code ?? '',
          latitude: (data as any).latitude != null ? Number((data as any).latitude) : null,
          longitude: (data as any).longitude != null ? Number((data as any).longitude) : null,
          type: meta.type ?? '',
          description: meta.description ?? '',
        }
        setForm(loaded)
        setOriginalForm(loaded)
      }
    } catch (e: any) {
      Alert.alert('Error', isPlanError(e) ? planErrorText(e) : e?.message ?? a.errorSaveMsg)
    } finally {
      setLoading(false)
    }
  }

  // A missing required field sends the owner to the screen that holds it (the web page switches tab the same way).
  function goTo(screen: 'profile' | 'location') {
    if (segments.at(-1) !== screen) router.push(`/admin/settings/${screen}`)
  }

  async function save() {
    if (!tenantId) return
    if (!form.name.trim()) { goTo('profile'); Alert.alert('Error', a.shopNameLabel); return }
    if (!form.type) { goTo('location'); Alert.alert('Error', a.typeRequired); return }
    if (form.latitude == null || form.longitude == null) { goTo('location'); Alert.alert('Error', a.positionRequired); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: form.name.trim(),
          logo_url: form.logo_url.trim() || null,
          brand_color: form.brand_color,
          metadata: {
            ...rawMetadata,
            welcome_message: form.welcome_message.trim() || null,
            type: form.type || null,
            description: form.description.trim() || null,
          },
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          postal_code: form.postal_code.trim() || null,
          latitude: form.latitude,
          longitude: form.longitude,
          active: form.active,
        })
        .eq('id', tenantId)
      if (error) throw error
      setOriginalForm({ ...form })
      Alert.alert(a.saved, a.savedMsg)
    } catch (e: any) {
      Alert.alert('Error', isPlanError(e) ? planErrorText(e) : e?.message ?? a.errorSaveMsg)
    } finally {
      setSaving(false)
    }
  }

  const dirty = originalForm !== null && JSON.stringify(form) !== JSON.stringify(originalForm)

  const value = useMemo<SettingsContextValue>(
    () => ({ form, setForm, loading, saving, dirty, save, plan, planLoading, canLogo, isOwner, deletionScheduledAt, setDeletionScheduledAt }),
    // save() closes over form/rawMetadata, so it is rebuilt with them
    [form, loading, saving, dirty, plan, planLoading, canLogo, isOwner, deletionScheduledAt, rawMetadata, language, segments]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
