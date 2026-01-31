-- ============================================================================
-- SCRIPT COMPLETO: RESET E RIPOPOLAMENTO DATABASE FIDELIX
-- ============================================================================
-- IMPORTANTE: Esegui questo script DOPO aver creato gli auth.users!
-- 
-- STEP 1: Crea prima questi 2 nuovi utenti in Supabase Dashboard > Authentication:
--   1. Email: fitgym@admin.test | Password: FitGym2026! | Auto Confirm: YES
--   2. Email: nailbeauty@admin.test | Password: NailBeauty2026! | Auto Confirm: YES
--
-- STEP 2: Copia gli USER_ID generati e sostituiscili nelle variabili sotto
-- STEP 3: Esegui questo script completo
-- ============================================================================

-- Definisci le variabili (SOSTITUISCI con i veri user_id!)
DO $$
DECLARE
  v_cafenescu_user_id UUID := '9b279ba0-86f4-45d2-9ab9-970873e14299';
  v_fitgym_user_id UUID := '06f81569-a1f1-4c20-bedb-049425a5a591';
  v_nailbeauty_user_id UUID := '958e3c94-410a-48e5-970d-6e9df48f2cff';
BEGIN
  RAISE NOTICE 'User IDs configurati:';
  RAISE NOTICE '  Cafenescu: %', v_cafenescu_user_id;
  RAISE NOTICE '  FitGym: %', v_fitgym_user_id;
  RAISE NOTICE '  Nail Beauty: %', v_nailbeauty_user_id;
END $$;

-- ============================================================================
-- PARTE 1: PULIZIA DATABASE
-- ============================================================================

-- 1.1 Cancella vecchi tenant (Active Fit e Nail Salon)
-- Il CASCADE eliminerà automaticamente: admins, stores, categories, products, cards, etc.
DELETE FROM tenants WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Active Fit
  'ffffffff-ffff-ffff-ffff-ffffffffffff'  -- Nail Salon
);

-- 1.2 Cancella tutte le CARDS esistenti (sono solo test senza scans)
DELETE FROM cards;

-- 1.3 Cancella tutti i CLIENTS esistenti (sono anonimi senza dati utili)
DELETE FROM clients;

-- 1.4 Verifica pulizia
SELECT 'Pulizia completata' as status;

-- ============================================================================
-- PARTE 2: CREAZIONE ADMINS
-- ============================================================================

-- 2.1 Admin per CAFENESCU
INSERT INTO admins (tenant_id, user_id, role, active, metadata)
VALUES (
  '11111111-1111-1111-1111-111111111111', -- Cafenescu
  '9b279ba0-86f4-45d2-9ab9-970873e14299',
  'owner',
  true,
  '{"demo": true, "created_by": "reset_script"}'::jsonb
);

-- 2.2 Admin per FITGYM
INSERT INTO admins (tenant_id, user_id, role, active, metadata)
VALUES (
  '22222222-2222-2222-2222-222222222222', -- FitGym
  '06f81569-a1f1-4c20-bedb-049425a5a591',
  'owner',
  true,
  '{"demo": true, "created_by": "reset_script"}'::jsonb
);

-- 2.3 Admin per NAIL BEAUTY
INSERT INTO admins (tenant_id, user_id, role, active, metadata)
VALUES (
  '33333333-3333-3333-3333-333333333333', -- Nail Beauty
  '958e3c94-410a-48e5-970d-6e9df48f2cff',
  'owner',
  true,
  '{"demo": true, "created_by": "reset_script"}'::jsonb
);

SELECT 'Admins creati' as status;

-- ============================================================================
-- PARTE 2.5: CREAZIONE STORES (Negozi/Filiali)
-- ============================================================================

-- Store per Cafenescu
INSERT INTO stores (id, tenant_id, name, address, city, postal_code, active)
VALUES (
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111111',
  'Cafenescu Centro',
  'Strada Principală 123',
  'Iași',
  '700001',
  true
);

-- Store per FitGym
INSERT INTO stores (id, tenant_id, name, address, city, postal_code, active)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  '22222222-2222-2222-2222-222222222222',
  'FitGym Iași',
  'Bulevardul Sport 45',
  'Iași',
  '700002',
  true
);

-- Store per Nail Beauty
INSERT INTO stores (id, tenant_id, name, address, city, postal_code, active)
VALUES (
  '33333333-3333-3333-3333-333333333334',
  '33333333-3333-3333-3333-333333333333',
  'Nail Beauty Salon',
  'Strada Frumuseții 78',
  'Iași',
  '700003',
  true
);

-- Aggiorna gli admins per collegare al negozio
UPDATE admins SET store_id = '11111111-1111-1111-1111-111111111112' 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

