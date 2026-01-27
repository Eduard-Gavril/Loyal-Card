-- ============================================================================
-- CREATE TEST CARD for Cafenescu
-- ============================================================================

-- Step 1: Create a test client
INSERT INTO clients (id, name, email)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'Test Cliente', 'test@cliente.test')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a card for Cafenescu tenant with QR code FIDELIX-C4F2BE7C
INSERT INTO cards (
  id,
  client_id, 
  tenant_id, 
  qr_code, 
  loyalty_state, 
  active
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999',  -- test client
  '11111111-1111-1111-1111-111111111111',  -- Cafenescu tenant
  'FIDELIX-C4F2BE7C',                       -- your QR code
  '{}',                                     -- empty loyalty state (no stamps yet)
  true
)
ON CONFLICT (qr_code) 
DO UPDATE SET 
  client_id = EXCLUDED.client_id,
  tenant_id = EXCLUDED.tenant_id,
  active = EXCLUDED.active;

-- Step 3: Verify the card was created
SELECT 
  c.id,
  c.qr_code,
  c.tenant_id,
  t.name as tenant_name,
  c.client_id,
  cl.name as client_name,
  c.loyalty_state,
  c.active
FROM cards c
JOIN tenants t ON c.tenant_id = t.id
JOIN clients cl ON c.client_id = cl.id
WHERE c.qr_code = 'FIDELIX-C4F2BE7C';
