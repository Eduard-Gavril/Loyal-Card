-- ============================================================================
-- VERIFICA E FIX ADMIN ESISTENTE
-- ============================================================================

-- STEP 1: Controlla lo stato dell'admin
SELECT 
  a.id,
  a.user_id,
  a.tenant_id,
  a.role,
  a.active,  -- <-- IMPORTANTE: deve essere TRUE
  a.store_id,
  t.name as tenant_name,
  t.active as tenant_active
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
WHERE a.user_id = 'f17bc99e-381a-4ce7-ba79-fd2136c29409';

-- Se vedi active = false, esegui questo:
UPDATE admins 
SET active = true
WHERE user_id = 'f17bc99e-381a-4ce7-ba79-fd2136c29409';

-- Se vedi tenant_active = false, esegui questo:
UPDATE tenants
SET active = true
WHERE id = '11111111-1111-1111-1111-111111111111';

-- ============================================================================
-- VERIFICA ANCHE CHE IL TENANT ABBIA PRODOTTI
-- ============================================================================
SELECT 
  p.id,
  p.name,
  p.active,
  p.tenant_id
FROM products p
WHERE p.tenant_id = '11111111-1111-1111-1111-111111111111'
  AND p.active = true;

-- Se non hai prodotti attivi, attivali:
UPDATE products
SET active = true
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- ============================================================================
-- DOPO QUESTI FIX, RIPROVA A SCANSIONARE
-- ============================================================================
