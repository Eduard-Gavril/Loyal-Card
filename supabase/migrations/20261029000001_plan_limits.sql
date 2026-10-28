-- Subscription plans and their limits.
--
-- * tenants gets plan / plan_status / plan_expires_at (existing tenants are set to enterprise, so nothing changes for them).
-- * plan_limits holds the numbers per plan in ONE place (NULL = unlimited).
-- * Limits are enforced here, in the database, so they hold for every client (web, mobile, direct API calls):
--     stores, active reward rules, staff accounts       -> BEFORE INSERT/UPDATE triggers
--     active clients per month                          -> can_scan_client(), called by the register-scan function
-- * Existing data over a limit is never deleted: limits only block creating/activating MORE.
-- * Only a super_admin (or the service role) can change a tenant's plan; owners can edit their tenant but not its plan.

-- ---------------------------------------------------------------- columns
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('starter', 'business', 'pro', 'enterprise'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_status_check CHECK (plan_status IN ('active', 'past_due', 'canceled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.tenants.plan IS 'Subscription plan: starter | business | pro | enterprise. Limits live in plan_limits.';
COMMENT ON COLUMN public.tenants.plan_status IS 'active | past_due | canceled. Anything other than active is treated as starter.';
COMMENT ON COLUMN public.tenants.plan_expires_at IS 'After this moment the tenant is treated as starter. NULL = never expires.';

-- ---------------------------------------------------------------- limits table
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan text PRIMARY KEY CHECK (plan IN ('starter', 'business', 'pro', 'enterprise')),
  max_stores integer,
  max_active_clients integer,
  max_rules integer,
  max_staff integer,
  can_export boolean NOT NULL DEFAULT false,
  can_white_label boolean NOT NULL DEFAULT false,
  can_multi_level boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public.plan_limits IS 'Numbers per plan. NULL in a max_* column = unlimited.';

INSERT INTO public.plan_limits (plan, max_stores, max_active_clients, max_rules, max_staff, can_export, can_white_label, can_multi_level) VALUES
  ('starter',    1,    50,   1,    0,    false, false, false),
  ('business',   2,    100,  NULL, 2,    true,  true,  false),
  ('pro',        3,    250,  NULL, 5,    true,  true,  true),
  ('enterprise', NULL, NULL, NULL, NULL, true,  true,  true)
ON CONFLICT (plan) DO NOTHING;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_limits_read ON public.plan_limits;
CREATE POLICY plan_limits_read ON public.plan_limits FOR SELECT TO anon, authenticated USING (true);
-- no write policies: only the service role / migrations can change the numbers

-- Everybody who exists today keeps full access.
UPDATE public.tenants SET plan = 'enterprise';

-- ---------------------------------------------------------------- helpers
-- The plan whose limits apply right now (expired / unpaid tenants fall back to starter).
CREATE OR REPLACE FUNCTION public.effective_plan(p_tenant uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN t.plan_status <> 'active' THEN 'starter'
    WHEN t.plan_expires_at IS NOT NULL AND t.plan_expires_at < now() THEN 'starter'
    ELSE t.plan
  END
  FROM public.tenants t WHERE t.id = p_tenant;
$$;

CREATE OR REPLACE FUNCTION public.tenant_limits(p_tenant uuid)
RETURNS public.plan_limits
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT l.* FROM public.plan_limits l WHERE l.plan = COALESCE(public.effective_plan(p_tenant), 'starter');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_caller()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.active = true
  );
$$;

-- Clients with at least one scan in the last 30 days.
CREATE OR REPLACE FUNCTION public.active_clients_30d(p_tenant uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(DISTINCT client_id)::integer FROM public.scan_events
  WHERE tenant_id = p_tenant AND scanned_at > now() - interval '30 days';
$$;

-- ---------------------------------------------------------------- protect the plan columns
CREATE OR REPLACE FUNCTION public.protect_tenant_plan()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_status IS DISTINCT FROM OLD.plan_status
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
    -- service role / SQL editor / migrations have no end-user (auth.uid() is null); end users must be super admins
    IF auth.uid() IS NOT NULL AND NOT public.is_super_admin_caller() THEN
      RAISE EXCEPTION 'PLAN_PROTECTED: only a super admin can change the subscription plan' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_tenant_plan ON public.tenants;
CREATE TRIGGER protect_tenant_plan BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.protect_tenant_plan();

-- ---------------------------------------------------------------- enforcement triggers
CREATE OR REPLACE FUNCTION public.limit_error(p_what text, p_max integer, p_tenant uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'PLAN_LIMIT: your % plan allows % %. Upgrade the plan to add more.',
    initcap(COALESCE(public.effective_plan(p_tenant), 'starter')), p_max, p_what
    USING ERRCODE = 'P0001';
END $$;

-- Stores
CREATE OR REPLACE FUNCTION public.enforce_store_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lim public.plan_limits;
BEGIN
  IF NEW.active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.active IS TRUE THEN RETURN NEW; END IF; -- already counted
  lim := public.tenant_limits(NEW.tenant_id);
  IF lim.max_stores IS NOT NULL AND
     (SELECT count(*) FROM public.stores WHERE tenant_id = NEW.tenant_id AND active IS TRUE AND id <> NEW.id) >= lim.max_stores THEN
    PERFORM public.limit_error('location(s)', lim.max_stores, NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_store_limit ON public.stores;
CREATE TRIGGER enforce_store_limit BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_store_limit();

-- Reward rules: number of active rules, and multi-level rewards (rules that do not reset on redeem)
CREATE OR REPLACE FUNCTION public.enforce_rule_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lim public.plan_limits;
BEGIN
  lim := public.tenant_limits(NEW.tenant_id);

  IF NEW.active IS TRUE AND NOT (TG_OP = 'UPDATE' AND OLD.active IS TRUE)
     AND lim.max_rules IS NOT NULL
     AND (SELECT count(*) FROM public.reward_rules WHERE tenant_id = NEW.tenant_id AND active IS TRUE AND id <> NEW.id) >= lim.max_rules THEN
    PERFORM public.limit_error('active loyalty rule(s)', lim.max_rules, NEW.tenant_id);
  END IF;

  IF NOT lim.can_multi_level AND NEW.reset_on_redeem IS FALSE
     AND NOT (TG_OP = 'UPDATE' AND OLD.reset_on_redeem IS FALSE) THEN
    RAISE EXCEPTION 'PLAN_FEATURE: multi-level rewards are not included in your % plan. Upgrade the plan to use them.',
      initcap(COALESCE(public.effective_plan(NEW.tenant_id), 'starter')) USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_rule_limit ON public.reward_rules;
CREATE TRIGGER enforce_rule_limit BEFORE INSERT OR UPDATE ON public.reward_rules
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rule_limit();

-- Staff accounts (admins with role 'staff')
CREATE OR REPLACE FUNCTION public.enforce_staff_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lim public.plan_limits;
BEGIN
  IF NEW.role <> 'staff' OR NEW.active IS NOT TRUE OR NEW.tenant_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'staff' AND OLD.active IS TRUE THEN RETURN NEW; END IF;
  lim := public.tenant_limits(NEW.tenant_id);
  IF lim.max_staff IS NOT NULL AND
     (SELECT count(*) FROM public.admins WHERE tenant_id = NEW.tenant_id AND role = 'staff' AND active IS TRUE AND id <> NEW.id) >= lim.max_staff THEN
    PERFORM public.limit_error('staff account(s)', lim.max_staff, NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_staff_limit ON public.admins;
CREATE TRIGGER enforce_staff_limit BEFORE INSERT OR UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_limit();

-- ---------------------------------------------------------------- active clients per month
-- Called by register-scan before stamping. A client that already scanned in the last 30 days is always allowed;
-- a client that would become a NEW active client is refused once the plan's number is reached.
CREATE OR REPLACE FUNCTION public.can_scan_client(p_tenant uuid, p_client uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  lim public.plan_limits;
  active_now integer;
  already boolean;
BEGIN
  lim := public.tenant_limits(p_tenant);
  IF lim.max_active_clients IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'limit', NULL);
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.scan_events WHERE tenant_id = p_tenant AND client_id = p_client AND scanned_at > now() - interval '30 days') INTO already;
  active_now := public.active_clients_30d(p_tenant);
  RETURN jsonb_build_object(
    'allowed', already OR active_now < lim.max_active_clients,
    'limit', lim.max_active_clients,
    'active', active_now,
    'plan', public.effective_plan(p_tenant)
  );
END $$;
REVOKE ALL ON FUNCTION public.can_scan_client(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_scan_client(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------- usage for the admin UI
CREATE OR REPLACE FUNCTION public.get_plan_usage(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  lim public.plan_limits;
  t public.tenants;
BEGIN
  IF NOT (
    public.is_super_admin_caller() OR EXISTS (
      SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid() AND a.tenant_id = p_tenant AND a.active = true
    )
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO t FROM public.tenants WHERE id = p_tenant;
  lim := public.tenant_limits(p_tenant);
  RETURN jsonb_build_object(
    'plan', t.plan,
    'effective_plan', public.effective_plan(p_tenant),
    'plan_status', t.plan_status,
    'plan_expires_at', t.plan_expires_at,
    'limits', jsonb_build_object(
      'stores', lim.max_stores, 'active_clients', lim.max_active_clients, 'rules', lim.max_rules, 'staff', lim.max_staff,
      'can_export', lim.can_export, 'can_white_label', lim.can_white_label, 'can_multi_level', lim.can_multi_level
    ),
    'usage', jsonb_build_object(
      'stores', (SELECT count(*) FROM public.stores WHERE tenant_id = p_tenant AND active IS TRUE),
      'active_clients', public.active_clients_30d(p_tenant),
      'rules', (SELECT count(*) FROM public.reward_rules WHERE tenant_id = p_tenant AND active IS TRUE),
      'staff', (SELECT count(*) FROM public.admins WHERE tenant_id = p_tenant AND role = 'staff' AND active IS TRUE)
    )
  );
END $$;
REVOKE ALL ON FUNCTION public.get_plan_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_usage(uuid) TO authenticated;
