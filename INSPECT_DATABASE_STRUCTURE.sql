-- ============================================================================
-- QUERY PER ISPEZIONARE LA STRUTTURA COMPLETA DEL DATABASE
-- Esegui queste query una per una nel SQL Editor di Supabase
-- ============================================================================

-- 1. Lista di TUTTE le tabelle nel database pubblico
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

| table_name         | table_type |
| ------------------ | ---------- |
| admins             | BASE TABLE |
| audit_logs         | BASE TABLE |
| cards              | BASE TABLE |
| clients            | BASE TABLE |
| product_categories | BASE TABLE |
| products           | BASE TABLE |
| reward_redemptions | BASE TABLE |
| reward_rules       | BASE TABLE |
| scan_events        | BASE TABLE |
| stores             | BASE TABLE |
| tenants            | BASE TABLE |

-- 2. Lista di TUTTE le colonne per ogni tabella (più dettagliato)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

| table_name         | column_name            | data_type                | is_nullable | column_default          |
| ------------------ | ---------------------- | ------------------------ | ----------- | ----------------------- |
| admins             | id                     | uuid                     | NO          | uuid_generate_v4()      |
| admins             | tenant_id              | uuid                     | NO          | null                    |
| admins             | user_id                | uuid                     | NO          | null                    |
| admins             | role                   | character varying        | NO          | null                    |
| admins             | store_id               | uuid                     | YES         | null                    |
| admins             | active                 | boolean                  | YES         | true                    |
| admins             | metadata               | jsonb                    | YES         | '{}'::jsonb             |
| admins             | created_at             | timestamp with time zone | YES         | now()                   |
| admins             | updated_at             | timestamp with time zone | YES         | now()                   |
| audit_logs         | id                     | uuid                     | NO          | uuid_generate_v4()      |
| audit_logs         | tenant_id              | uuid                     | YES         | null                    |
| audit_logs         | user_id                | uuid                     | YES         | null                    |
| audit_logs         | action                 | character varying        | NO          | null                    |
| audit_logs         | resource_type          | character varying        | YES         | null                    |
| audit_logs         | resource_id            | uuid                     | YES         | null                    |
| audit_logs         | metadata               | jsonb                    | YES         | '{}'::jsonb             |
| audit_logs         | ip_address             | inet                     | YES         | null                    |
| audit_logs         | user_agent             | text                     | YES         | null                    |
| audit_logs         | created_at             | timestamp with time zone | YES         | now()                   |
| cards              | id                     | uuid                     | NO          | uuid_generate_v4()      |
| cards              | client_id              | uuid                     | NO          | null                    |
| cards              | tenant_id              | uuid                     | NO          | null                    |
| cards              | qr_code                | character varying        | NO          | null                    |
| cards              | wallet_type            | character varying        | YES         | null                    |
| cards              | wallet_id              | character varying        | YES         | null                    |
| cards              | wallet_serial          | character varying        | YES         | null                    |
| cards              | loyalty_state          | jsonb                    | YES         | '{}'::jsonb             |
| cards              | active                 | boolean                  | YES         | true                    |
| cards              | last_scan_at           | timestamp with time zone | YES         | null                    |
| cards              | created_at             | timestamp with time zone | YES         | now()                   |
| cards              | updated_at             | timestamp with time zone | YES         | now()                   |
| clients            | id                     | uuid                     | NO          | uuid_generate_v4()      |
| clients            | email                  | character varying        | YES         | null                    |
| clients            | phone                  | character varying        | YES         | null                    |
| clients            | name                   | character varying        | YES         | null                    |
| clients            | metadata               | jsonb                    | YES         | '{}'::jsonb             |
| clients            | created_at             | timestamp with time zone | YES         | now()                   |
| clients            | updated_at             | timestamp with time zone | YES         | now()                   |
| product_categories | id                     | uuid                     | NO          | uuid_generate_v4()      |
| product_categories | tenant_id              | uuid                     | NO          | null                    |
| product_categories | name                   | character varying        | NO          | null                    |
| product_categories | description            | text                     | YES         | null                    |
| product_categories | icon                   | character varying        | YES         | null                    |
| product_categories | active                 | boolean                  | YES         | true                    |
| product_categories | created_at             | timestamp with time zone | YES         | now()                   |
| product_categories | updated_at             | timestamp with time zone | YES         | now()                   |
| products           | id                     | uuid                     | NO          | uuid_generate_v4()      |
| products           | tenant_id              | uuid                     | NO          | null                    |
| products           | category_id            | uuid                     | YES         | null                    |
| products           | name                   | character varying        | NO          | null                    |
| products           | description            | text                     | YES         | null                    |
| products           | image_url              | text                     | YES         | null                    |
| products           | price                  | numeric                  | YES         | null                    |
| products           | active                 | boolean                  | YES         | true                    |
| products           | metadata               | jsonb                    | YES         | '{}'::jsonb             |
| products           | created_at             | timestamp with time zone | YES         | now()                   |
| products           | updated_at             | timestamp with time zone | YES         | now()                   |
| reward_redemptions | id                     | uuid                     | NO          | uuid_generate_v4()      |
| reward_redemptions | tenant_id              | uuid                     | NO          | null                    |
| reward_redemptions | client_id              | uuid                     | NO          | null                    |
| reward_redemptions | card_id                | uuid                     | NO          | null                    |
| reward_redemptions | admin_id               | uuid                     | NO          | null                    |
| reward_redemptions | reward_rule_id         | uuid                     | NO          | null                    |
| reward_redemptions | product_id             | uuid                     | YES         | null                    |
| reward_redemptions | quantity               | integer                  | YES         | 1                       |
| reward_redemptions | redeemed_at            | timestamp with time zone | YES         | now()                   |
| reward_rules       | id                     | uuid                     | NO          | uuid_generate_v4()      |
| reward_rules       | tenant_id              | uuid                     | NO          | null                    |
| reward_rules       | name                   | character varying        | NO          | null                    |
| reward_rules       | description            | text                     | YES         | null                    |
| reward_rules       | product_id             | uuid                     | YES         | null                    |
| reward_rules       | category_id            | uuid                     | YES         | null                    |
| reward_rules       | buy_count              | integer                  | NO          | null                    |
| reward_rules       | reward_count           | integer                  | NO          | 1                       |
| reward_rules       | reward_product_id      | uuid                     | YES         | null                    |
| reward_rules       | reward_category_id     | uuid                     | YES         | null                    |
| reward_rules       | active                 | boolean                  | YES         | true                    |
| reward_rules       | priority               | integer                  | YES         | 0                       |
| reward_rules       | created_at             | timestamp with time zone | YES         | now()                   |
| reward_rules       | updated_at             | timestamp with time zone | YES         | now()                   |
| scan_events        | id                     | uuid                     | NO          | uuid_generate_v4()      |
| scan_events        | tenant_id              | uuid                     | NO          | null                    |
| scan_events        | client_id              | uuid                     | NO          | null                    |
| scan_events        | admin_id               | uuid                     | NO          | null                    |
| scan_events        | product_id             | uuid                     | NO          | null                    |
| scan_events        | store_id               | uuid                     | YES         | null                    |
| scan_events        | card_id                | uuid                     | NO          | null                    |
| scan_events        | scan_method            | character varying        | YES         | 'qr'::character varying |
| scan_events        | device_info            | jsonb                    | YES         | null                    |
| scan_events        | loyalty_state_snapshot | jsonb                    | YES         | null                    |
| scan_events        | reward_applied         | boolean                  | YES         | false                   |
| scan_events        | reward_rule_id         | uuid                     | YES         | null                    |
| scan_events        | scanned_at             | timestamp with time zone | YES         | now()                   |
| stores             | id                     | uuid                     | NO          | uuid_generate_v4()      |
| stores             | tenant_id              | uuid                     | NO          | null                    |
| stores             | name                   | character varying        | NO          | null                    |
| stores             | address                | text                     | YES         | null                    |
| stores             | city                   | character varying        | YES         | null                    |
| stores             | postal_code            | character varying        | YES         | null                    |
| stores             | active                 | boolean                  | YES         | true                    |

