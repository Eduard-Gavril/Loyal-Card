-- ================================================
-- FitGym Multi-Level Rules - AUTOMATED SETUP
-- ================================================
-- This script creates 2-level rules for ALL FitGym products
-- Tenant ID: f57ed92f-86a5-4461-909f-bcc07a81db4e
-- ================================================

-- Step 1: Add new columns to reward_rules table (if not exists)
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS reset_on_redeem BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER NULL,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Create index for efficient rule lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_priority ON reward_rules(tenant_id, product_id, active, priority);

-- Step 2: Create rules for all products
DO $$
DECLARE
  v_tenant_id UUID := 'f57ed92f-86a5-4461-909f-bcc07a81db4e';
  v_product RECORD;
  v_count INT := 0;
BEGIN
  
  -- Loop through all specified products
  FOR v_product IN 
    SELECT id, name 
    FROM products 
    WHERE tenant_id = v_tenant_id
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
    AND active = true
  LOOP
    
    -- Delete existing rules for this product (prevents duplicates)
    DELETE FROM reward_rules 
    WHERE tenant_id = v_tenant_id 
    AND product_id = v_product.id;
    
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
      v_product.id,
      v_product.name || ' - Sconto 50%',
      '6 abbonamenti = 50% sconto sul prossimo',
      6,
      1,
      1,
      false,
      50,
      true,
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
      v_product.id,
      v_product.name || ' - Gratis',
      '12 abbonamenti = 13° gratis',
      12,
      1,
      2,
      true,
      NULL,
      true,
      NOW(),
      NOW()
    );
    
    v_count := v_count + 1;
    RAISE NOTICE 'Created 2 rules for product: %', v_product.name;
    
  END LOOP;
  
  RAISE NOTICE '✅ Successfully created % rule pairs (% total rules)', v_count, v_count * 2;
  
END $$;

-- ================================================
-- VERIFICATION QUERY (run separately if needed)
-- ================================================
-- Copy and run this separately to verify the created rules:

/*
SELECT 
  r.id,
  p.name as product_name,
  r.name as rule_name,
  r.buy_count,
  r.priority,
  CASE 
    WHEN r.discount_percent IS NOT NULL THEN r.discount_percent || '% OFF'
    ELSE 'FREE'
  END as reward_type,
  CASE 
    WHEN r.reset_on_redeem THEN '🔄 Resets'
    ELSE '➡️ Continues'
  END as behavior,
  r.active
FROM reward_rules r
JOIN products p ON r.product_id = p.id
WHERE r.tenant_id = 'f57ed92f-86a5-4461-909f-bcc07a81db4e'
ORDER BY p.name, r.priority;
*/
