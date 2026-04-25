import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('⚠️  SUPABASE NOT CONFIGURED')
  console.error('Create a .env file in frontend/ with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key')
}

// Use singleton pattern to avoid multiple instances during HMR
let supabaseInstance: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
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
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

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
    // This is called by anonymous users (no auth needed)
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
    // Create AbortController with 10 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const sessionResult = await Promise.race([
        sessionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 5000))
      ]) as { data: { session: any } }
      
      let session = sessionResult.data.session
      
      if (!session) {
        throw new Error('Not authenticated - please login again')
      }
      
      // Check if token expires in less than 5 minutes, refresh if needed
      const expiresAt = session.expires_at || 0
      const now = Math.floor(Date.now() / 1000)
      const fiveMinutes = 300
      
      if (expiresAt < now + fiveMinutes) {
        // Token is expiring soon or expired, try to refresh with timeout
        const refreshPromise = supabase.auth.refreshSession()
        const refreshResult = await Promise.race([
          refreshPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Token refresh timeout')), 5000))
        ]).catch(() => null) as any
        
        // If refresh succeeded, use new session
        if (refreshResult?.data?.session) {
          session = refreshResult.data.session
        }
      }
      
      // Get Supabase URL and anon key from env
      const functionUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // Make direct fetch call with explicit headers and timeout
      const response = await fetch(`${functionUrl}/functions/v1/register-scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qr_code: qrCode, product_id: productId }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      if (!response.ok) {
        throw {
          message: data.error || 'Request failed',
          name: 'FunctionsHttpError',
          status: response.status,
          body: data,
          fullError: data
        }
      }
      
      return data
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout. Close any background tabs and try again.')
      }
      throw error
    }
  },

  // Redeem reward
  async redeemReward(qrCode: string, rewardRuleId: string) {
    // Create AbortController with 10 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const sessionResult = await Promise.race([
        sessionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 5000))
      ]) as { data: { session: any } }
      
      let session = sessionResult.data.session
      
      if (!session) {
        throw new Error('Not authenticated - please login again')
      }
      
      // Check if token expires in less than 5 minutes, refresh if needed
      const expiresAt = session.expires_at || 0
      const now = Math.floor(Date.now() / 1000)
      const fiveMinutes = 300
      
      if (expiresAt < now + fiveMinutes) {
        // Token is expiring soon or expired, try to refresh with timeout
        const refreshPromise = supabase.auth.refreshSession()
        const refreshResult = await Promise.race([
          refreshPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Token refresh timeout')), 5000))
        ]).catch(() => null) as any
        
        // If refresh succeeded, use new session
        if (refreshResult?.data?.session) {
          session = refreshResult.data.session
        }
      }
      
      // Get Supabase URL and anon key from env
      const functionUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // Make direct fetch call with explicit headers and timeout
      const response = await fetch(`${functionUrl}/functions/v1/redeem-reward`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qr_code: qrCode, reward_rule_id: rewardRuleId }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      if (!response.ok) {
        throw {
          message: data.error || 'Failed to redeem reward',
          name: 'FunctionsHttpError',
          fullError: data
        }
      }
      
      return data
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout. Close any background tabs and try again.')
      }
      throw error
    }
  },

  // Get card by QR code
  async getCardByQR(qrCode: string) {
    const queryPromise = supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('qr_code', qrCode)
      .single()
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data
  },

  // Get card by client ID and tenant ID
  async getCardByClientAndTenant(clientId: string, tenantId: string) {
    const queryPromise = supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .single()
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    
    if (error) {
      // If not found, return null instead of throwing
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Get all cards for a client
  async getCardsByClient(clientId: string) {
    const queryPromise = supabase
      .from('cards')
      .select('*, clients(*)')
      .eq('client_id', clientId)
      .eq('active', true)
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data || []
  },

  // Get products for tenant
  async getProducts(tenantId: string) {
    const queryPromise = supabase
      .from('products')
      .select('*, product_categories(*)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('name')
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data
  },

  // Get reward rules for tenant
  async getRewardRules(tenantId: string) {
    const queryPromise = supabase
      .from('reward_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('priority', { ascending: true })  // Lower priority number = shown first
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data
  },

  // Get scan events for card
  async getScanEvents(cardId: string, limit = 50) {
    const queryPromise = supabase
      .from('scan_events')
      .select('*, products(name), admins(id)')
      .eq('card_id', cardId)
      .order('scanned_at', { ascending: false })
      .limit(limit)
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data
  },

  // Get tenant info
  async getTenant(tenantId: string): Promise<Tenant> {
    const queryPromise = supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    
    if (error) {
      throw error
    }
    
    return data
  },

  // Get all active tenants
  async getAllTenants(): Promise<Tenant[]> {
    const queryPromise = supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('name')
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data || []
  },

  // Get nearest tenants by geolocation
  async getNearestTenants(latitude: number, longitude: number, maxResults: number = 5): Promise<TenantWithDistance[]> {
    const queryPromise = supabase
      .rpc('get_nearest_tenants', {
        user_lat: latitude,
        user_lon: longitude,
        max_results: maxResults
      })
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    return data || []
  },

  // Get product usage statistics for tenant
  async getProductUsageStats(tenantId: string): Promise<Record<string, number>> {
    const queryPromise = supabase
      .from('scan_events')
      .select('product_id')
      .eq('tenant_id', tenantId)
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    
    if (error) {
      return {}
    }
    
    // Count occurrences
    const stats: Record<string, number> = {}
    data?.forEach((event: any) => {
      stats[event.product_id] = (stats[event.product_id] || 0) + 1
    })
    
    return stats
  },

  // Link phone number to client for recovery (with PIN and backup codes)
  async linkPhone(clientId: string, phone: string, pin: string) {
    // This is called by anonymous users (no auth needed)
    const invocationPromise = supabase.functions.invoke('link-phone', {
      body: { client_id: clientId, phone, pin }
    })
    
    const result = await Promise.race([
      invocationPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 10000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to link phone')
    }
    return data  // Returns { success: true, backup_codes: ['XXX-XXX', ...] }
  },

  // Get client by ID
  async getClient(clientId: string): Promise<Client | null> {
    const queryPromise = supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    const result = await Promise.race([
      queryPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Request account recovery (checks if phone exists)
  async requestRecovery(phone: string) {
    // This is called by anonymous users (no auth needed)
    const invocationPromise = supabase.functions.invoke('recover-client', {
      body: { action: 'request', phone }
    })
    
    const result = await Promise.race([
      invocationPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 10000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Recovery request failed')
    }
    return data
  },

  // Verify recovery with PIN or backup code
  async verifyRecovery(phone: string, pin?: string, backupCode?: string, newClientId?: string) {
    // This is called by anonymous users (no auth needed)
    const invocationPromise = supabase.functions.invoke('recover-client', {
      body: { 
        action: 'verify', 
        phone,
        pin,
        backup_code: backupCode,
        new_client_id: newClientId 
      }
    })
    
    const result = await Promise.race([
      invocationPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 10000)
      )
    ]) as any
    
    const { data, error } = result
    if (error) throw error
    if (data && !data.success) {
      throw new Error(data.error || 'Recovery verification failed')
    }
    return data
  }
}