UPDATE admins SET store_id = '22222222-2222-2222-2222-222222222223' 
WHERE tenant_id = '22222222-2222-2222-2222-222222222222';

UPDATE admins SET store_id = '33333333-3333-3333-3333-333333333334' 
WHERE tenant_id = '33333333-3333-3333-3333-333333333333';

SELECT 'Stores creati e admins collegati' as status;

-- ============================================================================
-- PARTE 3: CAFENESCU - CAFFETTERIA
-- ============================================================================

-- 3.1 Categoria prodotti Cafenescu
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES (
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'Caffè e Bevande',
  'Caffè, cappuccini e bevande calde',
  '☕',
  true
);

-- 3.2 Prodotti Cafenescu (basati sulla foto del 28/01/26)
INSERT INTO products (tenant_id, category_id, name, description, price, active, metadata) VALUES
-- Espresso line
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Long Black', '20ml', 10.00, true, '{"size_ml": 20, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso Doppio', '60ml', 10.00, true, '{"size_ml": 60, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Americano', '90ml', 6.00, true, '{"size_ml": 90, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso Lungo', '60ml', 6.00, true, '{"size_ml": 60, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso', '30ml', 6.00, true, '{"size_ml": 30, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ristretto', '20ml', 6.00, true, '{"size_ml": 20, "type": "espresso"}'),
-- Milk-based
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Flat White', '180ml', 13.00, true, '{"size_ml": 180, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cortado', '90ml', 13.00, true, '{"size_ml": 90, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cappuccino Viennese', '200ml', 12.00, true, '{"size_ml": 200, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cappuccino', '150ml', 10.00, true, '{"size_ml": 150, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Latte Curato', '200ml', 10.00, true, '{"size_ml": 200, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Latte', '300ml', 10.00, true, '{"size_ml": 300, "type": "milk"}'),
-- Specialty
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ciocolata Calda', '300ml', 13.00, true, '{"size_ml": 300, "type": "chocolate"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ciocolata Rafinata', '300ml', 12.00, true, '{"size_ml": 300, "type": "chocolate"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Chai Latte', '300ml', 13.00, true, '{"size_ml": 300, "type": "tea"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cafe Citrus', '350ml', 12.00, true, '{"size_ml": 350, "type": "specialty"}');

-- 3.3 Reward Rules per Cafenescu: 6 caffè dello stesso prodotto = 1 gratis
DO $$
DECLARE
  v_product RECORD;
BEGIN
  FOR v_product IN 
    SELECT id, name, price 
    FROM products 
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
    ORDER BY price DESC, name
  LOOP
    INSERT INTO reward_rules (
      tenant_id,
      name,
      description,
      product_id,
      buy_count,
      reward_count,
      reward_product_id,
      active,
      priority
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'Cafenescu - ' || v_product.name || ' (6+1 gratis)',
      'Acquista 6 ' || v_product.name || ' e ricevi il 7° gratis',
      v_product.id,
      6,
      1,
      v_product.id,
      true,
      100
    );
  END LOOP;
END $$;

SELECT 'Cafenescu popolato' as status;

-- ============================================================================
-- PARTE 4: FITGYM - PALESTRA
-- ============================================================================

-- 4.1 Categorie FitGym
INSERT INTO product_categories (id, tenant_id, name, description, icon, active) VALUES
('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'Abbonamenti', 'Abbonamenti mensili fitness e aerobica', '💪', true),
('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Combo', 'Pacchetti combinati', '🎯', true),
('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', 'Seduta Singola', 'Ingressi singoli', '🎫', true);

-- 4.2 Prodotti FitGym (basati sulla foto del 26/01/26)
INSERT INTO products (tenant_id, category_id, name, description, price, active, metadata) VALUES
-- Abbonamenti
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Fitness', 'Abbonamento mensile fitness', 200.00, true, '{"type": "subscription", "duration_days": 30}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Fitness (elevi/studenti)', 'Abbonamento mensile fitness scontato', 170.00, true, '{"type": "subscription", "duration_days": 30, "discount": "student"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Aerobic', 'Abbonamento mensile aerobica', 220.00, true, '{"type": "subscription", "duration_days": 30}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Aerobic (elevi/studenti)', 'Abbonamento mensile aerobica scontato', 190.00, true, '{"type": "subscription", "duration_days": 30, "discount": "student"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Full Body Class', 'Abbonamento mensile full body', 160.00, true, '{"type": "subscription", "duration_days": 30}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Full Body Class (elevi/studenti)', 'Abbonamento mensile full body scontato', 130.00, true, '{"type": "subscription", "duration_days": 30, "discount": "student"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Antrenor Personal (sala + 12 sedinte)', 'Personal trainer con accesso sala', 600.00, true, '{"type": "personal", "sessions": 12}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Antrenor Personal (elevi/studenti)', 'Personal trainer scontato', 550.00, true, '{"type": "personal", "sessions": 12, "discount": "student"}'),
-- Combo
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'Fitness+Aerobic', 'Combo fitness e aerobica', 300.00, true, '{"type": "combo"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'Fitness+Full Body Class', 'Combo fitness e full body', 250.00, true, '{"type": "combo"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'Aerobic+Full Body Class', 'Combo aerobica e full body', 330.00, true, '{"type": "combo"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'EL+EA (fitness)', 'Combo elevi/studenti', 350.00, true, '{"type": "combo", "discount": "student"}'),
-- Sedute singole
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'Fitness/Aerobic/Full Body', 'Ingresso singolo', 30.00, true, '{"type": "single_entry"}'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'Antrenor Personal', 'Sessione singola personal trainer', 80.00, true, '{"type": "personal_single"}');

-- 4.3 Reward Rules FitGym: 10 ingressi = 1 gratis (solo per sedute singole)
INSERT INTO reward_rules (tenant_id, name, description, product_id, buy_count, reward_count, reward_product_id, active, priority)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'FitGym - ' || p.name || ' (10+1 gratis)',
  'Acquista 10 ingressi ' || p.name || ' e ricevi l''11° gratis',
  p.id,
  10,
  1,
  p.id,
  true,
  100
FROM products p
WHERE p.tenant_id = '22222222-2222-2222-2222-222222222222'
  AND p.category_id = '44444444-4444-4444-4444-444444444443'; -- Solo sedute singole

SELECT 'FitGym popolato' as status;

-- ============================================================================
-- PARTE 5: NAIL BEAUTY - SALONE DI BELLEZZA
-- ============================================================================

-- 5.1 Categoria Nail Beauty
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES (
  '55555555-5555-5555-5555-555555555551',
  '33333333-3333-3333-3333-333333333333',
  'Trattamenti',
  'Manicure, pedicure e nail art',
  '💅',
  true
);

-- 5.2 Prodotti Nail Beauty (esempi - personalizza se hai foto specifiche)
INSERT INTO products (tenant_id, category_id, name, description, price, active, metadata) VALUES
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Manicure Base', 'Manicure classica con smalto', 35.00, true, '{"duration_min": 45}'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Manicure con Gel', 'Manicure con smalto gel', 50.00, true, '{"duration_min": 60}'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Pedicure Base', 'Pedicure classica', 40.00, true, '{"duration_min": 60}'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Pedicure con Gel', 'Pedicure con smalto gel', 55.00, true, '{"duration_min": 75}'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Nail Art', 'Decorazione unghie personalizzata', 25.00, true, '{"duration_min": 30}'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551', 'Ricostruzione Unghie', 'Ricostruzione completa', 70.00, true, '{"duration_min": 120}');

-- 5.3 Reward Rules Nail Beauty: 5 trattamenti = 1 sconto 50%
INSERT INTO reward_rules (tenant_id, name, description, category_id, buy_count, reward_count, reward_category_id, active, priority)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Nail Beauty - 5 trattamenti = 50% sconto',
  'Dopo 5 trattamenti ricevi il 6° con 50% di sconto',
  '55555555-5555-5555-5555-555555555551',
  5,
  1,
  '55555555-5555-5555-5555-555555555551',
  true,
  100
);

SELECT 'Nail Beauty popolato' as status;

-- ============================================================================
-- VERIFICA FINALE
-- ============================================================================

SELECT 'RESET E POPOLAMENTO COMPLETATO!' as status;

-- Riepilogo tenant
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT s.id) as stores,
  COUNT(DISTINCT pc.id) as categories,
  COUNT(DISTINCT p.id) as products,
  COUNT(DISTINCT rr.id) as reward_rules,
  COUNT(DISTINCT a.id) as admins
FROM tenants t
LEFT JOIN stores s ON t.id = s.tenant_id
LEFT JOIN product_categories pc ON t.id = pc.tenant_id
LEFT JOIN products p ON t.id = p.tenant_id
LEFT JOIN reward_rules rr ON t.id = rr.tenant_id
LEFT JOIN admins a ON t.id = a.tenant_id
WHERE t.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
GROUP BY t.name
ORDER BY t.name;

-- Elenco prodotti per tenant
SELECT 
  t.name as tenant,
  pc.name as categoria,
  p.name as prodotto,
  p.price as prezzo,
  p.description
FROM products p
JOIN tenants t ON p.tenant_id = t.id
JOIN product_categories pc ON p.category_id = pc.id
WHERE t.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ORDER BY t.name, pc.name, p.price DESC;
