-- ================================================
-- Add Cafenescu Tenant and Admin
-- Created: 2026-04-14
-- ================================================
-- Tenant ID: 8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c
-- Admin UID: de83d928-fe0a-4f95-9894-0808aef76e30
-- ================================================

-- Insert Cafenescu tenant
INSERT INTO tenants (
  id,
  name,
  slug,
  logo_url,
  brand_color,
  active,
  latitude,
  longitude,
  address,
  city,
  postal_code,
  metadata,
  created_at,
  updated_at
) VALUES (
  '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c',
  'Cafenescu',
  'cafenescu',
  'https://gthrrolmuoxhqsiziwjf.supabase.co/storage/v1/object/public/tenant-logos/Cafenescu.jpg',
  '#8B4513',
  true,
  47.209695,
  27.017565,
  'Str.Cuza Vodă 65',
  'Târgu Frumos',
  '705300',
  jsonb_build_object(
    'type', 'cafe',
    'description', 'Cafenea artizanală în inima orașului'
  ),
  now(),
  now()
);

-- Link existing admin user to Cafenescu tenant
-- Admin credentials already created:
-- Email: cafenescu@loyal.card
-- Password: Cafenescu2026!
-- UID: de83d928-fe0a-4f95-9894-0808aef76e30
INSERT INTO admins (
  user_id,
  tenant_id,
  role,
  active,
  created_at
) VALUES (
  'de83d928-fe0a-4f95-9894-0808aef76e30',
  '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c',
  'owner',
  true,
  now()
);

-- Verify tenant creation
SELECT 
  id,
  name,
  slug,
  active,
  city,
  created_at
FROM tenants
WHERE id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c';

-- Verify admin linkage
SELECT 
  a.user_id,
  a.tenant_id,
  a.role,
  a.active,
  t.name as tenant_name,
  u.email
FROM admins a
JOIN tenants t ON t.id = a.tenant_id
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id = 'de83d928-fe0a-4f95-9894-0808aef76e30';

-- ================================================
-- Add Product Category for Cafenescu
-- ================================================

INSERT INTO product_categories (id, tenant_id, name, description, icon, active, created_at, updated_at) VALUES
  ('9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Băuturi Cafenescu', 'Cafea, ceai și băuturi calde', '☕', true, now(), now());

-- ================================================
-- Add Products for Cafenescu
-- ================================================

-- Insert products
INSERT INTO products (id, tenant_id, name, price, metadata, active, created_at, updated_at) VALUES
  -- Espresso category
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Ristretto 20ml', 7, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 20), true, now(), now()),
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Espresso 30ml', 7, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 30), true, now(), now()),
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Espresso Lungo 60ml', 7, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 60), true, now(), now()),
  ('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Americano 90ml', 7, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 90), true, now(), now()),
  ('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Espresso Doppio 60ml', 11, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 60), true, now(), now()),
  ('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Long Black 120ml', 11, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'espresso', 'size_ml', 120), true, now(), now()),
  ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Espresso Macchiato 50ml', 8, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'milk', 'size_ml', 50), true, now(), now()),
  ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Espresso cu Lapte 90ml', 8, jsonb_build_object('emoji', '☕', 'category', 'Cafenescu', 'type', 'milk', 'size_ml', 90), true, now(), now()),
  
  -- Milk-based category
  ('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Cappuccino 150ml', 10, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'cappuccino', 'size_ml', 150), true, now(), now()),
  ('0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Cappuccino Vienez 220ml', 12, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'cappuccino', 'size_ml', 220), true, now(), now()),
  ('1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Cortado 90ml', 13, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'milk', 'size_ml', 90), true, now(), now()),
  ('2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Flat White 180ml', 14, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'milk', 'size_ml', 180), true, now(), now()),
  ('3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Caffe Latte 200ml', 12, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'latte', 'size_ml', 200), true, now(), now()),
  ('4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Latte Grande 330ml', 16, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'latte', 'size_ml', 330), true, now(), now()),
  ('5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Flavoured Latte 220ml', 14, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'latte', 'size_ml', 220), true, now(), now()),
  ('6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Flavoured Latte Grande 350ml', 17, jsonb_build_object('emoji', '🥛', 'category', 'Cafenescu', 'type', 'latte', 'size_ml', 350), true, now(), now()),
  
  -- Other beverages
  ('7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Ceai 300ml', 10, jsonb_build_object('emoji', '🍵', 'category', 'Cafenescu', 'type', 'tea', 'size_ml', 300), true, now(), now()),
  ('8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c', '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', 'Ciocolată Caldă 330ml', 15, jsonb_build_object('emoji', '🍫', 'category', 'Cafenescu', 'type', 'chocolate', 'size_ml', 330), true, now(), now());

-- ================================================
-- Add Reward Rules (6 stamps = 7th free)
-- ================================================

INSERT INTO reward_rules (tenant_id, product_id, name, description, buy_count, reward_count, priority, reset_on_redeem, active, created_at) VALUES
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'Ristretto Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', 'Espresso Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Espresso Lungo Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Americano Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'Espresso Doppio Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Long Black Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'Espresso Macchiato Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'Espresso cu Lapte Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'Cappuccino Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', 'Cappuccino Vienez Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', 'Cortado Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c', 'Flat White Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'Caffe Latte Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', 'Latte Grande Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'Flavoured Latte Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a', 'Flavoured Latte Grande Gratuit', '6 cafele = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', 'Ceai Gratuit', '6 ceaiuri = 7-a gratis', 6, 1, 1, true, true, now()),
  ('8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c', '8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c', 'Ciocolată Caldă Gratuită', '6 ciocolate = 7-a gratis', 6, 1, 1, true, true, now());

-- ================================================
-- Verify products and rules
-- ================================================

-- Count products
SELECT COUNT(*) as total_products 
FROM products 
WHERE tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c';

-- Count rules
SELECT COUNT(*) as total_rules 
FROM reward_rules 
WHERE tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c';

-- Show all products with their rules
SELECT 
  p.name as product_name,
  p.price,
  p.metadata->>'size_ml' as size_ml,
  p.metadata->>'type' as type,
  r.name as rule_name,
  r.buy_count,
  r.reward_count
FROM products p
LEFT JOIN reward_rules r ON r.product_id = p.id
WHERE p.tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c'
ORDER BY p.price, p.name;

-- ================================================
-- Final Summary
-- ================================================

SELECT 
  '✅ Cafenescu Setup Complete!' as status,
  (SELECT COUNT(*) FROM products WHERE tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c') as total_products,
  (SELECT COUNT(*) FROM reward_rules WHERE tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c') as total_rules,
  (SELECT COUNT(*) FROM product_categories WHERE tenant_id = '8c7a9b2e-3f1d-4e5b-a6c8-9d2e1f4b3a5c') as total_categories;
