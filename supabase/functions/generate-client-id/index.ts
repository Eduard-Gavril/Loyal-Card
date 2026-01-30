// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface GenerateClientRequest {
  tenant_id: string
  client_id?: string // Optional: if user already has a client_id
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { tenant_id, client_id, email, phone, name }: GenerateClientRequest = await req.json()

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

    // Use existing client or create new one
    let client
    let isNewClient = false
    
    if (client_id) {
      // Use existing client
      const { data: existingClient, error: clientFetchError } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single()
      
      if (clientFetchError || !existingClient) {
        throw new Error(`Client not found: ${clientFetchError?.message}`)
      }
      
      client = existingClient
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          email,
          phone,
          name,
          metadata: {
            created_via: 'generate_client_id',
            first_tenant_id: tenant_id
          }
        })
        .select()
        .single()

      if (clientError || !newClient) {
        throw new Error(`Failed to create client: ${clientError?.message}`)
      }
      
      client = newClient
      isNewClient = true
    }

    // Check if card already exists for this client + tenant
    const { data: existingCard, error: existingCardError } = await supabaseClient
      .from('cards')
      .select('*')
      .eq('client_id', client.id)
      .eq('tenant_id', tenant_id)
      .single()
    
    // If card already exists, return it
    if (existingCard && !existingCardError) {
      const response: GenerateClientResponse = {
        success: true,
        client_id: client.id,
        card_id: existingCard.id,
        qr_code: existingCard.qr_code
      }

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate unique QR code using crypto.randomUUID()
    const cardUuid = crypto.randomUUID()
    const qr_code = `FIDELIX-${cardUuid.split('-')[0].toUpperCase()}`

    // Create new card for this tenant
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
      // Rollback: delete client ONLY if it was just created
      if (isNewClient) {
        await supabaseClient.from('clients').delete().eq('id', client.id)
      }
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
