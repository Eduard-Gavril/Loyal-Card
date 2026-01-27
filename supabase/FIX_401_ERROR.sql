-- ============================================================================
-- FIX URGENTE: COLLEGARE L'UTENTE LOGGATO ALLA TABELLA ADMINS
-- ============================================================================

-- STEP 1: Verifica se l'utente esiste nella tabella admins
SELECT * FROM admins WHERE user_id = 'f17bc99e-381a-4ce7-ba79-fd2136c29409';

-- Se la query sopra restituisce ZERO risultati, esegui questo:

-- STEP 2: Collega l'utente al tenant Cafenescu come owner
INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'f17bc99e-381a-4ce7-ba79-fd2136c29409', 'owner', true);

-- VERIFICA che sia stato inserito:
SELECT 
  a.id,
  a.user_id,
  a.role,
  t.name as tenant_name
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
WHERE a.user_id = 'f17bc99e-381a-4ce7-ba79-fd2136c29409';

-- Dovresti vedere:
-- user_id: f17bc99e-381a-4ce7-ba79-fd2136c29409
-- role: owner
-- tenant_name: Cafenescu (o Demo Coffee Shop)

-- ============================================================================
-- DOPO AVER ESEGUITO QUESTO, RIPROVA A SCANSIONARE!
-- ============================================================================
