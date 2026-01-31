-- ============================================================================
-- QUERY PER VEDERE I DATI ESISTENTI NEL DATABASE
-- Basato sulla struttura reale delle tabelle
-- ============================================================================

-- 1. TENANTS (5 righe)
SELECT * FROM tenants ORDER BY name;
| id                                   | name        | slug       | logo_url | brand_color | active | metadata                                                                             | created_at                    | updated_at                    | latitude    | longitude   | address               | city | postal_code |
| ------------------------------------ | ----------- | ---------- | -------- | ----------- | ------ | ------------------------------------------------------------------------------------ | ----------------------------- | ----------------------------- | ----------- | ----------- | --------------------- | ---- | ----------- |
| aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | Active Fit  | active-fit | null     | #FF6B35     | true   | {}                                                                                   | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | null        | null        | null                  | null | null        |
| 11111111-1111-1111-1111-111111111111 | Cafenescu   | cafenescu  | null     | #8B5CF6     | true   | {"type":"cafe","description":"La tua caffetteria di fiducia"}                        | 2026-01-30 21:58:26.044871+00 | 2026-01-30 21:58:26.044871+00 | 47.21092700 | 27.02172700 | Strada Principală 123 | Iași | 700001      |
| 22222222-2222-2222-2222-222222222222 | FitGym      | fitgym     | null     | #10B981     | true   | {"type":"gym","description":"Fitness e benessere per tutti"}                         | 2026-01-30 21:58:26.044871+00 | 2026-01-30 21:58:26.044871+00 | 47.20254900 | 27.01065200 | Bulevardul Sport 45   | Iași | 700002      |
| 33333333-3333-3333-3333-333333333333 | Nail Beauty | nailbeauty | null     | #EC4899     | true   | {"type":"beauty","description":"Salone di bellezza per unghie e cura della persona"} | 2026-01-30 21:58:26.044871+00 | 2026-01-30 21:58:26.044871+00 | 47.21074500 | 27.00882100 | Strada Frumuseții 78  | Iași | 700003      |
| ffffffff-ffff-ffff-ffff-ffffffffffff | Nail Salon  | nail-salon | null     | #FF1493     | true   | {}                                                                                   | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | null        | null        | null                  | null | null        |
-- 2. ADMINS (2 righe) - con info tenant
SELECT 
  a.*,
  t.name as tenant_name
FROM admins a
LEFT JOIN tenants t ON a.tenant_id = t.id
ORDER BY t.name;
| id                                   | tenant_id                            | user_id                              | role  | store_id                             | active | metadata | created_at                    | updated_at                    | tenant_name |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ----- | ------------------------------------ | ------ | -------- | ----------------------------- | ----------------------------- | ----------- |
| 9d2034e4-288c-4e28-8487-c572b03fbe05 | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | f17bc99e-381a-4ce7-ba79-fd2136c29409 | owner | bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Active Fit  |
| dae5fa37-ebee-4a63-a87c-f230edc8cece | ffffffff-ffff-ffff-ffff-ffffffffffff | de530c06-29e6-43ad-b658-ac8aab303640 | owner | 11111111-2222-3333-4444-555555555555 | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  |
-- 3. STORES (2 righe)
SELECT 
  s.*,
  t.name as tenant_name
FROM stores s
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY t.name;
| id                                   | tenant_id                            | name              | address         | city   | postal_code | active | metadata | created_at                    | updated_at                    | tenant_name |
| ------------------------------------ | ------------------------------------ | ----------------- | --------------- | ------ | ----------- | ------ | -------- | ----------------------------- | ----------------------------- | ----------- |
| bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | Active Fit Centro | Via Fitness 10  | Milano | 20100       | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Active Fit  |
| 11111111-2222-3333-4444-555555555555 | ffffffff-ffff-ffff-ffff-ffffffffffff | Nail Salon Beauty | Via Bellezza 25 | Milano | 20122       | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  |
-- 4. PRODUCT_CATEGORIES (2 righe) - NOTA: si chiama product_categories, non categories!
SELECT 
  pc.*,
  t.name as tenant_name
