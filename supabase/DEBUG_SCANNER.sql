-- ============================================================================
-- SCRIPT DI DEBUG: VERIFICARE PERCHÉ LO SCANNER NON FUNZIONA
-- ============================================================================

-- 1. VERIFICA SE HAI ADMIN REGISTRATI
-- ============================================================================
SELECT 
  a.id as admin_id,
  a.user_id,
  a.tenant_id,
  a.role,
  a.active,
  t.name as tenant_name
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
ORDER BY a.created_at DESC;

-- Se questa query non restituisce risultati, è il problema!
-- Soluzione: crea un admin come mostrato in GUIDA_CREARE_ADMIN.sql


-- 2. VERIFICA SE IL TENANT HA PRODOTTI
-- ============================================================================
SELECT 
  t.name as tenant_name,
  COUNT(p.id) as num_prodotti
FROM tenants t
LEFT JOIN products p ON t.id = p.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Se il tuo tenant ha 0 prodotti, devi aggiungerli!


-- 3. VERIFICA SE CI SONO CARTE ATTIVE
-- ============================================================================
SELECT 
  c.qr_code,
  c.tenant_id,
  t.name as tenant_name,
  c.active,
  c.created_at
FROM cards c
JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.created_at DESC
LIMIT 10;


-- 4. VERIFICA REGOLE LOYALTY
-- ============================================================================
SELECT 
  r.name,
  r.tenant_id,
  t.name as tenant_name,
  r.buy_count,
  r.reward_count,
  r.active
FROM reward_rules r
JOIN tenants t ON r.tenant_id = t.id
ORDER BY t.name, r.priority DESC;


-- ============================================================================
-- SOLUZIONE RAPIDA: SETUP COMPLETO PER TEST
-- ============================================================================
-- Se hai bisogno di testare SUBITO, esegui questi comandi in ordine:

-- PASSO 1: Assicurati che il tenant Cafenescu esista
SELECT * FROM tenants WHERE slug = 'demo-coffee';

-- PASSO 2: Crea un utente admin in Supabase Dashboard
--          Dashboard → Authentication → Users → Add user
--          Email: test@cafenescu.com
--          Password: Test123456!
--          COPIA L'USER ID

-- PASSO 3: Collega l'admin al tenant (SOSTITUISCI USER_ID)
INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TUO_USER_ID_QUI', 'owner', true);

-- PASSO 4: Verifica che abbia prodotti
SELECT * FROM products WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- Se non hai prodotti, esegui seed.sql

-- PASSO 5: Fai login con test@cafenescu.com e prova a scansionare

-- ============================================================================
