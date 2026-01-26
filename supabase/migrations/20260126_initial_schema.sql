-- Fidelix Database Schema
-- PostgreSQL + Supabase
-- Multi-tenant loyalty platform

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS (Root entity)
-- ============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#000000',
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(active);

-- ============================================================================
-- STORES (Optional - Multi-location support)
-- ============================================================================

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_tenant ON stores(tenant_id);
CREATE INDEX idx_stores_active ON stores(tenant_id, active);

-- ============================================================================
-- ADMINS (Staff users)
-- ============================================================================

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff')),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_admins_tenant ON admins(tenant_id);
CREATE INDEX idx_admins_user ON admins(user_id);
CREATE INDEX idx_admins_role ON admins(tenant_id, role);

-- ============================================================================
-- CLIENTS (Anonymous customers - GLOBAL)
-- ============================================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;

-- ============================================================================
-- PRODUCT CATEGORIES
-- ============================================================================

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_tenant ON product_categories(tenant_id);
CREATE INDEX idx_categories_active ON product_categories(tenant_id, active);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(tenant_id, active);

-- ============================================================================
-- REWARD RULES (Configurable loyalty logic)
-- ============================================================================

CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Target: product OR category (one must be set)
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  
  -- Logic: buy X get Y
  buy_count INTEGER NOT NULL CHECK (buy_count > 0),
  reward_count INTEGER NOT NULL DEFAULT 1,
  
  -- Reward: same product/category or different
  reward_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  reward_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: must have product OR category
  CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE INDEX idx_reward_rules_tenant ON reward_rules(tenant_id);
CREATE INDEX idx_reward_rules_product ON reward_rules(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_reward_rules_category ON reward_rules(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_reward_rules_active ON reward_rules(tenant_id, active);

-- ============================================================================
-- CARDS (Loyalty cards - client × tenant)
-- ============================================================================

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- QR code identifier
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  
  -- Wallet integration
  wallet_type VARCHAR(20) CHECK (wallet_type IN ('apple', 'google')),
  wallet_id VARCHAR(255),
  wallet_serial VARCHAR(255),
  
  -- Loyalty state (JSONB for flexibility)
  -- Format: {"rule_uuid": {"count": 3, "rewards": 1}}
  loyalty_state JSONB DEFAULT '{}',
  
  active BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, tenant_id)
);

CREATE INDEX idx_cards_client ON cards(client_id);
CREATE INDEX idx_cards_tenant ON cards(tenant_id);
CREATE INDEX idx_cards_qr ON cards(qr_code);
CREATE INDEX idx_cards_wallet ON cards(wallet_type, wallet_id) WHERE wallet_id IS NOT NULL;
CREATE INDEX idx_cards_active ON cards(tenant_id, active);

-- ============================================================================
-- SCAN EVENTS (Immutable event log - source of truth)
-- ============================================================================

CREATE TABLE scan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  
  -- Event metadata
  scan_method VARCHAR(20) DEFAULT 'qr' CHECK (scan_method IN ('qr', 'manual', 'api')),
  device_info JSONB,
  
  -- Loyalty state after this scan
  loyalty_state_snapshot JSONB,
  reward_applied BOOLEAN DEFAULT false,
  reward_rule_id UUID REFERENCES reward_rules(id) ON DELETE SET NULL,
  
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scan_events_tenant ON scan_events(tenant_id, scanned_at DESC);
CREATE INDEX idx_scan_events_client ON scan_events(client_id, scanned_at DESC);
CREATE INDEX idx_scan_events_admin ON scan_events(admin_id, scanned_at DESC);
CREATE INDEX idx_scan_events_product ON scan_events(product_id, scanned_at DESC);
CREATE INDEX idx_scan_events_card ON scan_events(card_id, scanned_at DESC);

-- ============================================================================
-- REWARD REDEMPTIONS (When rewards are used)
-- ============================================================================

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  reward_rule_id UUID NOT NULL REFERENCES reward_rules(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  quantity INTEGER DEFAULT 1,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_redemptions_tenant ON reward_redemptions(tenant_id, redeemed_at DESC);
CREATE INDEX idx_redemptions_client ON reward_redemptions(client_id, redeemed_at DESC);
CREATE INDEX idx_redemptions_card ON reward_redemptions(card_id, redeemed_at DESC);

-- ============================================================================
-- AUDIT LOG (Security & compliance)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_rules_updated_at BEFORE UPDATE ON reward_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CRITICAL FOR MULTI-TENANT
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get tenant_id for current user
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM admins WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- TENANTS: Owner can manage their own tenant
CREATE POLICY "owners_manage_own_tenant" ON tenants
  FOR ALL TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM admins 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- STORES: Admin can manage stores in their tenant
CREATE POLICY "admins_manage_tenant_stores" ON stores
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- ADMINS: Owner can manage admins in their tenant
CREATE POLICY "owners_manage_tenant_admins" ON admins
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM admins 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- PRODUCTS: Admin can manage products in their tenant
CREATE POLICY "admins_manage_tenant_products" ON products
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- PRODUCT CATEGORIES: Admin can manage categories in their tenant
CREATE POLICY "admins_manage_tenant_categories" ON product_categories
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- REWARD RULES: Admin can manage rules in their tenant
CREATE POLICY "admins_manage_tenant_rules" ON reward_rules
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- CARDS: Admin can view/manage cards in their tenant
CREATE POLICY "admins_manage_tenant_cards" ON cards
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- SCAN EVENTS: Admin can view events in their tenant, insert via function only
CREATE POLICY "admins_view_tenant_scan_events" ON scan_events
  FOR SELECT TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

CREATE POLICY "service_role_insert_scan_events" ON scan_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- REWARD REDEMPTIONS: Admin can view/insert in their tenant
CREATE POLICY "admins_manage_tenant_redemptions" ON reward_redemptions
  FOR ALL TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- AUDIT LOGS: Admin can view their tenant logs
CREATE POLICY "admins_view_tenant_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = auth.get_user_tenant_id());

-- CLIENTS: Public read for client data (needed for anonymous flow)
-- Actual security is in card QR validation
CREATE POLICY "public_read_clients" ON clients
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "service_role_manage_clients" ON clients
  FOR ALL TO service_role
  WITH CHECK (true);

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Create demo tenant
-- INSERT INTO tenants (name, slug, brand_color) 
-- VALUES ('Demo Coffee Shop', 'demo-coffee', '#8B4513');

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. All queries MUST filter by tenant_id (enforced by RLS)
-- 2. scan_events is append-only (no UPDATE/DELETE policies)
-- 3. client_id is global (cross-tenant possible in future)
-- 4. QR code validation happens in Edge Functions
-- 5. loyalty_state in cards is JSONB for flexibility
-- 6. Use service_role for Edge Functions (bypass RLS when needed)
