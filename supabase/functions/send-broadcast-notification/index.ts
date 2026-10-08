// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const DAILY_LIMIT = 1
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_BATCH_SIZE = 100

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { title, body }: { title?: string; body?: string } = await req.json()
    if (!title?.trim() || !body?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing title or body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Unlike most other functions here, this one verifies the JWT's
    // signature properly (via auth.getUser) instead of just base64-decoding
    // the payload — this endpoint can message every client of a tenant, so
    // it's worth the extra real check rather than trusting an unsigned claim.
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, tenant_id, role')
      .eq('user_id', userData.user.id)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin not found or inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (admin.role !== 'owner') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only the shop owner can send broadcast notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side rate limit — the real guard. A client-side disabled button
    // alone can't be trusted.
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count: sentToday, error: countError } = await supabase
      .from('push_broadcasts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', admin.tenant_id)
      .gte('sent_at', todayStart.toISOString())

    if (countError) throw new Error(`Failed to check rate limit: ${countError.message}`)
    if ((sentToday ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ success: false, error: 'Daily broadcast limit reached. Try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recipients: every client with an active card at this tenant and a
    // push token on file. A client with multiple cards at the same tenant
    // (shouldn't normally happen) only gets counted once via the Set.
    const { data: cardRows, error: cardsError } = await supabase
      .from('cards')
      .select('clients(push_token)')
      .eq('tenant_id', admin.tenant_id)
      .eq('active', true)

    if (cardsError) throw new Error(`Failed to load recipients: ${cardsError.message}`)

    const tokens = [...new Set(
      (cardRows ?? [])
        .map((row: any) => row.clients?.push_token as string | null | undefined)
        .filter((token): token is string => !!token)
    )]

    for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
      const batch = tokens.slice(i, i + EXPO_BATCH_SIZE).map((to) => ({
        to,
        title: title.trim(),
        body: body.trim(),
        sound: 'default',
      }))
      const pushResponse = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      })
      if (!pushResponse.ok) {
        console.error('Expo push batch failed:', await pushResponse.text())
      }
    }

    const { error: logError } = await supabase.from('push_broadcasts').insert({
      tenant_id: admin.tenant_id,
      admin_id: admin.id,
      title: title.trim(),
      body: body.trim(),
      recipient_count: tokens.length,
    })
    if (logError) console.error('Failed to log broadcast:', logError.message)

    return new Response(
      JSON.stringify({ success: true, recipient_count: tokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-broadcast-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
