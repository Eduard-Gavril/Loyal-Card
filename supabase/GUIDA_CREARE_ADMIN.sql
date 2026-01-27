-- ============================================================================
-- GUIDA: COME CREARE UN NUOVO ADMIN/OWNER PER UN TENANT
-- ============================================================================

-- STEP 1: CREARE L'UTENTE IN SUPABASE AUTH
-- ============================================================================
-- Questo NON si fa via SQL, ma tramite:
-- A) Supabase Dashboard → Authentication → Users → "Add user"
-- B) Oppure l'utente si registra dalla tua app
-- 
-- Dopo la creazione, COPIA L'USER ID (es: a1b2c3d4-5678-90ab-cdef-1234567890ab)

-- STEP 2: COLLEGARE L'UTENTE AL TENANT NELLA TABELLA ADMINS
-- ============================================================================
-- Sostituisci:
-- - USER_ID_QUI con l'ID utente copiato da Supabase Auth
-- - TENANT_ID_QUI con l'ID del tenant a cui vuoi collegarlo

INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('TENANT_ID_QUI', 'USER_ID_QUI', 'owner', true);

-- ESEMPIO PRATICO per Active Fit:
INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'USER_ID_QUI', 'owner', true);

-- ESEMPIO PRATICO per Nail Salon:
INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'USER_ID_QUI', 'owner', true);

-- ============================================================================
-- OPZIONALE: VERIFICARE CHE L'ADMIN SIA STATO CREATO
-- ============================================================================
SELECT 
  a.id,
  a.user_id,
  a.role,
  t.name as tenant_name
FROM admins a
JOIN tenants t ON a.tenant_id = t.id
WHERE a.user_id = 'USER_ID_QUI';

-- ============================================================================
-- RIEPILOGO DEL PROCESSO COMPLETO
-- ============================================================================
--
-- 1. CREA TENANT (se nuovo)
--    ↓
--    INSERT INTO tenants (name, slug, brand_color, ...)
--
-- 2. CREA UTENTE IN SUPABASE AUTH
--    ↓
--    Dashboard → Authentication → Users → "Add user"
--    Email: admin@activefit.com
--    Password: (scelta)
--    ↓
--    COPIA USER ID
--
-- 3. COLLEGA UTENTE AL TENANT
--    ↓
--    INSERT INTO admins (tenant_id, user_id, role, ...)
--
-- 4. (OPZIONALE) CREA STORES
--    ↓
--    INSERT INTO stores (tenant_id, name, address, ...)
--
-- 5. (OPZIONALE) CREA CATEGORIE PRODOTTI
--    ↓
--    INSERT INTO product_categories (tenant_id, name, ...)
--
-- 6. (OPZIONALE) CREA PRODOTTI
--    ↓
--    INSERT INTO products (tenant_id, category_id, name, price, ...)
--
-- 7. (OPZIONALE) CREA REGOLE LOYALTY
--    ↓
--    INSERT INTO reward_rules (tenant_id, product_id, buy_count, ...)
--
-- ============================================================================

-- ============================================================================
-- ESEMPIO COMPLETO: CREARE ADMIN PER "CAFENESCU"
-- ============================================================================

-- PASSO 1: Il tenant esiste già (ID: 11111111-1111-1111-1111-111111111111)

-- PASSO 2: Crea utente in Supabase Dashboard
--          Email: admin@cafenescu.com
--          Password: (la tua scelta)
--          → OTTIENI USER ID: esempio "abc12345-6789-0123-4567-890abcdef123"

-- PASSO 3: Collega l'utente al tenant
INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'abc12345-6789-0123-4567-890abcdef123', 'owner', true);

-- FATTO! Ora admin@cafenescu.com può fare login come owner di Cafenescu

-- ============================================================================
-- CREARE ANCHE STAFF (NON OWNER)
-- ============================================================================
-- Se vuoi creare un dipendente (staff) invece di un owner:

INSERT INTO admins (tenant_id, user_id, role, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'USER_ID_STAFF', 'staff', true);

-- Differenza:
-- - 'owner': accesso completo, può gestire tutto
-- - 'staff': può solo scansionare QR e registrare vendite

-- ============================================================================
-- QUERY UTILI
-- ============================================================================

-- Vedere tutti gli admin di un tenant:
SELECT 
  a.id,
  a.user_id,
  a.role,
  a.active,
  a.created_at
FROM admins a
WHERE a.tenant_id = '11111111-1111-1111-1111-111111111111';

-- Vedere tutti i tenant con i loro admin:
SELECT 
  t.name as tenant_name,
  t.slug,
  COUNT(a.id) as num_admins
FROM tenants t
LEFT JOIN admins a ON t.id = a.tenant_id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- Verificare se un email ha già un account:
-- (Vai su Supabase Dashboard → Authentication → Users e cerca l'email)

-- ============================================================================
