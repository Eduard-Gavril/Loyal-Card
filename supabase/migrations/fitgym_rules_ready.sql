-- ================================================
-- FitGym Multi-Level Loyalty Rules Setup
-- READY TO RUN - IDs already configured
-- ================================================
-- Tenant: FitGym (f57ed92f-86a5-4461-909f-bcc07a81db4e)
-- This creates 2 rules for each relevant product:
--   → 6 stamps = 50% discount (no reset)
--   → 12 stamps = Free product (resets)
-- ================================================

-- First, let's see what products we have
SELECT id, name, metadata FROM products 
WHERE tenant_id = 'f57ed92f-86a5-4461-909f-bcc07a81db4e'
AND id IN (
  'fe9cb0b1-dfd7-4f13-9642-4285f1e8eab5',
  'ab041556-b63d-4ee6-b75b-11fd4aa21b9f',
  '0a3a8014-87a1-4afa-b7d6-2787363b54df',
  '151960aa-b3a6-4920-87f2-7dd059a5f023',
  '19650cfc-7881-479d-a87c-5cd26f02d89e',
  'cf79abeb-79c0-44b0-b637-edda27e4c32d',
  '6ed4f51f-56cc-452c-a79c-7c2d42e62a68',
  'cfd32391-3ba8-4ebf-a935-b43f45de1b57',
  'af5e0728-6388-4d2f-b26f-135f1935078e',
  'ace39c53-fad9-4713-ab50-a1b092f16dd3'
)
ORDER BY name;

-- ================================================
-- UNCOMMENT THE SECTION BELOW AFTER VERIFYING PRODUCTS
-- ================================================

/*
-- Delete existing rules for these products (optional, prevents duplicates)
DELETE FROM reward_rules 
WHERE tenant_id = 'f57ed92f-86a5-4461-909f-bcc07a81db4e'
AND product_id IN (
  'fe9cb0b1-dfd7-4f13-9642-4285f1e8eab5',
  'ab041556-b63d-4ee6-b75b-11fd4aa21b9f'
  -- Add more if needed
);

-- ================================================
-- EXAMPLE: Rules for "Fitness" Product
-- ================================================
-- Assuming 'fe9cb0b1-dfd7-4f13-9642-4285f1e8eab5' is "Fitness"

-- Rule 1: 50% Discount at 6 stamps (doesn't reset)
INSERT INTO reward_rules (
  tenant_id,
  product_id,
  name,
  description,
  buy_count,
  reward_count,
  priority,
  reset_on_redeem,
  discount_percent,
  active
) VALUES (
  'f57ed92f-86a5-4461-909f-bcc07a81db4e',
  'fe9cb0b1-dfd7-4f13-9642-4285f1e8eab5',  -- Fitness/Aerobic product
  'Sconto 50%',
  '6 abbonamenti = 50% sconto sul prossimo',
  6,
  1,
  1,      -- Priority 1 (shown first)
  false,  -- DON'T reset counter
  50,     -- 50% discount
  true
);

-- Rule 2: Free Product at 12 stamps (resets)
INSERT INTO reward_rules (
  tenant_id,
  product_id,
  name,
  description,
  buy_count,
  reward_count,
  priority,
  reset_on_redeem,
  discount_percent,
  active
) VALUES (
  'f57ed92f-86a5-4461-909f-bcc07a81db4e',
  'fe9cb0b1-dfd7-4f13-9642-4285f1e8eab5',  -- Same product
  'Abbonamento Gratis',
  '12 abbonamenti = 13° gratis',
  12,
  1,
  2,      -- Priority 2 (shown second)
  true,   -- Reset counter after redemption
  NULL,   -- NULL = free product
  true
);

-- ================================================
-- ADD MORE PRODUCTS HERE IF NEEDED
-- ================================================
-- Copy the above INSERT statements and change:
--   1. product_id
--   2. name/description if needed

-- Example for second product (uncomment and modify):
-- INSERT INTO reward_rules (tenant_id, product_id, name, description, buy_count, reward_count, priority, reset_on_redeem, discount_percent, active)
-- VALUES ('f57ed92f-86a5-4461-909f-bcc07a81db4e', 'ab041556-b63d-4ee6-b75b-11fd4aa21b9f', 'Sconto 50%', '6 = 50% off', 6, 1, 1, false, 50, true);
-- 
-- INSERT INTO reward_rules (tenant_id, product_id, name, description, buy_count, reward_count, priority, reset_on_redeem, discount_percent, active)
-- VALUES ('f57ed92f-86a5-4461-909f-bcc07a81db4e', 'ab041556-b63d-4ee6-b75b-11fd4aa21b9f', 'Gratis', '12 = free', 12, 1, 2, true, NULL, true);

*/

-- ================================================
-- VERIFICATION
-- ================================================
SELECT 
  r.id,
  r.name,
  p.name as product_name,
  r.buy_count,
  r.priority,
  r.reset_on_redeem,
  r.discount_percent,
  r.active
FROM reward_rules r
LEFT JOIN products p ON r.product_id = p.id
WHERE r.tenant_id = 'f57ed92f-86a5-4461-909f-bcc07a81db4e'
ORDER BY p.name, r.priority;
