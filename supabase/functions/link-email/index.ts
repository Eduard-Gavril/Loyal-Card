// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface LinkEmailRequest {
  client_id: string
  email: string
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

    const { client_id, email }: LinkEmailRequest = await req.json()

    if (!client_id || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing client_id or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email is already used by another client
    const { data: existingClient } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase())
      .neq('id', client_id)
      .single()

    if (existingClient) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already in use' }),
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

    // Update client with email
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({ 
        email: email.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to link email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email linked successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
