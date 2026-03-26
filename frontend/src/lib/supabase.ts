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
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  }
)

// Database types (can be generated with supabase gen types typescript)
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
  postal_code?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface TenantWithDistance extends Tenant {
  distance_km: number
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
  metadata?: { type?: string; [key: string]: any }
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
  reset_on_redeem?: boolean
  discount_percent?: number
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
  async generateClientId(tenantId: string, existingClientId?: string) {
    const { data, error } = await supabase.functions.invoke('generate-client-id', {
      body: { 
        tenant_id: tenantId,
        client_id: existingClientId // Pass existing client_id if user already has cards
      }
    })
    if (error) throw error
    return data
  },

  // Register scan
  async registerScan(qrCode: string, productId: string) {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('🔐 Auth check before register-scan:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      accessToken: session?.access_token ? 'Present' : 'Missing'
    })
    
    if (!session) {
      throw new Error('Not authenticated - please login again')
    }
    
    // Get Supabase URL and anon key from env
    const functionUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // Make direct fetch call with explicit headers
    const response = await fetch(`${functionUrl}/functions/v1/register-scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qr_code: qrCode, product_id: productId })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ register-scan error:', data)
      throw {
        message: data.error || 'Request failed',
        name: 'FunctionsHttpError',
        status: response.status,
        body: data,
        fullError: data
      }
    }
    
    console.log('✅ register-scan success:', data)
    return data
  },

  // Redeem reward
  async redeemReward(qrCode: string, rewardRuleId: string) {
    // Get session for auth
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated - please login again')
    }
    
    // Get Supabase URL and anon key from env
    const functionUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // Make direct fetch call with explicit headers
    const response = await fetch(`${functionUrl}/functions/v1/redeem-reward`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qr_code: qrCode, reward_rule_id: rewardRuleId })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw {
        message: data.error || 'Failed to redeem reward',
        name: 'FunctionsHttpError',
        fullError: data
      }
    }
    
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

  // Get card by client ID and tenant ID
  async getCardByClientAndTenant(clientId: string, tenantId: string) {
    console.log('🔍 Searching card with:', { clientId, tenantId })
    const { data, error } = await supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) {
      console.log('❌ Card search error:', error.code, error.message)
      // If not found, return null instead of throwing
      if (error.code === 'PGRST116') return null
      throw error
    }
    console.log('✅ Card found:', data)
    return data
  },

  // Get all cards for a client
  async getCardsByClient(clientId: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('client_id', clientId)
      .eq('active', true)
    if (error) throw error
    return data || []
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
      .order('priority', { ascending: true })  // Lower priority number = shown first
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
  },

  // Get tenant info
  async getTenant(tenantId: string): Promise<Tenant> {
    console.log('🔍 Fetching tenant:', tenantId)
    console.log('📡 Supabase URL:', supabaseUrl)
    console.log('🔑 Has anon key:', !!supabaseAnonKey)
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()
    
    if (error) {
      console.error('❌ Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    console.log('✅ Tenant loaded:', data)
    return data
  },

  // Get all active tenants
  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data || []
  },

  // Get nearest tenants by geolocation
  async getNearestTenants(latitude: number, longitude: number, maxResults: number = 5): Promise<TenantWithDistance[]> {
    const { data, error } = await supabase
      .rpc('get_nearest_tenants', {
        user_lat: latitude,
        user_lon: longitude,
        max_results: maxResults
      })
    if (error) throw error
    return data || []
  },

  // Get product usage statistics for tenant
  async getProductUsageStats(tenantId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('scan_events')
      .select('product_id')
      .eq('tenant_id', tenantId)
    
    if (error) {
      console.error('Error loading product stats:', error)
      return {}
    }
    
    // Count occurrences
    const stats: Record<string, number> = {}
    data?.forEach(event => {
      stats[event.product_id] = (stats[event.product_id] || 0) + 1
    })
    
    return stats
  },

  // Link phone number to client for recovery (with PIN and backup codes)
  async linkPhone(clientId: string, phone: string, pin: string) {
    const { data, error } = await supabase.functions.invoke('link-phone', {
      body: { client_id: clientId, phone, pin }
    })
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to link phone')
    }
    return data  // Returns { success: true, backup_codes: ['XXX-XXX', ...] }
  },

  // Get client by ID
  async getClient(clientId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Request account recovery (checks if phone exists)
  async requestRecovery(phone: string) {
    const { data, error } = await supabase.functions.invoke('recover-client', {
      body: { action: 'request', phone }
    })
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Recovery request failed')
    }
    return data
  },

  // Verify recovery with PIN or backup code
  async verifyRecovery(phone: string, pin?: string, backupCode?: string, newClientId?: string) {
    const { data, error } = await supabase.functions.invoke('recover-client', {
      body: { 
        action: 'verify', 
        phone,
        pin,
        backup_code: backupCode,
        new_client_id: newClientId 
      }
    })
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Recovery verification failed')
    }
    return data
  }
}
