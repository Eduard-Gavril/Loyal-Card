-- Self-service deletion of a business (tenant) with a 14 day grace period.
--
-- Flow
--   1. The owner calls request_tenant_deletion(<typed business name>). The tenant keeps working but is marked
--      "being deleted" (deletion_requested_at / deletion_scheduled_at = now() + 14 days).
--   2. Until the deadline the owner can call cancel_tenant_deletion().
--   3. A daily pg_cron job runs purge_tenants_due(): it deletes the tenant (stores, rewards, cards, scans, ...
--      go with it through ON DELETE CASCADE) and the login accounts (auth.users) of its owner and staff.
--      Customer accounts (clients) are never touched, they only lose the cards of that business.
--
-- Owners could previously delete their own tenant row straight through the API (policy owners_manage_own_tenant is
-- FOR ALL), which would skip the grace period, so direct DELETEs and direct edits of the deletion columns are blocked
-- unless they come from the functions below (or from a super admin / the service role).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

-- true when the current statement is allowed to touch the deletion state
CREATE OR REPLACE FUNCTION public.tenant_deletion_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NULL
      OR public.is_super_admin_caller()
      OR coalesce(current_setting('app.tenant_deletion', true), '') = '1'
$$;

CREATE OR REPLACE FUNCTION public.protect_tenant_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT public.tenant_deletion_allowed() THEN
      RAISE EXCEPTION 'DELETION_PROTECTED: use request_tenant_deletion() to delete a business' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF (NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at
      OR NEW.deletion_scheduled_at IS DISTINCT FROM OLD.deletion_scheduled_at)
     AND NOT public.tenant_deletion_allowed() THEN
    RAISE EXCEPTION 'DELETION_PROTECTED: use request_tenant_deletion() / cancel_tenant_deletion()' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_tenant_deletion_upd ON public.tenants;
CREATE TRIGGER protect_tenant_deletion_upd
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.protect_tenant_deletion();

DROP TRIGGER IF EXISTS protect_tenant_deletion_del ON public.tenants;
CREATE TRIGGER protect_tenant_deletion_del
  BEFORE DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.protect_tenant_deletion();

-- The tenant of the calling owner (null if the caller is not an active owner)
CREATE OR REPLACE FUNCTION public.current_owner_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.tenant_id FROM public.admins a
  WHERE a.user_id = auth.uid() AND a.role = 'owner' AND a.active = true
  LIMIT 1
$$;

-- Owner only. p_confirm_name must be the business name, typed by the owner.
CREATE OR REPLACE FUNCTION public.request_tenant_deletion(p_confirm_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := public.current_owner_tenant();
  v_name text;
  v_when timestamptz := now() + interval '14 days';
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'NOT_OWNER: only the owner can delete the business' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_name FROM public.tenants WHERE id = v_tenant;
  IF lower(btrim(coalesce(p_confirm_name, ''))) <> lower(btrim(v_name)) THEN
    RAISE EXCEPTION 'NAME_MISMATCH: the typed name does not match the business name' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.tenant_deletion', '1', true);
  UPDATE public.tenants
     SET deletion_requested_at = coalesce(deletion_requested_at, now()),
         deletion_scheduled_at = coalesce(deletion_scheduled_at, v_when)
   WHERE id = v_tenant
   RETURNING deletion_scheduled_at INTO v_when;

  RETURN jsonb_build_object('scheduled_at', v_when);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_tenant_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := public.current_owner_tenant();
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'NOT_OWNER: only the owner can cancel the deletion' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.tenant_deletion', '1', true);
  UPDATE public.tenants
     SET deletion_requested_at = NULL, deletion_scheduled_at = NULL
   WHERE id = v_tenant;

  RETURN jsonb_build_object('cancelled', true);
END $$;

-- Daily job (service role / pg_cron): really deletes the tenants whose grace period is over.
CREATE OR REPLACE FUNCTION public.purge_tenants_due()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t record;
  v_users uuid[];
  n_tenants integer := 0;
  n_users integer := 0;
  c integer;
BEGIN
  PERFORM set_config('app.tenant_deletion', '1', true);

  FOR t IN
    SELECT id FROM public.tenants
    WHERE deletion_scheduled_at IS NOT NULL AND deletion_scheduled_at <= now()
  LOOP
    -- login accounts of the owner and staff, unless the same login also works for another business
    SELECT coalesce(array_agg(DISTINCT a.user_id), '{}') INTO v_users
    FROM public.admins a
    WHERE a.tenant_id = t.id
      AND a.role IN ('owner', 'staff')
      AND NOT EXISTS (
        SELECT 1 FROM public.admins o
        WHERE o.user_id = a.user_id AND (o.tenant_id IS DISTINCT FROM t.id)
      );

    DELETE FROM public.tenants WHERE id = t.id;
    n_tenants := n_tenants + 1;

    DELETE FROM auth.users WHERE id = ANY (v_users);
    GET DIAGNOSTICS c = ROW_COUNT;
    n_users := n_users + c;
  END LOOP;

  RETURN jsonb_build_object('deleted_tenants', n_tenants, 'deleted_logins', n_users, 'ran_at', now());
END $$;

REVOKE ALL ON FUNCTION public.tenant_deletion_allowed() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_owner_tenant() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_tenant_deletion(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_tenant_deletion() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_tenants_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_deletion_allowed() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_owner_tenant() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_tenant_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_tenant_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_tenants_due() TO service_role;

-- pg_cron is already enabled on this project: run the purge every day at 03:10 UTC.
DO $$
BEGIN
  PERFORM cron.unschedule('purge-tenants-due')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-tenants-due');
  PERFORM cron.schedule('purge-tenants-due', '10 3 * * *', 'select public.purge_tenants_due()');
END $$;
