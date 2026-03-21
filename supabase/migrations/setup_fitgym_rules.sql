-- ================================================
-- FitGym Multi-Level Loyalty Rules Setup
-- ================================================
-- This script creates 2 reward rules for FitGym:
-- 1. 6 stamps → 50% discount (no reset)
-- 2. 12 stamps → Free product (resets)
--
-- BEFORE RUNNING: Replace the placeholders with actual IDs
-- ================================================

-- Step 1: Find your tenant_id and product_id
-- Uncomment and run these queries first:

-- SELECT id, name FROM tenants WHERE name ILIKE '%fitgym%';
-- SELECT id, name FROM products WHERE name ILIKE '%fitness%' LIMIT 10;

-- Step 2: Replace these variables
DO $$
DECLARE
  v_tenant_id UUID := 'REPLACE_WITH_YOUR_FITGYM_TENANT_ID';
  v_product_id UUID := 'REPLACE_WITH_YOUR_FITNESS_PRODUCT_ID';
BEGIN

  -- Delete existing rules to avoid duplicates (optional)
  -- DELETE FROM reward_rules 
  -- WHERE tenant_id = v_tenant_id 
  -- AND product_id = v_product_id;

  -- Rule 1: 50% Discount at 6 stamps
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
    active,
    created_at,
    updated_at
  ) VALUES (
    v_tenant_id,
    v_product_id,
    'Sconto 50%',
    '6 abbonamenti = 50% sconto sul prossimo',
    6,  -- Threshold
    1,  -- Number of rewards given
    1,  -- Priority (lower = shown first)
    false,  -- DON'T reset counter after redemption
    50,  -- 50% discount
    true,  -- Active
    NOW(),
    NOW()
  );

  -- Rule 2: Free Product at 12 stamps
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
    active,
    created_at,
    updated_at
  ) VALUES (
    v_tenant_id,
    v_product_id,
    'Abbonamento Gratis',
    '12 abbonamenti = 13° gratis',
    12,  -- Threshold
    1,  -- Number of rewards given
    2,  -- Priority (shown second)
    true,  -- Reset counter after redemption
    NULL,  -- NULL means free product (not a discount)
    true,  -- Active
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Successfully created 2 reward rules for FitGym!';
  RAISE NOTICE 'Rule 1: 6 stamps → 50%% discount (no reset)';
  RAISE NOTICE 'Rule 2: 12 stamps → Free product (resets)';

END $$;

-- Step 3: Verify the rules were created
SELECT 
  id,
  name,
  description,
  buy_count,
  priority,
  reset_on_redeem,
  discount_percent,
  active
FROM reward_rules
WHERE tenant_id = 'REPLACE_WITH_YOUR_FITGYM_TENANT_ID'
ORDER BY priority;

-- Expected output:
-- | name                | buy_count | priority | reset_on_redeem | discount_percent |
-- |---------------------|-----------|----------|-----------------|------------------|
-- | Sconto 50%          | 6         | 1        | false           | 50               |
-- | Abbonamento Gratis  | 12        | 2        | true            | NULL             |
