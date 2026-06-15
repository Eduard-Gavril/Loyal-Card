// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    const { client_id }: { client_id: string } = await req.json()

    if (!client_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing client_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Verify client exists
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      return new Response(
        JSON.stringify({ success: false, error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get all card IDs for this client
    const { data: cards } = await supabase
      .from('cards')
      .select('id')
      .eq('client_id', client_id)

    // 3. Delete scan_events linked to those cards
    if (cards && cards.length > 0) {
      const cardIds = cards.map((c: any) => c.id)
      const { error: scanErr } = await supabase
        .from('scan_events')
        .delete()
        .in('card_id', cardIds)
      if (scanErr) throw new Error(`scan_events delete failed: ${scanErr.message}`)
    }

    // 4. Delete all cards for this client
    const { error: cardsErr } = await supabase
      .from('cards')
      .delete()
      .eq('client_id', client_id)
    if (cardsErr) throw new Error(`cards delete failed: ${cardsErr.message}`)

    // 5. Delete push_tokens if the table exists (ignore error if table doesn't exist yet)
    await supabase.from('push_tokens').delete().eq('client_id', client_id)

    // 6. Delete client record (also removes phone, pin_hash, backup_codes columns)
    const { error: clientDeleteErr } = await supabase
      .from('clients')
      .delete()
      .eq('id', client_id)
    if (clientDeleteErr) throw new Error(`clients delete failed: ${clientDeleteErr.message}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('delete-account error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
