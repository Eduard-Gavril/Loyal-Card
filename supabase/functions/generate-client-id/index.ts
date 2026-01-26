// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface GenerateClientRequest {
  tenant_id: string
  email?: string
  phone?: string
  name?: string
}

interface GenerateClientResponse {
  success: boolean
  client_id?: string
  card_id?: string
  qr_code?: string
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { tenant_id, email, phone, name }: GenerateClientRequest = await req.json()

    // Validate tenant exists
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid tenant_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create client
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .insert({
        email,
        phone,
        name,
        metadata: {
          created_via: 'generate_client_id',
          tenant_id // Track which tenant created this client
        }
      })
      .select()
      .single()

    if (clientError || !client) {
      throw new Error(`Failed to create client: ${clientError?.message}`)
    }

    // Generate QR code (simple format: FIDELIX-{short-uuid})
    const qr_code = `FIDELIX-${client.id.split('-')[0].toUpperCase()}`

    // Create card for this tenant
    const { data: card, error: cardError } = await supabaseClient
      .from('cards')
      .insert({
        client_id: client.id,
        tenant_id: tenant_id,
        qr_code: qr_code,
        loyalty_state: {}
      })
      .select()
      .single()

    if (cardError || !card) {
      // Rollback: delete client if card creation fails
      await supabaseClient.from('clients').delete().eq('id', client.id)
      throw new Error(`Failed to create card: ${cardError?.message}`)
    }

    // Success response
    const response: GenerateClientResponse = {
      success: true,
      client_id: client.id,
      card_id: card.id,
      qr_code: qr_code
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-client-id:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