-- 3. Lista delle FOREIGN KEYS (relazioni tra tabelle)
SELECT
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

| from_table         | from_column        | to_table           | to_column | constraint_name                        |
| ------------------ | ------------------ | ------------------ | --------- | -------------------------------------- |
| admins             | tenant_id          | tenants            | id        | admins_tenant_id_fkey                  |
| admins             | store_id           | stores             | id        | admins_store_id_fkey                   |
| audit_logs         | tenant_id          | tenants            | id        | audit_logs_tenant_id_fkey              |
| cards              | tenant_id          | tenants            | id        | cards_tenant_id_fkey                   |
| cards              | client_id          | clients            | id        | cards_client_id_fkey                   |
| product_categories | tenant_id          | tenants            | id        | product_categories_tenant_id_fkey      |
| products           | tenant_id          | tenants            | id        | products_tenant_id_fkey                |
| products           | category_id        | product_categories | id        | products_category_id_fkey              |
| reward_redemptions | client_id          | clients            | id        | reward_redemptions_client_id_fkey      |
| reward_redemptions | card_id            | cards              | id        | reward_redemptions_card_id_fkey        |
| reward_redemptions | admin_id           | admins             | id        | reward_redemptions_admin_id_fkey       |
| reward_redemptions | tenant_id          | tenants            | id        | reward_redemptions_tenant_id_fkey      |
| reward_redemptions | product_id         | products           | id        | reward_redemptions_product_id_fkey     |
| reward_redemptions | reward_rule_id     | reward_rules       | id        | reward_redemptions_reward_rule_id_fkey |
| reward_rules       | reward_product_id  | products           | id        | reward_rules_reward_product_id_fkey    |
| reward_rules       | product_id         | products           | id        | reward_rules_product_id_fkey           |
| reward_rules       | category_id        | product_categories | id        | reward_rules_category_id_fkey          |
| reward_rules       | tenant_id          | tenants            | id        | reward_rules_tenant_id_fkey            |
| reward_rules       | reward_category_id | product_categories | id        | reward_rules_reward_category_id_fkey   |
| scan_events        | tenant_id          | tenants            | id        | scan_events_tenant_id_fkey             |
| scan_events        | client_id          | clients            | id        | scan_events_client_id_fkey             |
| scan_events        | admin_id           | admins             | id        | scan_events_admin_id_fkey              |
| scan_events        | product_id         | products           | id        | scan_events_product_id_fkey            |
| scan_events        | store_id           | stores             | id        | scan_events_store_id_fkey              |
| scan_events        | card_id            | cards              | id        | scan_events_card_id_fkey               |
| scan_events        | reward_rule_id     | reward_rules       | id        | scan_events_reward_rule_id_fkey        |
| stores             | tenant_id          | tenants            | id        | stores_tenant_id_fkey                  |

