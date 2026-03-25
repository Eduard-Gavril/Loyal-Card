// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface LinkPhoneRequest {
  client_id: string
  phone: string
}

// Phone utility functions (inlined to avoid deployment issues)
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[\s\-()\.]/g, '')
  normalized = normalized.replace(/[^\d+]/g, '')
  if (normalized.includes('+')) {
    const digits = normalized.replace(/\+/g, '')
    normalized = '+' + digits
  }
  return normalized
}

function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  const digitCount = normalized.replace(/\D/g, '').length
  if (digitCount < 7 || digitCount > 15) {
    return false
  }
  return /^\+?\d{7,15}$/.test(normalized)
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { client_id, phone }: LinkPhoneRequest = await req.json()

    if (!client_id || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing client_id or phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone number for consistent storage and matching
    const normalizedPhone = normalizePhoneNumber(phone)

    // Check if phone is already used by another client
    const { data: existingClient } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('phone', normalizedPhone)
      .neq('id', client_id)
      .single()

    if (existingClient) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number already in use' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ success: false, error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update client with phone (normalized)
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({ 
        phone: normalizedPhone,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to link phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Phone number linked successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
