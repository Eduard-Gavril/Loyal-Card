import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  brand_color: string
  active: boolean
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  metadata?: { type?: string; description?: string }
}

export interface TenantWithDistance extends Tenant {
  distance_km: number
}

export interface Card {
  id: string
  client_id: string
  tenant_id: string
  qr_code: string
  loyalty_state: Record<string, { count: number; rewards: number }>
  active: boolean
  last_scan_at?: string
  created_at: string
}

export const api = {
  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data ?? []
  },

  async getNearestTenants(latitude: number, longitude: number, maxResults = 5): Promise<TenantWithDistance[]> {
    const { data, error } = await supabase.rpc('get_nearest_tenants', {
      user_lat: latitude,
      user_lon: longitude,
      max_results: maxResults,
    })
    if (error) throw error
    return data ?? []
  },

  async linkPhone(clientId: string, phone: string, pin: string): Promise<{ backupCodes: string[] }> {
    const { data, error } = await supabase.functions.invoke('link-phone', {
      body: { client_id: clientId, phone, pin },
    })
    if (error) throw new Error(error.message ?? 'Errore collegamento numero')
    if (!data?.success) throw new Error(data?.error ?? 'Errore collegamento numero')
    return { backupCodes: data.backup_codes ?? [] }
  },

  async recoverRequest(phone: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('recover-client', {
      body: { action: 'request', phone },
    })
    if (error) throw new Error(error.message ?? 'Errore di rete')
    if (!data?.success) throw new Error(data?.error ?? 'Numero non trovato')
  },

  async recoverVerify(phone: string, pin: string, newClientId?: string): Promise<{
    clientId: string
    cardsCount: number
  }> {
    const body: Record<string, string> = { action: 'verify', phone, pin }
    if (newClientId) body.new_client_id = newClientId
    const { data, error } = await supabase.functions.invoke('recover-client', { body })
    if (error) throw new Error(error.message ?? 'Errore di rete')
    if (!data?.success) throw new Error(data?.error ?? 'PIN non valido')
    return { clientId: data.client_id, cardsCount: data.cards_count ?? 0 }
  },

  async getCardsForClient(clientId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*, tenants(name, slug)')
      .eq('client_id', clientId)
      .eq('active', true)
    if (error) throw error
    return data ?? []
  },

  async generateClientId(tenantId: string, existingClientId?: string) {
    const { data, error } = await supabase.functions.invoke('generate-client-id', {
      body: { tenant_id: tenantId, client_id: existingClientId },
    })
    if (error) {
      console.error('[generateClientId] Edge function error:', JSON.stringify(error))
      throw new Error(error.message ?? 'Edge function failed')
    }
    if (!data?.qr_code) {
      console.error('[generateClientId] Unexpected response:', JSON.stringify(data))
      throw new Error('Risposta non valida dal server')
    }
    return data
  },
}