FROM product_categories pc
LEFT JOIN tenants t ON pc.tenant_id = t.id
ORDER BY t.name;
| id                                   | tenant_id                            | name               | description                   | icon | active | created_at                    | updated_at                    | tenant_name |
| ------------------------------------ | ------------------------------------ | ------------------ | ----------------------------- | ---- | ------ | ----------------------------- | ----------------------------- | ----------- |
| cccccccc-cccc-cccc-cccc-cccccccccccc | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | Abbonamenti        | Abbonamenti mensili palestra  | 💪   | true   | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Active Fit  |
| 22222222-3333-4444-5555-666666666666 | ffffffff-ffff-ffff-ffff-ffffffffffff | Trattamenti Unghie | Manicure, pedicure e nail art | 💅   | true   | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  |
-- 5. PRODUCTS (4 righe)
SELECT 
  p.*,
  t.name as tenant_name,
  pc.name as category_name
FROM products p
LEFT JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
ORDER BY t.name, p.price DESC;
| id                                   | tenant_id                            | category_id                          | name                | description                       | image_url | price | active | metadata | created_at                    | updated_at                    | tenant_name | category_name      |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------------- | --------------------------------- | --------- | ----- | ------ | -------- | ----------------------------- | ----------------------------- | ----------- | ------------------ |
| dddddddd-dddd-dddd-dddd-dddddddddddd | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | cccccccc-cccc-cccc-cccc-cccccccccccc | Abbonamento Mensile | Accesso illimitato per 1 mese     | null      | 49.90 | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Active Fit  | Abbonamenti        |
| 33333333-4444-5555-6666-888888888888 | ffffffff-ffff-ffff-ffff-ffffffffffff | 22222222-3333-4444-5555-666666666666 | Pedicure            | Trattamento piedi e unghie        | null      | 40.00 | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  | Trattamenti Unghie |
| 33333333-4444-5555-6666-777777777777 | ffffffff-ffff-ffff-ffff-ffffffffffff | 22222222-3333-4444-5555-666666666666 | Manicure Completa   | Trattamento unghie completo       | null      | 35.00 | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  | Trattamenti Unghie |
| 33333333-4444-5555-6666-999999999999 | ffffffff-ffff-ffff-ffff-ffffffffffff | 22222222-3333-4444-5555-666666666666 | Nail Art            | Decorazione unghie personalizzata | null      | 25.00 | true   | {}       | 2026-01-27 08:00:40.760254+00 | 2026-01-27 08:00:40.760254+00 | Nail Salon  | Trattamenti Unghie |
-- 6. REWARD_RULES (0 righe)
SELECT 
  rr.*,
  t.name as tenant_name,
  p.name as product_name,
  pc.name as category_name
FROM reward_rules rr
LEFT JOIN tenants t ON rr.tenant_id = t.id
LEFT JOIN products p ON rr.product_id = p.id
LEFT JOIN product_categories pc ON rr.category_id = pc.id;

Success. No rows returned

