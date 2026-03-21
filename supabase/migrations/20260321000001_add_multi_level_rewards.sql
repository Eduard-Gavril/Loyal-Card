-- Add columns for multi-level reward system
-- This allows rules like: 6 stamps = 50% discount (no reset), 12 stamps = free (reset)

ALTER TABLE loyalty_rules
ADD COLUMN IF NOT EXISTS reset_on_redeem BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER NULL,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

COMMENT ON COLUMN loyalty_rules.reset_on_redeem IS 'If true, counter resets to 0 when reward is redeemed. If false, counter continues (e.g., for intermediate milestones like 50% discount)';
COMMENT ON COLUMN loyalty_rules.discount_percent IS 'Percentage discount to apply (e.g., 50 for 50% off). If NULL, reward is free product';
COMMENT ON COLUMN loyalty_rules.priority IS 'Order in which rules are evaluated and displayed. Lower numbers = higher priority';

-- Create index for efficient rule lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_rules_priority ON loyalty_rules(tenant_id, product_id, active, priority);

-- Example FitGym rules (adjust IDs based on your setup):
-- Rule 1: 6 stamps → 50% discount, doesn't reset
-- Rule 2: 12 stamps → Free product, resets counter

-- UNCOMMENT AND ADJUST THESE IF YOU WANT TO INSERT EXAMPLE DATA:
-- 
-- INSERT INTO loyalty_rules (tenant_id, product_id, name, description, buy_count, reward_count, priority, reset_on_redeem, discount_percent, active)
-- VALUES 
--   ('YOUR_FITGYM_TENANT_ID', 'YOUR_PRODUCT_ID', 'Sconto 50%', '6 abbonamenti = 50% sconto sul prossimo', 6, 1, 1, false, 50, true),
--   ('YOUR_FITGYM_TENANT_ID', 'YOUR_PRODUCT_ID', 'Abbonamento Gratis', '12 abbonamenti = 13° gratis', 12, 1, 2, true, null, true);
