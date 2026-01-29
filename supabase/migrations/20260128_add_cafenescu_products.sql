-- ============================================================================
-- CAFENESCU PRODUCTS SETUP
-- Tenant: 11111111-1111-1111-1111-111111111111
-- Store: 22222222-2222-2222-2222-222222222221
-- Category: 33333333-3333-3333-3333-333333333331
-- ============================================================================

-- 1. DELETE OLD DATA (for safety)
-- Delete old reward rules for this category
DELETE FROM reward_rules 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111' 
  AND category_id = '33333333-3333-3333-3333-333333333331';

-- Delete old products for this tenant and category
DELETE FROM products 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111' 
  AND category_id = '33333333-3333-3333-3333-333333333331';

-- 2. INSERT NEW PRODUCTS
INSERT INTO products (tenant_id, category_id, name, description, price, active, metadata) VALUES
-- Espresso line
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Long Black', '20ml', 10.00, true, '{"size_ml": 20, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso Doppio', '60ml', 10.00, true, '{"size_ml": 60, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Americano', '90ml', 6.00, true, '{"size_ml": 90, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso Lungo', '60ml', 6.00, true, '{"size_ml": 60, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Espresso', '30ml', 6.00, true, '{"size_ml": 30, "type": "espresso"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ristretto', '20ml', 6.00, true, '{"size_ml": 20, "type": "espresso"}'),

-- Milk-based coffee
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Flat White', '180ml', 13.00, true, '{"size_ml": 180, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cortado', '90ml', 13.00, true, '{"size_ml": 90, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cappuccino Viennese', '200ml', 12.00, true, '{"size_ml": 200, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cappuccino', '150ml', 10.00, true, '{"size_ml": 150, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Latte Cured', '200ml', 10.00, true, '{"size_ml": 200, "type": "milk"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Latte', '300ml', 10.00, true, '{"size_ml": 300, "type": "milk"}'),

-- Specialty drinks
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ciocolata Calda', '300ml', 13.00, true, '{"size_ml": 300, "type": "chocolate"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Ciocolata Rafinata', '300ml', 12.00, true, '{"size_ml": 300, "type": "chocolate"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Chai Latte', '300ml', 13.00, true, '{"size_ml": 300, "type": "tea"}'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Cafe Citrus', '350ml', 12.00, true, '{"size_ml": 350, "type": "specialty"}');

-- 3. INSERT REWARD RULES (One rule per product, grouped by price)
-- Logic: Buy 6, get the 7th free (buy_count = 6)
-- Products with same price share the same rule to prevent price abuse

-- Get product IDs for rule creation
DO $$
DECLARE
  v_product RECORD;
BEGIN
  -- Create individual reward rules for each product
  FOR v_product IN 
    SELECT id, name, price 
    FROM products 
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
      AND category_id = '33333333-3333-3333-3333-333333333331'
    ORDER BY price, name
  LOOP
    INSERT INTO reward_rules (
      tenant_id,
      name,
      description,
      product_id,
      buy_count,
      reward_count,
      active,
      priority
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'Cafenescu - ' || v_product.name || ' (6+1 gratis)',
      'Acquista 6 ' || v_product.name || ' e il 7° è gratis (solo stesso prodotto)',
      v_product.id,
      6,  -- buy_count: need 6 purchases
      1,  -- reward_count: get 1 free
      true,
      100  -- high priority
    );
  END LOOP;
END $$;

-- 4. VERIFY INSERTED DATA
SELECT 
  p.name, 
  p.description, 
  p.price,
  p.metadata->>'size_ml' as size_ml,
  p.metadata->>'type' as type
FROM products p
WHERE p.tenant_id = '11111111-1111-1111-1111-111111111111'
  AND p.category_id = '33333333-3333-3333-3333-333333333331'
ORDER BY p.price DESC, p.name;

-- Verify reward rules (grouped by price)
SELECT 
  rr.name,
  p.name as product_name,
  p.price,
  rr.buy_count,
  rr.reward_count,
  rr.active
FROM reward_rules rr
JOIN products p ON rr.product_id = p.id
WHERE rr.tenant_id = '11111111-1111-1111-1111-111111111111'
ORDER BY p.price DESC, p.name;