-- 7. CLIENTS (42 righe) - primi 10
SELECT * FROM clients ORDER BY created_at DESC LIMIT 10;
| id                                   | email | phone | name | metadata                                                                                      | created_at                    | updated_at                    |
| ------------------------------------ | ----- | ----- | ---- | --------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- |
| 197f9360-93c7-4bcf-a3b0-8bb41f7c3ee5 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-31 11:16:23.059675+00 | 2026-01-31 11:16:23.059675+00 |
| cbecd47f-bc2a-471f-84e6-257517ee6f70 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-31 09:41:25.067667+00 | 2026-01-31 09:41:25.067667+00 |
| aae77b84-3e78-4d16-bf50-7063c9497400 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-31 09:41:12.894502+00 | 2026-01-31 09:41:12.894502+00 |
| 5927bb8b-4469-43bb-b7c3-3161d9b81d35 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-31 01:03:19.846352+00 | 2026-01-31 01:03:19.846352+00 |
| 2aa02dcc-681f-4206-addc-f607d5e8f129 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-31 00:14:17.814817+00 | 2026-01-31 00:14:17.814817+00 |
| 5eeda2d6-7936-413d-aed6-3b05cd13fcac | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"33333333-3333-3333-3333-333333333333"} | 2026-01-30 23:59:30.597052+00 | 2026-01-30 23:59:30.597052+00 |
| 8f2f71e0-703d-48b0-abdc-276c439d2f57 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"33333333-3333-3333-3333-333333333333"} | 2026-01-30 23:59:30.588862+00 | 2026-01-30 23:59:30.588862+00 |
| 9fbb4396-8f54-4a87-a032-47140e367266 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-30 23:00:33.145904+00 | 2026-01-30 23:00:33.145904+00 |
| e9c35277-4d43-4df7-82ef-c4d98abb33ee | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"11111111-1111-1111-1111-111111111111"} | 2026-01-30 23:00:33.116701+00 | 2026-01-30 23:00:33.116701+00 |
| cf0f3f28-04f3-4282-86a5-99de52ffca96 | null  | null  | null | {"created_via":"generate_client_id","first_tenant_id":"22222222-2222-2222-2222-222222222222"} | 2026-01-30 22:53:19.425524+00 | 2026-01-30 22:53:19.425524+00 |
-- 8. CARDS (38 righe) - prime 10 con info
SELECT 
  c.*,
  t.name as tenant_name,
  cl.name as client_name,
  cl.email as client_email
FROM cards c
LEFT JOIN tenants t ON c.tenant_id = t.id
LEFT JOIN clients cl ON c.client_id = cl.id
ORDER BY c.created_at DESC
LIMIT 10;
| id                                   | client_id                            | tenant_id                            | qr_code          | wallet_type | wallet_id | wallet_serial | loyalty_state | active | last_scan_at | created_at                    | updated_at                    | tenant_name | client_name | client_email |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ---------------- | ----------- | --------- | ------------- | ------------- | ------ | ------------ | ----------------------------- | ----------------------------- | ----------- | ----------- | ------------ |
| f0c3bbdb-3e84-46e3-9b10-16e2a745f138 | 197f9360-93c7-4bcf-a3b0-8bb41f7c3ee5 | 22222222-2222-2222-2222-222222222222 | FIDELIX-13D58B27 | null        | null      | null          | {}            | true   | null         | 2026-01-31 11:16:36.74367+00  | 2026-01-31 11:16:36.74367+00  | FitGym      | null        | null         |
| 503ed5f8-1211-479f-98a2-b4f37baaca65 | 197f9360-93c7-4bcf-a3b0-8bb41f7c3ee5 | 11111111-1111-1111-1111-111111111111 | FIDELIX-73CD1B3D | null        | null      | null          | {}            | true   | null         | 2026-01-31 11:16:23.190805+00 | 2026-01-31 11:16:23.190805+00 | Cafenescu   | null        | null         |
| 37f544d7-c35a-4c42-9f97-8cef19945329 | cbecd47f-bc2a-471f-84e6-257517ee6f70 | 11111111-1111-1111-1111-111111111111 | FIDELIX-4A7604E5 | null        | null      | null          | {}            | true   | null         | 2026-01-31 09:41:25.185459+00 | 2026-01-31 09:41:25.185459+00 | Cafenescu   | null        | null         |
| e2c9ffeb-724c-4688-94d2-f9ebdd2a4290 | aae77b84-3e78-4d16-bf50-7063c9497400 | 11111111-1111-1111-1111-111111111111 | FIDELIX-EDEA0A40 | null        | null      | null          | {}            | true   | null         | 2026-01-31 09:41:13.266291+00 | 2026-01-31 09:41:13.266291+00 | Cafenescu   | null        | null         |
| c2131c0c-0cd2-4313-b0fa-99d965512dfa | 5927bb8b-4469-43bb-b7c3-3161d9b81d35 | 11111111-1111-1111-1111-111111111111 | FIDELIX-1DAAD3F6 | null        | null      | null          | {}            | true   | null         | 2026-01-31 01:03:19.957539+00 | 2026-01-31 01:03:19.957539+00 | Cafenescu   | null        | null         |
| 98984e1b-4ab7-4322-8a66-03ec6dab7151 | 2aa02dcc-681f-4206-addc-f607d5e8f129 | 11111111-1111-1111-1111-111111111111 | FIDELIX-BD95C130 | null        | null      | null          | {}            | true   | null         | 2026-01-31 00:14:17.926532+00 | 2026-01-31 00:14:17.926532+00 | Cafenescu   | null        | null         |
| 910f3ec4-cdd3-4306-bac4-8ce849e3044b | 5eeda2d6-7936-413d-aed6-3b05cd13fcac | 22222222-2222-2222-2222-222222222222 | FIDELIX-8A3FC3F1 | null        | null      | null          | {}            | true   | null         | 2026-01-31 00:06:02.096939+00 | 2026-01-31 00:06:02.096939+00 | FitGym      | null        | null         |
| 344a7914-3a7c-43da-abbb-410c521b8374 | 5eeda2d6-7936-413d-aed6-3b05cd13fcac | 11111111-1111-1111-1111-111111111111 | FIDELIX-B7974035 | null        | null      | null          | {}            | true   | null         | 2026-01-30 23:59:35.393352+00 | 2026-01-30 23:59:35.393352+00 | Cafenescu   | null        | null         |
| 9a62dbdc-3895-49da-a296-fc9cac1277fa | 5eeda2d6-7936-413d-aed6-3b05cd13fcac | 33333333-3333-3333-3333-333333333333 | FIDELIX-8684E62F | null        | null      | null          | {}            | true   | null         | 2026-01-30 23:59:30.705027+00 | 2026-01-30 23:59:30.705027+00 | Nail Beauty | null        | null         |
| 0d3464dc-9d47-48b3-86d0-172f320e1b0d | 8f2f71e0-703d-48b0-abdc-276c439d2f57 | 33333333-3333-3333-3333-333333333333 | FIDELIX-BAAD3119 | null        | null      | null          | {}            | true   | null         | 2026-01-30 23:59:30.700411+00 | 2026-01-30 23:59:30.700411+00 | Nail Beauty | null        | null         |

