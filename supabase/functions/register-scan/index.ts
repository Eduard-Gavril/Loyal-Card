// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface RegisterScanRequest {
  qr_code: string
  product_id: string
}

interface RegisterScanResponse {
  success: boolean
  card?: {
    id: string
    client_id: string
    loyalty_state: any
  }
  reward_earned?: {
    rule_id: string
    rule_name: string
    reward_count: number
  }
  milestone_reached?: {
    count: number
    message: string
  }
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing authorization header'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Decode JWT to get user_id (JWT already validated by Supabase gateway)
    const jwt = authHeader.replace('Bearer ', '')
    const parts = jwt.split('.')
    
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JWT format'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Decode base64 payload (Deno compatible)
    let userId: string
    try {
      const base64Payload = parts[1]
      // Deno-compatible base64 decode
      const jsonPayload = atob(base64Payload)
      const payload = JSON.parse(jsonPayload)
      userId = payload.sub
      
      if (!userId) {
        throw new Error('No sub in JWT')
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to decode JWT',
          debug: { error: String(err) }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get admin info
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, tenant_id, role, store_id')
      .eq('user_id', userId)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin not found or inactive',
          debug: {
            adminError: adminError?.message,
            adminErrorCode: adminError?.code,
            userId: userId,
            hasAdmin: !!admin
          }
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { qr_code, product_id }: RegisterScanRequest = await req.json()

    if (!qr_code || !product_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing qr_code or product_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant info to check if it's FitGym (for 31-day rule)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', admin.tenant_id)
      .single()
    
    const isFitGym = tenant?.slug === 'fitgym'

    // Find card by QR code
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, client_id, tenant_id, loyalty_state, active, last_scan_at')
      .eq('qr_code', qr_code)
      .eq('tenant_id', admin.tenant_id) // Security: same tenant
      .single()

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ success: false, error: 'Card not found or wrong tenant' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!card.active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Card is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FitGym only: Check if more than 31 days passed since last scan
    // If yes, reset all stamps on the card
    let cardNeedsReset = false
    
    if (isFitGym && card.last_scan_at) {
      const lastScanDate = new Date(card.last_scan_at)
      const now = new Date()
      const daysDifference = Math.floor((now.getTime() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDifference > 31) {
        cardNeedsReset = true
      }
    }

    // Verify product exists and belongs to tenant
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, category_id, tenant_id')
      .eq('id', product_id)
      .eq('tenant_id', admin.tenant_id)
      .eq('active', true)
      .single()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find applicable reward rules (ordered by priority)
    const { data: rules, error: rulesError } = await supabase
      .from('reward_rules')
      .select('*')
      .eq('tenant_id', admin.tenant_id)
      .eq('active', true)
      .or(`product_id.eq.${product_id},category_id.eq.${product.category_id}`)
      .order('priority', { ascending: true })

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`)
    }

    // Apply loyalty logic
    let loyaltyState = card.loyalty_state || {}
    
    // FitGym only: Reset loyalty state if card needs reset (31+ days inactive)
    if (cardNeedsReset) {
      loyaltyState = {}
    }
    
    let rewardsEarned: any[] = []
    let milestoneReached = null

    if (rules && rules.length > 0) {
      // Apply ALL applicable rules (not just the first one)
      for (const rule of rules) {
        const ruleId = rule.id

        // Initialize rule state if not exists
        if (!loyaltyState[ruleId]) {
          loyaltyState[ruleId] = { count: 0, rewards: 0 }
        }

        // Increment counter (only if no pending rewards for THIS specific rule)
        if (loyaltyState[ruleId].rewards === 0) {
          loyaltyState[ruleId].count += 1

          // FitGym milestone: When reaching 6 stamps on a 50% discount rule
          if (isFitGym && loyaltyState[ruleId].count === 6 && rule.discount_percent === 50) {
            milestoneReached = {
              count: 6,
              message: 'Next purchase 50% OFF! 🎉'
            }
          }

          // Check if reward threshold reached
          if (loyaltyState[ruleId].count >= rule.buy_count) {
            loyaltyState[ruleId].rewards += rule.reward_count
            // DON'T reset counter here - will be reset in redeem-reward if reset_on_redeem=true
            
            rewardsEarned.push({
              rule_id: ruleId,
              rule_name: rule.name,
              reward_count: rule.reward_count,
              discount_percent: rule.discount_percent || null
            })
          }
        }
      }
    }

    // For backwards compatibility, use first reward as main reward_earned
    const rewardEarned = rewardsEarned.length > 0 ? rewardsEarned[0] : null

    // Update card
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        loyalty_state: loyaltyState,
        last_scan_at: new Date().toISOString()
      })
      .eq('id', card.id)

    if (updateError) {
      throw new Error(`Failed to update card: ${updateError.message}`)
    }

    // Create scan event
    const { error: eventError } = await supabase
      .from('scan_events')
      .insert({
        tenant_id: admin.tenant_id,
        client_id: card.client_id,
        admin_id: admin.id,
        product_id: product_id,
        store_id: admin.store_id,
        card_id: card.id,
        scan_method: 'qr',
        loyalty_state_snapshot: loyaltyState,
        reward_applied: rewardEarned !== null,
        reward_rule_id: rewardEarned?.rule_id || null
      })

    if (eventError) {
      console.error('Failed to create scan event:', eventError)
      // Don't fail the request, but log the error
    }

    // Success response
    const response: RegisterScanResponse = {
      success: true,
      card: {
        id: card.id,
        client_id: card.client_id,
        loyalty_state: loyaltyState
      },
      reward_earned: rewardEarned || undefined,
      milestone_reached: milestoneReached || undefined
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in register-scan:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
