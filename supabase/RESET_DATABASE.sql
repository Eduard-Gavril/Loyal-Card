-- ============================================================================
-- RESET COMPLETO DATABASE - ATTENZIONE: CANCELLA TUTTO!
-- ============================================================================

-- STEP 1: CANCELLARE TUTTI I DATI (ordine importante per foreign keys)
-- ============================================================================

-- Cancella scan events
DELETE FROM scan_events;

-- Cancella cards
DELETE FROM cards;

-- Cancella clients
DELETE FROM clients;

-- Cancella admins
DELETE FROM admins;

-- Cancella reward rules
DELETE FROM reward_rules;

-- Cancella products
DELETE FROM products;

-- Cancella product categories
DELETE FROM product_categories;

-- Cancella stores
DELETE FROM stores;

-- Cancella tenants
DELETE FROM tenants;

-- ============================================================================
-- STEP 2: CREARE I 3 TENANT
-- ============================================================================

-- TENANT 1: CAFENESCU (Caffetteria)
INSERT INTO tenants (id, name, slug, brand_color, logo_url, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Cafenescu', 'cafenescu', '#8B4513', null, true);

-- TENANT 2: ACTIVE FIT (Palestra)
INSERT INTO tenants (id, name, slug, brand_color, logo_url, active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active Fit', 'active-fit', '#FF6B35', null, true);

-- TENANT 3: NAIL SALON (Centro Estetico)
INSERT INTO tenants (id, name, slug, brand_color, logo_url, active)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Nail Salon', 'nail-salon', '#FF1493', null, true);

-- ============================================================================
-- STEP 3: CREARE STORES
-- ============================================================================

INSERT INTO stores (id, tenant_id, name, address, city, postal_code)
VALUES 
  -- Cafenescu
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Cafenescu Centro', 'Via Roma 1', 'Milano', '20121'),
  -- Active Fit
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active Fit Centro', 'Via Fitness 10', 'Milano', '20100'),
  -- Nail Salon
  ('11111111-2222-3333-4444-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Nail Salon Beauty', 'Via Bellezza 25', 'Milano', '20122');

-- ============================================================================
-- STEP 4: COLLEGARE GLI ADMIN (SOSTITUISCI CON I TUOI USER ID)
-- ============================================================================

-- Admin per Cafenescu
-- Email: cafenescu@admin.test
-- User ID: 65713892-2780-4024-851f-1520fc714031
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '65713892-2780-4024-851f-1520fc714031', 'owner', '22222222-2222-2222-2222-222222222221', true);

-- Admin per Active Fit
-- Email: activefit@admin.test
-- User ID: f17bc99e-381a-4ce7-ba79-fd2136c29409
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f17bc99e-381a-4ce7-ba79-fd2136c29409', 'owner', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);

-- Admin per Nail Salon
-- Email: admin@fidelix.test
-- User ID: de530c06-29e6-43ad-b658-ac8aab303640
INSERT INTO admins (tenant_id, user_id, role, store_id, active)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'de530c06-29e6-43ad-b658-ac8aab303640', 'owner', '11111111-2222-3333-4444-555555555555', true);

-- ============================================================================
-- STEP 5: CREARE CATEGORIE PRODOTTI
-- ============================================================================

-- Cafenescu: Caffè
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES 
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Caffè', 'Bevande a base di caffè', '☕', true);

-- Active Fit: Abbonamenti
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Abbonamenti', 'Abbonamenti mensili palestra', '💪', true);

-- Nail Salon: Trattamenti
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES 
  ('22222222-3333-4444-5555-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Trattamenti Unghie', 'Manicure, pedicure e nail art', '💅', true);

-- ============================================================================
-- STEP 6: CREARE PRODOTTI
-- ============================================================================

-- CAFENESCU - Prodotti Caffè
INSERT INTO products (id, tenant_id, category_id, name, description, price, active)
VALUES 
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso', 'Caffè espresso classico', 1.50, true),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cappuccino', 'Espresso con schiuma di latte', 2.50, true),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Latte Macchiato', 'Latte con caffè', 3.00, true);

-- ACTIVE FIT - Abbonamento
INSERT INTO products (id, tenant_id, category_id, name, description, price, active)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Abbonamento Mensile', 'Accesso illimitato per 1 mese', 49.90, true);

-- NAIL SALON - Trattamenti
INSERT INTO products (id, tenant_id, category_id, name, description, price, active)
VALUES 
  ('33333333-4444-5555-6666-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Manicure Completa', 'Trattamento unghie completo', 35.00, true),
  ('33333333-4444-5555-6666-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Pedicure', 'Trattamento piedi e unghie', 40.00, true),
  ('33333333-4444-5555-6666-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Nail Art', 'Decorazione unghie personalizzata', 25.00, true);

-- ============================================================================
-- STEP 7: CREARE REGOLE LOYALTY
-- ============================================================================

-- CAFENESCU: 5 Espresso = 6° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '5 Espresso = 1 Gratis', '44444444-4444-4444-4444-444444444441', 5, 1, '44444444-4444-4444-4444-444444444441', true, 100);

-- CAFENESCU: 5 Cappuccino = 6° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '5 Cappuccino = 1 Gratis', '44444444-4444-4444-4444-444444444442', 5, 1, '44444444-4444-4444-4444-444444444442', true, 100);

-- ACTIVE FIT: 11 mesi = 12° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11 Mesi = 12° Gratis', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 11, 1, 'dddddddd-dddd-dddd-dddd-dddddddddddd', true, 100);

-- NAIL SALON: 8 manicure = 9° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('44444444-5555-6666-7777-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '8 Manicure = 9° Gratis', '33333333-4444-5555-6666-777777777777', 8, 1, '33333333-4444-5555-6666-777777777777', true, 100);

-- ============================================================================
-- VERIFICA FINALE
-- ============================================================================

-- Verifica tenants
SELECT id, name, slug, active FROM tenants ORDER BY name;

-- Verifica admins con i loro tenant
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

-- Verifica prodotti per tenant
SELECT 
  t.name as tenant_name,
  COUNT(p.id) as num_prodotti
FROM tenants t
LEFT JOIN products p ON t.id = p.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- ============================================================================
-- FATTO! ORA PUOI:
-- ============================================================================
-- 1. Login con cafenescu@admin.test → gestisci Cafenescu
-- 2. Login con activefit@admin.test → gestisci Active Fit
-- 3. Login con admin@fidelix.test → gestisci Nail Salon
-- ============================================================================
