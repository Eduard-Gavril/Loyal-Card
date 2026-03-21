# Multi-Level Reward System - Setup Guide

## Overview
The multi-level reward system allows you to create multiple rewards for the same product with different thresholds and behaviors. Perfect for scenarios like:
- **6 stamps** → 50% discount (counter continues)
- **12 stamps** → Free product (counter resets)

## Database Schema Changes

### New Columns in `loyalty_rules` (reward_rules)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `reset_on_redeem` | BOOLEAN | true | If true, counter resets to 0 when reward is redeemed. If false, counter continues. |
| `discount_percent` | INTEGER | NULL | Percentage discount (e.g., 50 for 50% off). If NULL, reward is free product. |
| `priority` | INTEGER | 0 | Order in which rules are evaluated. Lower number = higher priority (shown first). |

## Setup Instructions for FitGym

### Step 1: Apply Database Migration

Run the migration file:
```bash
cd supabase
supabase db push
```

Or manually execute: `migrations/20260321000001_add_multi_level_rewards.sql`

### Step 2: Create Two Rules via Supabase Dashboard

Go to: **Supabase Dashboard → Table Editor → reward_rules**

#### Rule 1: 50% Discount at 6 stamps
```sql
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
  'YOUR_FITGYM_TENANT_ID',
  'YOUR_FITNESS_PRODUCT_ID',  -- ID of "Fitness" product
  'Sconto 50%',
  '6 abbonamenti = 50% sconto sul prossimo',
  6,
  1,
  1,  -- Priority 1 (shown first)
  false,  -- DON'T reset counter
  50,  -- 50% discount
  true
);
```

#### Rule 2: Free Product at 12 stamps
```sql
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
  'YOUR_FITGYM_TENANT_ID',
  'YOUR_FITNESS_PRODUCT_ID',  -- Same product ID
  'Abbonamento Gratis',
  '12 abbonamenti = 13° gratis',
  12,
  1,
  2,  -- Priority 2 (shown second)
  true,  -- Reset counter after redemption
  NULL,  -- NULL = free product
  true
);
```

### Step 3: Find Your IDs

To find `tenant_id`:
```sql
SELECT id, name FROM tenants WHERE name ILIKE '%fitgym%';
```

To find `product_id`:
```sql
SELECT id, name FROM products WHERE tenant_id = 'YOUR_TENANT_ID' AND name ILIKE '%fitness%';
```

## How It Works

### Customer Journey Example:

1. **Scan 1-5**: Shows progress toward both rules
2. **Scan 6**: 
   - ✅ Milestone reached! "Prossimo abbonamento con SCONTO 50% 🎉"
   - Counter continues (reset_on_redeem=false)
3. **Customer redeems 50% discount**:
   - Discount applied
   - Counter stays at 6 (doesn't reset)
4. **Scan 7-11**: Progress continues toward 12
5. **Scan 12**:
   - ✅ Free product unlocked!
   - Counter continues until redeemed
6. **Customer redeems free product**:
   - Counter resets to 0 (reset_on_redeem=true)
   - Both milestones restart

## Frontend Display

The system automatically shows:
- **Both progress bars** in ClientCard (6/6 and 12/12)
- **Yellow badge** showing "50% OFF 💰" or "1 🎁"
- **Green notification** with appropriate message
- **Priority order** (priority 1 shown before priority 2)

## Edge Function Logic

### register-scan (Backend)
- Loads ALL rules ordered by priority
- Increments counters for ALL applicable rules simultaneously
- Checks thresholds for each rule independently
- Doesn't reset counters (handled in redeem-reward)

### redeem-reward (Backend)
- Checks `reset_on_redeem` flag
- If `true`: resets counter to 0
- If `false`: keeps counter value
- Decrements rewards count

## Testing

1. Create scan events with adminScanner
2. After 6 scans: Verify 50% discount appears
3. Redeem 50% discount: Verify counter stays at 6
4. Continue scanning to 12
5. Redeem free product: Verify counter resets to 0

## Troubleshooting

**Q: Rules not showing in ClientCard?**
- Check `active = true` in reward_rules table
- Verify product_id matches your scans

**Q: Counter resets when it shouldn't?**
- Check `reset_on_redeem = false` for intermediate milestones

**Q: Wrong order displayed?**
- Check `priority` values (lower = shown first)

## Future Enhancements

To add more levels (e.g., 3 stamps = 10% discount):
1. Insert new rule with `priority=0` (shown first)
2. Set `reset_on_redeem=false`
3. Set `discount_percent=10`
4. Keep same `product_id`

---

**Created:** March 21, 2026
**For:** FitGym multi-level loyalty system