-- 4. Conta RIGHE per ogni tabella
SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', 
    xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    schemaname, 
    tablename,
    query_to_xml(
      format('SELECT count(*) AS cnt FROM %I.%I', schemaname, tablename),
      false, true, ''
    ) AS xml_count
  FROM pg_tables
  WHERE schemaname = 'public'
) t
ORDER BY tablename;

| schemaname | tablename          | row_count |
| ---------- | ------------------ | --------- |
| public     | admins             | 2         |
| public     | audit_logs         | 0         |
| public     | cards              | 38        |
| public     | clients            | 42        |
| public     | product_categories | 2         |
| public     | products           | 4         |
| public     | reward_redemptions | 0         |
| public     | reward_rules       | 0         |
| public     | scan_events        | 0         |
| public     | stores             | 2         |
| public     | tenants            | 5         |

-- ============================================================================
-- ESEGUI PRIMA LE QUERY 1-4 SOPRA PER VEDERE QUALI TABELLE ESISTONO!
-- POI DECOMMENTARE E ESEGUIRE SOLO LE QUERY PER LE TABELLE CHE ESISTONO
-- ============================================================================

-- 5. TENANTS esistenti (se esiste la tabella)
-- SELECT * FROM tenants ORDER BY name;

-- 6. ADMINS esistenti (se esiste la tabella)
-- SELECT 
--   a.*,
--   t.name as tenant_name
-- FROM admins a
-- LEFT JOIN tenants t ON a.tenant_id = t.id;

-- 7. STORES esistenti (se esiste la tabella)
-- SELECT 
--   s.*,
--   t.name as tenant_name
-- FROM stores s
-- LEFT JOIN tenants t ON s.tenant_id = t.id;

-- 8. PRODUCTS esistenti (se esiste la tabella)
-- SELECT 
--   p.*,
--   t.name as tenant_name
-- FROM products p
-- LEFT JOIN tenants t ON p.tenant_id = t.id
-- ORDER BY t.name, p.price DESC;

-- 9. REWARD_RULES esistenti (se esiste la tabella)
-- SELECT 
--   rr.*,
--   t.name as tenant_name
-- FROM reward_rules rr
-- LEFT JOIN tenants t ON rr.tenant_id = t.id;

-- 10. CARDS esistenti (se esiste la tabella)
-- SELECT * FROM cards LIMIT 10;

-- 11. SCAN_EVENTS esistenti (se esiste la tabella)
-- SELECT * FROM scan_events ORDER BY scanned_at DESC LIMIT 10;

-- 12. REDEMPTIONS esistenti (se esiste la tabella)
-- SELECT * FROM redemptions ORDER BY redeemed_at DESC LIMIT 10;
