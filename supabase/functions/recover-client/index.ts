// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { normalizePhoneNumber, isValidPhoneNumber } from '../_shared/phoneUtils.ts'

interface RecoverClientRequest {
  action: 'request' | 'verify'
  phone?: string      // For 'request' action
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
    const { action, phone, token, new_client_id }: RecoverClientRequest = await req.json()

    // ACTION: REQUEST - Generate recovery token and return it
    if (action === 'request') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate and normalize phone number
      if (!isValidPhoneNumber(phone)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid phone number format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const normalizedPhone = normalizePhoneNumber(phone)

      // Find client by phone (check both old and new clients)
      const { data: clients, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, phone')
        .eq('phone', normalizedPhone)

      if (clientError || !clients || clients.length === 0) {
        // Phone not found - be clear about it in demo mode
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No account found with this phone number. Make sure you have previously linked a phone number to your account.'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the client with the most cards (in case phone exists on multiple clients after merge)
      let bestClient = clients[0]
      let maxCards = 0

      for (const client of clients) {
        const { count } = await supabaseClient
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
        
        if (count && count > maxCards) {
          maxCards = count
          bestClient = client
        }
      }

      // Generate recovery token
      const recoveryToken = generateRecoveryToken(bestClient.id, secret)
      
      // DEMO MODE: Return token directly
      // In production: integrate with SMS service (Twilio, etc.)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Recovery token generated',
          recovery_token: recoveryToken,
          recovery_url: `?recovery=${recoveryToken}`,
          cards_count: maxCards
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

      // Get all cards for the recovered (original) client
      const { data: originalCards, error: cardsError } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('client_id', recoveredClientId)

      let cardsFromNewClient = 0
      let cardsMerged = 0

      // If new_client_id is provided and different, merge NEW client's cards INTO the ORIGINAL
      if (new_client_id && new_client_id !== recoveredClientId) {
        // Get cards from the new (temporary) client
        const { data: newCards } = await supabaseClient
          .from('cards')
          .select('*')
          .eq('client_id', new_client_id)

        if (newCards && newCards.length > 0) {
          for (const newCard of newCards) {
            // Check if original client already has a card for this tenant
            const existingCard = originalCards?.find(c => c.tenant_id === newCard.tenant_id)

            if (existingCard) {
              // MERGE: Add stamps from new card to existing card
              // Get tenant to know max stamps
              const { data: tenant } = await supabaseClient
                .from('tenants')
                .select('stamps_required')
                .eq('id', newCard.tenant_id)
                .single()

              const maxStamps = tenant?.stamps_required || 10
              const mergedStamps = Math.min(existingCard.current_stamps + newCard.current_stamps, maxStamps)
              const mergedRewards = existingCard.rewards_available + newCard.rewards_available

              await supabaseClient
                .from('cards')
                .update({ 
                  current_stamps: mergedStamps,
                  rewards_available: mergedRewards
                })
                .eq('id', existingCard.id)

              // Delete the duplicate card from new client
              await supabaseClient
                .from('cards')
                .delete()
                .eq('id', newCard.id)

              cardsMerged++
            } else {
              // NO CONFLICT: Transfer the card to original client
              await supabaseClient
                .from('cards')
                .update({ client_id: recoveredClientId })
                .eq('id', newCard.id)
phone)
      // The frontend should replace its stored client_id with this one
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account recovered successfully',
          client_id: recoveredClientId,  // Always return the original!
          phone: recoveredClient.phone there are other references)
      }

      // Return the ORIGINAL client_id (the one with the email)
      // The frontend should replace its stored client_id with this one
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account recovered successfully',
          client_id: recoveredClientId,  // Always return the original!
          email: recoveredClient.email,
          cards_count: (originalCards?.length || 0) + cardsFromNewClient,
          cards_merged: cardsMerged,
          cards_transferred: cardsFromNewClient
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
