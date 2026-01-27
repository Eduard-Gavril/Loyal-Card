-- ============================================================================
-- NUOVO TENANT 1: ACTIVE FIT (Palestra)
-- ============================================================================

INSERT INTO tenants (id, name, slug, brand_color, logo_url, active)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active Fit', 'active-fit', '#FF6B35', null, true);

-- Store per Active Fit
INSERT INTO stores (id, tenant_id, name, address, city, postal_code)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active Fit Centro', 'Via Fitness 10', 'Milano', '20100');

-- Categoria per Active Fit
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Abbonamenti', 'Abbonamenti mensili palestra', '💪', true);

-- Prodotto: Abbonamento Mensile
INSERT INTO products (id, tenant_id, category_id, name, description, price, active)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Abbonamento Mensile', 'Accesso illimitato per 1 mese', 190.00, true);

-- Reward Rule: 11 mesi pagati = 12° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   '11 Mesi = 12° Mese Gratis', 
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   11, 
   1, 
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   true,
   100);

-- ============================================================================
-- NUOVO TENANT 2: NAIL SALON (Centro Estetico)
-- ============================================================================

INSERT INTO tenants (id, name, slug, brand_color, logo_url, active)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Nail Salon', 'nail-salon', '#FF1493', null, true);

-- Store per Nail Salon
INSERT INTO stores (id, tenant_id, name, address, city, postal_code)
VALUES 
  ('11111111-2222-3333-4444-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Nail Salon Beauty', 'Via Bellezza 25', 'Milano', '20122');

-- Categoria per Nail Salon
INSERT INTO product_categories (id, tenant_id, name, description, icon, active)
VALUES 
  ('22222222-3333-4444-5555-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Trattamenti Unghie', 'Manicure, pedicure e nail art', '💅', true);

-- Prodotto: Trattamento Unghie
INSERT INTO products (id, tenant_id, category_id, name, description, price, active)
VALUES 
  ('33333333-4444-5555-6666-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Manicure Completa', 'Trattamento unghie completo', 35.00, true),
  ('33333333-4444-5555-6666-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Pedicure', 'Trattamento piedi e unghie', 40.00, true),
  ('33333333-4444-5555-6666-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'Nail Art', 'Decorazione unghie personalizzata', 25.00, true);

-- Reward Rule: 8 trattamenti = 9° gratis
INSERT INTO reward_rules (id, tenant_id, name, product_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('44444444-5555-6666-7777-888888888888', 
   'ffffffff-ffff-ffff-ffff-ffffffffffff', 
   '8 Manicure = 9° Gratis', 
   '33333333-4444-5555-6666-777777777777',
   8, 
   1, 
   '33333333-4444-5555-6666-777777777777',
   true,
   100);

-- Reward Rule alternativa: qualsiasi 8 trattamenti unghie = 1 manicure gratis
INSERT INTO reward_rules (id, tenant_id, name, category_id, buy_count, reward_count, reward_product_id, active, priority)
VALUES 
  ('55555555-6666-7777-8888-999999999999', 
   'ffffffff-ffff-ffff-ffff-ffffffffffff', 
   '8 Trattamenti = 1 Manicure Gratis', 
   '22222222-3333-4444-5555-666666666666',
   8, 
   1, 
   '33333333-4444-5555-6666-777777777777',
   true,
   90);

-- ============================================================================
-- RIEPILOGO
-- ============================================================================
-- 
-- ACTIVE FIT:
-- - Prodotto: Abbonamento Mensile (€49.90)
-- - Regola: 11 abbonamenti pagati → 12° gratis
--
-- NAIL SALON:
-- - Prodotti: Manicure (€35), Pedicure (€40), Nail Art (€25)
-- - Regola 1: 8 manicure → 9° manicure gratis
-- - Regola 2: 8 trattamenti qualsiasi → 1 manicure gratis
-- ============================================================================
