// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

interface LinkPhoneRequest {
  client_id: string
  phone: string
  pin: string  // 6-digit PIN
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

// Validate PIN format (6 digits)
function isValidPIN(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

// Generate 3 backup codes in format XXXX-XXXX
function generateBackupCodes(): string[] {
  const codes: string[] = []
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  for (let i = 0; i < 3; i++) {
    let code = ''
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += '-'
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    codes.push(code)
  }
  
  return codes
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

    const { client_id, phone, pin }: LinkPhoneRequest = await req.json()

    if (!client_id || !phone || !pin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing client_id, phone, or PIN' }),
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

    // Validate PIN format (must be 6 digits)
    if (!isValidPIN(pin)) {
      return new Response(
        JSON.stringify({ success: false, error: 'PIN must be exactly 6 digits' }),
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

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin)

    // Generate backup codes
    const plainBackupCodes = generateBackupCodes()
    
    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map(code => bcrypt.hash(code))
    )

    // Update client with phone, PIN, and backup codes
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({ 
        phone: normalizedPhone,
        pin_hash: pinHash,
        backup_codes: hashedBackupCodes,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to link phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success with plain backup codes (ONLY TIME THEY'RE SHOWN)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone number linked successfully',
        backup_codes: plainBackupCodes  // Show these to user ONCE
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Link phone error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
