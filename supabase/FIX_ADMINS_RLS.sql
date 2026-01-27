-- ============================================================================
-- FIX: Add missing RLS policies for admins table
-- ============================================================================
-- The register-scan Edge Function can't read admins because RLS blocks it
-- This adds the necessary policies

-- Policy 1: Allow admins to read their own record
CREATE POLICY "admins_read_own_record" ON admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Allow service_role (Edge Functions) full access
CREATE POLICY "service_role_manage_admins" ON admins
  FOR ALL TO service_role
  WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;
