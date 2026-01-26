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
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get JWT token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get admin info
    const { data: admin, error: adminError } = await supabaseClient
      .from('admins')
      .select('id, tenant_id, role, store_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin not found or inactive' }),
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

    // Find card by QR code
    const { data: card, error: cardError } = await supabaseClient
      .from('cards')
      .select('id, client_id, tenant_id, loyalty_state, active')
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

    // Verify product exists and belongs to tenant
    const { data: product, error: productError } = await supabaseClient
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

    // Find applicable reward rule
    const { data: rules, error: rulesError } = await supabaseClient
      .from('reward_rules')
      .select('*')
      .eq('tenant_id', admin.tenant_id)
      .eq('active', true)
      .or(`product_id.eq.${product_id},category_id.eq.${product.category_id}`)

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`)
    }

    // Apply loyalty logic
    let loyaltyState = card.loyalty_state || {}
    let rewardEarned = null

    if (rules && rules.length > 0) {
      // Use first matching rule (can be enhanced with priority)
      const rule = rules[0]
      const ruleId = rule.id

      // Initialize rule state if not exists
      if (!loyaltyState[ruleId]) {
        loyaltyState[ruleId] = { count: 0, rewards: 0 }
      }

      // Increment counter
      loyaltyState[ruleId].count += 1

      // Check if reward threshold reached
      if (loyaltyState[ruleId].count >= rule.buy_count) {
        loyaltyState[ruleId].rewards += rule.reward_count
        loyaltyState[ruleId].count = 0 // Reset counter
        
        rewardEarned = {
          rule_id: ruleId,
          rule_name: rule.name,
          reward_count: rule.reward_count
        }
      }
    }

    // Update card
    const { error: updateError } = await supabaseClient
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
    const { error: eventError } = await supabaseClient
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
      reward_earned: rewardEarned || undefined
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
