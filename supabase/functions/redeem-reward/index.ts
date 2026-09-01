// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface RedeemRewardRequest {
  qr_code: string
  reward_rule_id: string
  redeem_count?: number
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token and decode user_id
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const jwt = authHeader.replace('Bearer ', '')
    const parts = jwt.split('.')
    const payload = JSON.parse(atob(parts[1]))
    const userId = payload.sub
    
    // Create Supabase client
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
        JSON.stringify({ success: false, error: 'Admin not found or inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { qr_code, reward_rule_id, redeem_count }: RedeemRewardRequest = await req.json()

    if (!qr_code || !reward_rule_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing qr_code or reward_rule_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redeemCount = Number.isInteger(redeem_count) && redeem_count! > 0 ? redeem_count! : 1

    // Find card
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, client_id, tenant_id, loyalty_state, active')
      .eq('qr_code', qr_code)
      .eq('tenant_id', admin.tenant_id)
      .single()

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ success: false, error: 'Card not found or wrong tenant' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if enough rewards are available
    const loyaltyState = card.loyalty_state || {}
    const ruleState = loyaltyState[reward_rule_id]

    if (!ruleState || ruleState.rewards < redeemCount) {
      return new Response(
        JSON.stringify({ success: false, error: 'No rewards available to redeem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load reward rule (validates it belongs to this tenant)
    const { data: rule, error: ruleError } = await supabase
      .from('reward_rules')
      .select('id, name, discount_percent')
      .eq('id', reward_rule_id)
      .eq('tenant_id', admin.tenant_id)
      .single()

    if (ruleError || !rule) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reward rule not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Redeem reward(s): decrement reward count only. The stamp counter (count) is
    // never touched here — register-scan already keeps it as the correct progress
    // toward the next reward, so resetting it here would discard legitimate stamps.
    loyaltyState[reward_rule_id] = {
      count: ruleState.count,
      rewards: ruleState.rewards - redeemCount
    }

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

    // Create redemption event
    await supabase
      .from('scan_events')
      .insert({
        tenant_id: admin.tenant_id,
        client_id: card.client_id,
        admin_id: admin.id,
        product_id: null,
        store_id: admin.store_id,
        card_id: card.id,
        scan_method: 'qr',
        loyalty_state_snapshot: loyaltyState,
        reward_applied: true,
        reward_rule_id: reward_rule_id
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reward redeemed successfully',
        redeemed_count: redeemCount,
        remaining_rewards: loyaltyState[reward_rule_id].rewards
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in redeem-reward:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
