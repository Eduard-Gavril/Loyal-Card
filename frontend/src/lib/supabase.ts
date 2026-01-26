import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('⚠️  SUPABASE NOT CONFIGURED')
  console.error('Create a .env file in frontend/ with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// Database types (can be generated with supabase gen types typescript)
export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  brand_color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  email?: string
  phone?: string
  name?: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  client_id: string
  tenant_id: string
  qr_code: string
  wallet_type?: 'apple' | 'google'
  wallet_id?: string
  loyalty_state: Record<string, { count: number; rewards: number }>
  active: boolean
  last_scan_at?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id?: string
  name: string
  description?: string
  image_url?: string
  price?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  icon?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface RewardRule {
  id: string
  tenant_id: string
  name: string
  description?: string
  product_id?: string
  category_id?: string
  buy_count: number
  reward_count: number
  reward_product_id?: string
  reward_category_id?: string
  active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface ScanEvent {
  id: string
  tenant_id: string
  client_id: string
  admin_id: string
  product_id: string
  store_id?: string
  card_id: string
  scan_method: 'qr' | 'manual' | 'api'
  device_info?: any
  loyalty_state_snapshot: any
  reward_applied: boolean
  reward_rule_id?: string
  scanned_at: string
}

// API helper functions
export const api = {
  // Generate anonymous client ID via Edge Function
  async generateClientId(tenantId: string) {
    const { data, error } = await supabase.functions.invoke('generate-client-id', {
      body: { tenant_id: tenantId }
    })
    if (error) throw error
    return data
  },

  // Register scan
  async registerScan(qrCode: string, productId: string) {
    const { data, error } = await supabase.functions.invoke('register-scan', {
      body: { qr_code: qrCode, product_id: productId }
    })
    if (error) throw error
    return data
  },

  // Get card by QR code
  async getCardByQR(qrCode: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('qr_code', qrCode)
      .single()
    if (error) throw error
    return data
  },

  // Get products for tenant
  async getProducts(tenantId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_categories(*)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data
  },

  // Get reward rules for tenant
  async getRewardRules(tenantId: string) {
    const { data, error } = await supabase
      .from('reward_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('priority', { ascending: false })
    if (error) throw error
    return data
  },

  // Get scan events for card
  async getScanEvents(cardId: string, limit = 50) {
    const { data, error } = await supabase
      .from('scan_events')
      .select('*, products(name), admins(id)')
      .eq('card_id', cardId)
      .order('scanned_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  }
}
