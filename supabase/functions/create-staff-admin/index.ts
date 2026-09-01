import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Creates a new admin account with role 'staff' (scan-only, see
// admins_role_check) for the caller's own tenant. Only an 'owner' admin may
// call this. Must run with the service role key: creating an auth user and
// inserting an admins row for a *different* user_id both require it, since
// RLS only lets an owner manage their own row.

interface CreateStaffAdminRequest {
  email: string
  password: string
}

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

    // Decode JWT to get caller's user_id (JWT already validated by Supabase gateway)
    const jwt = authHeader.replace('Bearer ', '')
    const parts = jwt.split('.')
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JWT format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let callerId: string
    try {
      const payload = JSON.parse(atob(parts[1]))
      callerId = payload.sub
      if (!callerId) throw new Error('No sub in JWT')
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to decode JWT' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: callerAdmin, error: adminError } = await supabase
      .from('admins')
      .select('tenant_id, role')
      .eq('user_id', callerId)
      .eq('active', true)
      .single()

    if (adminError || !callerAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin not found or inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (callerAdmin.role !== 'owner') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only the owner admin can add staff' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password }: CreateStaffAdminRequest = await req.json()
    if (!email?.trim() || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing email or password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    })
    if (createError || !created?.user) {
      return new Response(
        JSON.stringify({ success: false, error: createError?.message || 'Could not create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: insertError } = await supabase.from('admins').insert({
      user_id: created.user.id,
      tenant_id: callerAdmin.tenant_id,
      role: 'staff',
    })
    if (insertError) {
      // Roll back the auth user so we don't leave an orphaned account.
      await supabase.auth.admin.deleteUser(created.user.id)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user_id: created.user.id, role: 'staff' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-staff-admin error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
