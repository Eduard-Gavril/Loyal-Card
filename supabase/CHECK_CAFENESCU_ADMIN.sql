-- ============================================================================
-- VERIFICA ADMIN CAFENESCU
-- ============================================================================

-- Controlla se l'admin esiste con l'UUID corretto
SELECT 
  a.id,
  a.user_id,
  a.tenant_id,
  a.role,
  a.active,
  a.store_id,
  t.name as tenant_name
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
WHERE a.user_id = '65713892-2780-4024-851f-1520fc714031';

-- Se non restituisce nulla, l'admin non esiste!

-- ============================================================================
-- SOLUZIONI POSSIBILI:
-- ============================================================================

-- SOLUZIONE 1: Se l'admin non esiste, crealo:
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '65713892-2780-4024-851f-1520fc714031', 'owner', '22222222-2222-2222-2222-222222222221', true)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET active = true;

-- SOLUZIONE 2: Se esiste ma è inattivo, attivalo:
UPDATE admins 
SET active = true
WHERE user_id = '65713892-2780-4024-851f-1520fc714031';

-- ============================================================================
-- VERIFICA FINALE
-- ============================================================================

-- Conta quanti admin hai
SELECT COUNT(*) as num_admins FROM admins;

-- Vedi tutti gli admin
SELECT 
  a.user_id,
  t.name as tenant,
  a.role,
  a.active
FROM admins a
JOIN tenants t ON a.tenant_id = t.id;

-- ============================================================================
