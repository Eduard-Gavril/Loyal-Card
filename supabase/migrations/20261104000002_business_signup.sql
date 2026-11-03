-- Self-service business signup with manual approval.
--
-- Flow
--   1. /register calls supabase.auth.signUp with the business name / slug in the user metadata (email confirmation required).
--   2. After the owner confirms the email and logs in, the app calls complete_business_signup(): it creates the tenant
--      HIDDEN (active = false, approval_status = 'pending', plan starter), the owner row and a first store.
--      The owner can configure everything but the business is not visible to customers.
--   3. The super admin sees the request in the "Notifiche" section (list_pending_signups) and
--        approve_tenant()  -> the tenant becomes visible (active = true, approval_status = 'approved'), plan stays starter
--        reject_tenant()   -> everything is deleted as if the signup never happened (tenant + owner login)
--   4. A pending request that is not handled within 30 days is deleted by purge_stale_signups() (daily, pg_cron).
--      Auth users that never confirmed their email within 7 days are removed too.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS signup_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_approval_status_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_approval_status_check CHECK (approval_status IN ('pending', 'approved'));

-- Owners cannot approve themselves: approval fields and "pending -> visible" are reserved to the super admin / service role / our functions.
CREATE OR REPLACE FUNCTION public.protect_tenant_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin_caller()
     OR coalesce(current_setting('app.tenant_signup', true), '') = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.signup_requested_at IS DISTINCT FROM OLD.signup_requested_at
     OR NEW.terms_accepted_at IS DISTINCT FROM OLD.terms_accepted_at
     OR NEW.terms_version IS DISTINCT FROM OLD.terms_version
     OR (OLD.approval_status = 'pending' AND NEW.active IS DISTINCT FROM OLD.active) THEN
    RAISE EXCEPTION 'APPROVAL_PROTECTED: only a super admin can approve a business' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_tenant_approval ON public.tenants;
CREATE TRIGGER protect_tenant_approval
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.protect_tenant_approval();

