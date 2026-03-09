// Cart item interface for multiple product selection
export interface CartItem {
  productId: string
  productName: string
  quantity: number
  price?: number
}

// Reward rule from database
export interface RewardRule {
  id: string
  tenant_id: string
  rule_name: string
  stamps_required: number
  reward_name: string
  reward_icon?: string
  is_active: boolean
  product_type_filter: string[] | null
}

// Product from database
export interface Product {
  id: string
  tenant_id: string
  name: string
  product_type: string
  price?: number
  emoji?: string
  is_active: boolean
}

// Macro categories for product grouping
export interface MacroCategory {
  name: string
  emoji: string
  types: string[]
}

export const MACRO_CATEGORIES: Record<string, MacroCategory> = {
  espresso: { name: '☕ Espresso', emoji: '☕', types: ['espresso'] },
  milk: { name: '🥛 Cappuccini & Latte', emoji: '🥛', types: ['milk', 'cappuccino', 'latte'] },
  chocolate: { name: '🍫 Cioccolata & Tè', emoji: '🍫', types: ['chocolate', 'tea'] },
  specialty: { name: '✨ Specialità', emoji: '✨', types: ['specialty', 'special'] }
}

// Camera permission states
export type CameraPermission = 'pending' | 'requesting' | 'granted' | 'denied'

// Scanner modes
export type ScannerMode = 'scan' | 'redeem'

// Scan result interface
export interface ScanResult {
  success: boolean
  message?: string
  error?: string
  reward_earned?: {
    rule_name: string
    reward_count: number
  }
  milestone_reached?: {
    count: number
    message: string
  }
  remaining_rewards?: number
  redeemed?: boolean
  totalItemsProcessed?: number
  multipleItems?: boolean
}
