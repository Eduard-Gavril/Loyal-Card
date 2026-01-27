-- ============================================================================
-- FIX: Insert/Update Admin Records Only
-- ============================================================================
-- Use this if you don't want to reset the entire database
-- This will insert or update the admin records with ON CONFLICT

-- Admin for Cafenescu
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '65713892-2780-4024-851f-1520fc714031', 'owner', '22222222-2222-2222-2222-222222222221', true)
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id,
  active = EXCLUDED.active;

-- Admin for Active Fit
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f17bc99e-381a-4ce7-ba79-fd2136c29409', 'owner', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true)
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id,
  active = EXCLUDED.active;

-- Admin for Nail Salon
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'de530c06-29e6-43ad-b658-ac8aab303640', 'owner', '11111111-2222-3333-4444-555555555555', true)
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id,
  active = EXCLUDED.active;

-- Verify the admins were created
SELECT 
  a.user_id,
  t.name as tenant_name,
  a.role,
  a.active,
  s.name as store_name
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
LEFT JOIN stores s ON a.store_id = s.id
ORDER BY t.name;
