import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Fallbacks: EAS builds don't include .env (gitignored), and createClient('')
// throws at import time, crashing the app on any navigation. The anon key is
// a public client-side key by design, so embedding it here is safe.
const FALLBACK_SUPABASE_URL = 'https://gthrrolmuoxhqsiziwjf.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHJyb2xtdW94aHFzaXppd2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDEwNzAsImV4cCI6MjA4NTAxNzA3MH0.0aulpOld-xNyG8GsqkfvHlmfYZD74t2KLiMp1fzI59g'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

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

export interface RewardRule {
  id: string
  tenant_id: string
  name: string
  description?: string
  buy_count: number
  reward_count: number
  discount_percent?: number
  active: boolean
  priority: number
}

// Wraps functions.invoke and extracts the real error message from the response body
// (the Supabase client otherwise throws a generic "Edge Function returned a non-2xx
// status code" instead of the actual reason). Mirrors frontend/src/lib/supabase.ts.
export async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    try {
      const responseBody = await (error as any).context?.json?.()
      if (responseBody?.error) throw new Error(responseBody.error)
    } catch (e) {
      if (e instanceof Error && e.message !== error.message) throw e
    }
    throw error
  }
  if (data && !data.success && data.error) throw new Error(data.error)
  return data
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
    const data = await invokeEdgeFunction('link-phone', { client_id: clientId, phone, pin })
    return { backupCodes: data.backup_codes ?? [] }
  },

  async recoverRequest(phone: string): Promise<void> {
    await invokeEdgeFunction('recover-client', { action: 'request', phone })
  },

  async recoverVerify(phone: string, pin: string, newClientId?: string): Promise<{
    clientId: string
    cardsCount: number
  }> {
    const body: Record<string, string> = { action: 'verify', phone, pin }
    if (newClientId) body.new_client_id = newClientId
    const data = await invokeEdgeFunction('recover-client', body)
    return { clientId: data.client_id, cardsCount: data.cards_count ?? 0 }
  },

  async getRewardRules(tenantId: string): Promise<RewardRule[]> {
    const { data, error } = await supabase
      .from('reward_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('priority', { ascending: true })
    if (error) throw error
    return data ?? []
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
    const data = await invokeEdgeFunction('generate-client-id', {
      tenant_id: tenantId,
      client_id: existingClientId,
    })
    if (!data?.qr_code) {
      console.error('[generateClientId] Unexpected response:', JSON.stringify(data))
      throw new Error('Invalid response from server')
    }
    return data
  },

  async updateClientName(clientId: string, name: string) {
    return invokeEdgeFunction('update-client-profile', { client_id: clientId, name })
  },

  async deleteAccount(clientId: string) {
    return invokeEdgeFunction('delete-account', { client_id: clientId })
  },

  async registerScan(qrCode: string, productId: string) {
    return invokeEdgeFunction('register-scan', { qr_code: qrCode, product_id: productId })
  },

  async redeemReward(qrCode: string, rewardRuleId: string) {
    return invokeEdgeFunction('redeem-reward', { qr_code: qrCode, reward_rule_id: rewardRuleId })
  },
}