-- 9. SCAN_EVENTS (0 righe)
SELECT * FROM scan_events ORDER BY scanned_at DESC LIMIT 10;
Success. No rows returned
-- 10. REWARD_REDEMPTIONS (0 righe)
SELECT * FROM reward_redemptions ORDER BY redeemed_at DESC LIMIT 10;
Success. No rows returned
-- ============================================================================
-- SUMMARY QUERY - Riepilogo generale
-- ============================================================================
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT s.id) as stores_count,
  COUNT(DISTINCT pc.id) as categories_count,
  COUNT(DISTINCT p.id) as products_count,
  COUNT(DISTINCT rr.id) as reward_rules_count,
  COUNT(DISTINCT c.id) as cards_count,
  COUNT(DISTINCT a.id) as admins_count
FROM tenants t
LEFT JOIN stores s ON t.id = s.tenant_id
LEFT JOIN product_categories pc ON t.id = pc.tenant_id
LEFT JOIN products p ON t.id = p.tenant_id
LEFT JOIN reward_rules rr ON t.id = rr.tenant_id
LEFT JOIN cards c ON t.id = c.tenant_id
LEFT JOIN admins a ON t.id = a.tenant_id
GROUP BY t.name
ORDER BY t.name;
| tenant_name | stores_count | categories_count | products_count | reward_rules_count | cards_count | admins_count |
| ----------- | ------------ | ---------------- | -------------- | ------------------ | ----------- | ------------ |
| Active Fit  | 1            | 1                | 1              | 0                  | 0           | 1            |
| Cafenescu   | 0            | 0                | 0              | 0                  | 17          | 0            |
| FitGym      | 0            | 0                | 0              | 0                  | 8           | 0            |
| Nail Beauty | 0            | 0                | 0              | 0                  | 13          | 0            |
| Nail Salon  | 1            | 1                | 3              | 0                  | 0           | 1            |