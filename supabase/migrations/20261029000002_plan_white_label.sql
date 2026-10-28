-- White-label: only plans with can_white_label may set their own logo.
-- NULL and '' count as the same "no logo", so saving the settings form without touching the logo is never refused.
CREATE OR REPLACE FUNCTION public.enforce_white_label()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lim public.plan_limits;
BEGIN
  IF COALESCE(NULLIF(NEW.logo_url, ''), '') IS NOT DISTINCT FROM COALESCE(NULLIF(OLD.logo_url, ''), '') THEN
    RETURN NEW;
  END IF;
  -- service role / SQL editor / migrations (no end user) and super admins may always set it
  IF auth.uid() IS NULL OR public.is_super_admin_caller() THEN
    RETURN NEW;
  END IF;
  lim := public.tenant_limits(NEW.id);
  IF NOT lim.can_white_label THEN
    RAISE EXCEPTION 'PLAN_FEATURE: your own logo (white-label) is not included in your % plan. Upgrade the plan to use it.',
      initcap(COALESCE(public.effective_plan(NEW.id), 'starter')) USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_white_label ON public.tenants;
CREATE TRIGGER enforce_white_label BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_white_label();
