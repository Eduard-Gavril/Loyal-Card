// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface RecoverClientRequest {
  action: 'request' | 'verify'
  email?: string      // For 'request' action
  token?: string      // For 'verify' action
  new_client_id?: string // For 'verify' action - the new client_id to merge into
}

// Simple token generation using timestamp and random string
function generateRecoveryToken(clientId: string, secret: string): string {
  const timestamp = Date.now()
  const expiresAt = timestamp + (24 * 60 * 60 * 1000) // 24 hours
  const payload = `${clientId}:${expiresAt}`
  
  // Simple encoding (in production, use proper JWT)
  const encoded = btoa(payload)
  return encoded
}

function verifyRecoveryToken(token: string, secret: string): { clientId: string; valid: boolean } {
  try {
    const decoded = atob(token)
    const [clientId, expiresAtStr] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)
    
    if (Date.now() > expiresAt) {
      return { clientId: '', valid: false }
    }
    
    return { clientId, valid: true }
  } catch {
    return { clientId: '', valid: false }
  }
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
    
    const secret = Deno.env.get('RECOVERY_SECRET') || 'default-recovery-secret'
    const { action, email, token, new_client_id }: RecoverClientRequest = await req.json()

    // ACTION: REQUEST - Generate recovery token and return it
    if (action === 'request') {
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find client by email
      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single()

      if (clientError || !client) {
        // Don't reveal if email exists or not for security
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'If an account exists with this email, you will receive recovery instructions.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate recovery token
      const recoveryToken = generateRecoveryToken(client.id, secret)
      
      // In a real app, you would send this via email
      // For now, we return it directly (for demo purposes)
      // In production: integrate with email service (SendGrid, Resend, etc.)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Recovery token generated',
          // Remove this in production - only for demo!
          recovery_token: recoveryToken,
          recovery_url: `?recovery=${recoveryToken}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ACTION: VERIFY - Verify token and merge accounts
    if (action === 'verify') {
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { clientId: recoveredClientId, valid } = verifyRecoveryToken(token, secret)

      if (!valid || !recoveredClientId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the recovered client data
      const { data: recoveredClient, error: clientError } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', recoveredClientId)
        .single()

      if (clientError || !recoveredClient) {
        return new Response(
          JSON.stringify({ success: false, error: 'Client not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get all cards for the recovered client
      const { data: cards, error: cardsError } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('client_id', recoveredClientId)

      // If new_client_id is provided, merge the accounts
      if (new_client_id && new_client_id !== recoveredClientId) {
        // Transfer all cards from recovered client to new client
        if (cards && cards.length > 0) {
          const { error: updateError } = await supabaseClient
            .from('cards')
            .update({ client_id: new_client_id })
            .eq('client_id', recoveredClientId)

          if (updateError) {
            console.error('Error transferring cards:', updateError)
          }
        }

        // Copy email to new client if not already set
        const { data: newClient } = await supabaseClient
          .from('clients')
          .select('email')
          .eq('id', new_client_id)
          .single()

        if (newClient && !newClient.email && recoveredClient.email) {
          await supabaseClient
            .from('clients')
            .update({ email: recoveredClient.email })
            .eq('id', new_client_id)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Account recovered and merged',
            client_id: new_client_id,
            cards_recovered: cards?.length || 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Just return the recovered client_id (user will use this)
      return new Response(
        JSON.stringify({ 
          success: true, 
          client_id: recoveredClientId,
          email: recoveredClient.email,
          cards_count: cards?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Recovery error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
