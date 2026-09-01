import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Lets an 'owner' admin list the staff (scan-only) accounts they created for
// their tenant, with a scan count per staff member, and remove one. Removal
// deletes the auth user (so they can no longer log in) but only deactivates
// the admins row rather than deleting it, since scan_events.admin_id has an
// ON DELETE CASCADE to admins and we want to keep past scan history intact.

interface ManageStaffRequest {
  action: 'list' | 'delete'
  staff_admin_id?: string
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
        JSON.stringify({ success: false, error: 'Only the owner admin can manage staff' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, staff_admin_id }: ManageStaffRequest = await req.json()

    if (action === 'list') {
      const { data: staff, error: staffError } = await supabase
        .from('admins')
        .select('id, user_id, active, created_at')
        .eq('tenant_id', callerAdmin.tenant_id)
        .eq('role', 'staff')
        .order('created_at', { ascending: false })

      if (staffError) {
        return new Response(
          JSON.stringify({ success: false, error: staffError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const staffList = staff || []

      const [emails, scanCounts] = await Promise.all([
        Promise.all(
          staffList.map(async (s) => {
            const { data } = await supabase.auth.admin.getUserById(s.user_id)
            return data?.user?.email || null
          })
        ),
        Promise.all(
          staffList.map(async (s) => {
            const { count } = await supabase
              .from('scan_events')
              .select('id', { count: 'exact', head: true })
              .eq('admin_id', s.id)
            return count || 0
          })
        ),
      ])

      const result = staffList.map((s, i) => ({
        id: s.id,
        email: emails[i],
        active: s.active,
        created_at: s.created_at,
        scan_count: scanCounts[i],
      }))

      return new Response(
        JSON.stringify({ success: true, staff: result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      if (!staff_admin_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing staff_admin_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: target, error: targetError } = await supabase
        .from('admins')
        .select('id, user_id, tenant_id, role')
        .eq('id', staff_admin_id)
        .single()

      if (targetError || !target) {
        return new Response(
          JSON.stringify({ success: false, error: 'Staff account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (target.tenant_id !== callerAdmin.tenant_id || target.role !== 'staff') {
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot remove this account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Deactivate first so access is revoked even if the auth deletion below fails.
      const { error: deactivateError } = await supabase
        .from('admins')
        .update({ active: false })
        .eq('id', target.id)

      if (deactivateError) {
        return new Response(
          JSON.stringify({ success: false, error: deactivateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase.auth.admin.deleteUser(target.user_id)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('manage-staff-admins error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