-- ---------------------------------------------------------------------------------------------------------------
-- Slug rules: 3-40 chars, lowercase letters / digits / single hyphens, not reserved.
CREATE OR REPLACE FUNCTION public.slug_is_valid(p_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_slug IS NOT NULL
     AND length(p_slug) BETWEEN 3 AND 40
     AND p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     AND p_slug <> ALL (ARRAY[
       'admin','administrator','super-admin','superadmin','api','www','app','apps','login','logout','register','signup',
       'sign-up','signin','dashboard','settings','support','help','contact','contacts','privacy','terms','cookie','cookies',
       'refund','legal','pricing','blog','docs','status','mail','email','static','assets','public','card','cards','wallet',
       'scan','scanner','recovery','partners','partner','demo','test','null','undefined','loyalcard','loyal-card','home',
       'it','ro','en','business-terms','sitemap','robots'
     ])
$$;

-- Live check used by the signup form (anon allowed: slugs are public anyway).
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'valid', public.slug_is_valid(p_slug),
    'available', public.slug_is_valid(p_slug) AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = p_slug)
  )
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Called by the new owner after confirming the email. Business data comes from the signUp metadata.
CREATE OR REPLACE FUNCTION public.complete_business_signup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_user auth.users%ROWTYPE;
  v_name text;
  v_slug text;
  v_terms text;
  v_tenant uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_uid;
  IF v_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'EMAIL_NOT_CONFIRMED: confirm your email first' USING ERRCODE = '42501';
  END IF;

  -- idempotent: a second call just returns the tenant that already exists
  SELECT tenant_id INTO v_tenant FROM public.admins WHERE user_id = v_uid AND role = 'owner' LIMIT 1;
  IF v_tenant IS NOT NULL THEN
    RETURN jsonb_build_object('tenant_id', v_tenant, 'created', false);
  END IF;

  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'ALREADY_ADMIN' USING ERRCODE = '42501';
  END IF;

  v_name  := btrim(coalesce(v_user.raw_user_meta_data ->> 'business_name', ''));
  v_slug  := lower(btrim(coalesce(v_user.raw_user_meta_data ->> 'business_slug', '')));
  v_terms := v_user.raw_user_meta_data ->> 'terms_version';

  IF length(v_name) < 2 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'INVALID_NAME' USING ERRCODE = '22023';
  END IF;
  IF NOT public.slug_is_valid(v_slug) THEN
    RAISE EXCEPTION 'INVALID_SLUG' USING ERRCODE = '22023';
  END IF;
  IF coalesce(v_user.raw_user_meta_data ->> 'terms_accepted', '') <> 'true' OR v_terms IS NULL THEN
    RAISE EXCEPTION 'TERMS_NOT_ACCEPTED' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.tenant_signup', '1', true);

  BEGIN
    INSERT INTO public.tenants (name, slug, active, approval_status, signup_requested_at, terms_accepted_at, terms_version)
    VALUES (v_name, v_slug, false, 'pending', now(), now(), v_terms)
    RETURNING id INTO v_tenant;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'SLUG_TAKEN' USING ERRCODE = '23505';
  END;

  INSERT INTO public.admins (tenant_id, user_id, role) VALUES (v_tenant, v_uid, 'owner');
  INSERT INTO public.stores (tenant_id, name) VALUES (v_tenant, v_name);

  RETURN jsonb_build_object('tenant_id', v_tenant, 'created', true);
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- Super admin: the "Notifiche" list
CREATE OR REPLACE FUNCTION public.list_pending_signups()
RETURNS TABLE (tenant_id uuid, name text, slug text, owner_email text, requested_at timestamptz, terms_version text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin_caller() THEN
    RAISE EXCEPTION 'NOT_SUPER_ADMIN' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT t.id, t.name::text, t.slug::text,
         (SELECT u.email::text FROM public.admins a JOIN auth.users u ON u.id = a.user_id
           WHERE a.tenant_id = t.id AND a.role = 'owner' LIMIT 1),
         coalesce(t.signup_requested_at, t.created_at), t.terms_version
  FROM public.tenants t
  WHERE t.approval_status = 'pending'
  ORDER BY coalesce(t.signup_requested_at, t.created_at) DESC;
END $$;

CREATE OR REPLACE FUNCTION public.approve_tenant(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin_caller() THEN
    RAISE EXCEPTION 'NOT_SUPER_ADMIN' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.tenant_signup', '1', true);
  UPDATE public.tenants
     SET approval_status = 'approved', active = true
   WHERE id = p_tenant AND approval_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_PENDING' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('approved', p_tenant);
END $$;

-- Deletes a tenant and the login accounts of its owner / staff (unless a login also belongs to another business).
CREATE OR REPLACE FUNCTION public.delete_tenant_and_logins(p_tenant uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users uuid[];
  c integer;
BEGIN
  PERFORM set_config('app.tenant_deletion', '1', true);

  SELECT coalesce(array_agg(DISTINCT a.user_id), '{}') INTO v_users
  FROM public.admins a
  WHERE a.tenant_id = p_tenant
    AND a.role IN ('owner', 'staff')
    AND NOT EXISTS (
      SELECT 1 FROM public.admins o
      WHERE o.user_id = a.user_id AND (o.tenant_id IS DISTINCT FROM p_tenant)
    );

  DELETE FROM public.tenants WHERE id = p_tenant;
  DELETE FROM auth.users WHERE id = ANY (v_users);
  GET DIAGNOSTICS c = ROW_COUNT;
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.reject_tenant(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c integer;
BEGIN
  IF NOT public.is_super_admin_caller() THEN
    RAISE EXCEPTION 'NOT_SUPER_ADMIN' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant AND approval_status = 'pending') THEN
    RAISE EXCEPTION 'NOT_PENDING' USING ERRCODE = '22023';
  END IF;

  c := public.delete_tenant_and_logins(p_tenant);
  RETURN jsonb_build_object('rejected', p_tenant, 'deleted_logins', c);
END $$;

-- Daily job: pending requests older than 30 days, and never-confirmed signups older than 7 days.
CREATE OR REPLACE FUNCTION public.purge_stale_signups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t record;
  n_pending integer := 0;
  n_unconfirmed integer := 0;
BEGIN
  FOR t IN
    SELECT id FROM public.tenants
    WHERE approval_status = 'pending'
      AND coalesce(signup_requested_at, created_at) < now() - interval '30 days'
  LOOP
    PERFORM public.delete_tenant_and_logins(t.id);
    n_pending := n_pending + 1;
  END LOOP;

  DELETE FROM auth.users u
  WHERE u.email_confirmed_at IS NULL
    AND u.created_at < now() - interval '7 days'
    AND u.raw_user_meta_data ? 'business_slug'
    AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = u.id);
  GET DIAGNOSTICS n_unconfirmed = ROW_COUNT;

  RETURN jsonb_build_object('deleted_pending', n_pending, 'deleted_unconfirmed', n_unconfirmed, 'ran_at', now());
END $$;

REVOKE ALL ON FUNCTION public.slug_is_valid(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_slug_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_business_signup() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_pending_signups() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_tenant_and_logins(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_stale_signups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.slug_is_valid(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_business_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_signups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tenant_and_logins(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_stale_signups() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('purge-stale-signups')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-stale-signups');
  PERFORM cron.schedule('purge-stale-signups', '20 3 * * *', 'select public.purge_stale_signups()');
END $$;
