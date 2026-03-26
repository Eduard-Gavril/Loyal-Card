// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

interface RecoverClientRequest {
  action: 'request' | 'verify'
  phone?: string          // For 'request' action
  pin?: string            // For 'verify' action - 6-digit PIN
  backup_code?: string    // For 'verify' action - alternative to PIN
  new_client_id?: string  // For 'verify' action - the new client_id to merge into
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

// Rate limiting check - prevent brute force
const MAX_ATTEMPTS_PER_HOUR = 5

async function checkRateLimit(supabase: any, clientId: string): Promise<boolean> {
  const { data: client } = await supabase
    .from('clients')
    .select('recovery_attempts, last_recovery_attempt')
    .eq('id', clientId)
    .single()

  if (!client) return true

  const now = new Date()
  const lastAttempt = client.last_recovery_attempt ? new Date(client.last_recovery_attempt) : null
  
  // Reset counter if more than 1 hour has passed
  if (!lastAttempt || (now.getTime() - lastAttempt.getTime()) > 3600000) {
    await supabase
      .from('clients')
      .update({ recovery_attempts: 0 })
      .eq('id', clientId)
    return true
  }

  return client.recovery_attempts < MAX_ATTEMPTS_PER_HOUR
}

async function incrementAttempts(supabase: any, clientId: string) {
  const { data: client } = await supabase
    .from('clients')
    .select('recovery_attempts')
    .eq('id', clientId)
    .single()

  await supabase
    .from('clients')
    .update({ 
      recovery_attempts: (client?.recovery_attempts || 0) + 1,
      last_recovery_attempt: new Date().toISOString()
    })
    .eq('id', clientId)
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
    
    const { action, phone, pin, backup_code, new_client_id }: RecoverClientRequest = await req.json()

    // ACTION: REQUEST - Check if phone exists (no token generation)
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

      // Find client by phone
      const { data: clients, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, phone, pin_hash')
        .eq('phone', normalizedPhone)

      if (clientError || !clients || clients.length === 0) {
        // Phone not found
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No account found with this phone number.'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if PIN is set
      const hasPIN = clients[0].pin_hash !== null

      if (!hasPIN) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'This account was registered without PIN security. Please contact support.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Phone exists and has PIN - proceed to verification step
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Phone number found. Please enter your PIN.',
          phone_found: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ACTION: VERIFY - Verify PIN or backup code and merge accounts
    if (action === 'verify') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!pin && !backup_code) {
        return new Response(
          JSON.stringify({ success: false, error: 'PIN or backup code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const normalizedPhone = normalizePhoneNumber(phone)

      // Find client by phone
      const { data: clients, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, phone, pin_hash, backup_codes')
        .eq('phone', normalizedPhone)

      if (clientError || !clients || clients.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the client with the most cards
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

      const recoveredClientId = bestClient.id

      // Check rate limiting
      const canAttempt = await checkRateLimit(supabaseClient, recoveredClientId)
      if (!canAttempt) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many recovery attempts. Please try again in 1 hour.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let authSuccess = false
      let usedBackupCode = false

      // Verify PIN or backup code
      if (pin) {
        // Verify PIN
        if (!bestClient.pin_hash) {
          await incrementAttempts(supabaseClient, recoveredClientId)
          return new Response(
            JSON.stringify({ success: false, error: 'No PIN set for this account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authSuccess = await bcrypt.compare(pin, bestClient.pin_hash)
      } else if (backup_code) {
        // Verify backup code
        if (!bestClient.backup_codes || bestClient.backup_codes.length === 0) {
          await incrementAttempts(supabaseClient, recoveredClientId)
          return new Response(
            JSON.stringify({ success: false, error: 'No backup codes available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check each backup code
        for (let i = 0; i < bestClient.backup_codes.length; i++) {
          const isMatch = await bcrypt.compare(backup_code, bestClient.backup_codes[i])
          if (isMatch) {
            authSuccess = true
            usedBackupCode = true
            
            // Remove used backup code
            const newBackupCodes = bestClient.backup_codes.filter((_: string, idx: number) => idx !== i)
            await supabaseClient
              .from('clients')
              .update({ backup_codes: newBackupCodes })
              .eq('id', recoveredClientId)
            break
          }
        }
      }

      if (!authSuccess) {
        await incrementAttempts(supabaseClient, recoveredClientId)
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid PIN or backup code' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Reset recovery attempts on success
      await supabaseClient
        .from('clients')
        .update({ recovery_attempts: 0 })
        .eq('id', recoveredClientId)

      // Get the recovered client data
      const { data: recoveredClient, error: recoveredClientError } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', recoveredClientId)
        .single()

      if (recoveredClientError || !recoveredClient) {
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

              cardsFromNewClient++
            }
          }

          // Delete the temporary new client (optional, but clean)
          await supabaseClient
            .from('clients')
            .delete()
            .eq('id', new_client_id)
        }
      }

      // Return the ORIGINAL client_id (the one with the phone)
      // The frontend should replace its stored client_id with this one
      
      // Get remaining backup codes count
      const { data: updatedClient } = await supabaseClient
        .from('clients')
        .select('backup_codes')
        .eq('id', recoveredClientId)
        .single()

      const remainingBackupCodes = updatedClient?.backup_codes?.length || 0

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account recovered successfully',
          client_id: recoveredClientId,  // Always return the original!
          phone: recoveredClient.phone,
          cards_count: (originalCards?.length || 0) + cardsFromNewClient,
          cards_merged: cardsMerged,
          cards_transferred: cardsFromNewClient,
          used_backup_code: usedBackupCode,
          remaining_backup_codes: remainingBackupCodes
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
