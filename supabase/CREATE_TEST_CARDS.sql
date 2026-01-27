-- ============================================================================
-- CREARE CARTE CLIENTE DI TEST
-- ============================================================================

-- OPZIONE 1: Usa l'Edge Function per creare carte (CONSIGLIATO)
-- Vai sull'app → /card/new → genera automaticamente

-- OPZIONE 2: Crea manualmente nel DB

-- Client di test
INSERT INTO clients (id, email, name)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'test@cliente.com', 'Cliente Test');

-- Carta per Cafenescu
INSERT INTO cards (id, client_id, tenant_id, qr_code, loyalty_state, active)
VALUES 
  ('ca111111-1111-1111-1111-111111111111', 
   'c1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'FIDELIX-CAFE-TEST-001',
   '{}',
   true);

-- Carta per Active Fit
INSERT INTO cards (id, client_id, tenant_id, qr_code, loyalty_state, active)
VALUES 
  ('ca222222-2222-2222-2222-222222222222', 
   'c1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'FIDELIX-FIT-TEST-001',
   '{}',
   true);

-- Carta per Nail Salon
INSERT INTO cards (id, client_id, tenant_id, qr_code, loyalty_state, active)
VALUES 
  ('ca333333-3333-3333-3333-333333333333', 
   'c1111111-1111-1111-1111-111111111111',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'FIDELIX-NAIL-TEST-001',
   '{}',
   true);

-- Verifica le carte create
SELECT 
  c.qr_code,
  t.name as tenant_name,
  c.active
FROM cards c
JOIN tenants t ON c.tenant_id = t.id
ORDER BY t.name;

-- ============================================================================
