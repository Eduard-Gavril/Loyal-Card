-- "Force deletion": the owner of a business whose deletion is already scheduled can skip the 14 day grace period.
-- The account password is checked here, in the database (bcrypt hash in auth.users), so the call cannot be made
-- without knowing it. A wrong password waits one second before answering, to slow down guessing.
-- Everything goes the same way as the scheduled purge: the business and its data, plus the owner / staff logins.
CREATE OR REPLACE FUNCTION public.delete_tenant_now(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_tenant uuid := public.current_owner_tenant();
  v_hash text;
  c integer;
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'NOT_OWNER: only the owner can delete the business' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant AND deletion_scheduled_at IS NOT NULL) THEN
    RAISE EXCEPTION 'NOT_SCHEDULED: request the deletion first' USING ERRCODE = '22023';
  END IF;

  SELECT encrypted_password INTO v_hash FROM auth.users WHERE id = auth.uid();
  IF v_hash IS NULL OR coalesce(p_password, '') = '' OR crypt(p_password, v_hash) <> v_hash THEN
    PERFORM pg_sleep(1);
    RAISE EXCEPTION 'WRONG_PASSWORD' USING ERRCODE = '28P01';
  END IF;

  c := public.delete_tenant_and_logins(v_tenant);
  RETURN jsonb_build_object('deleted', v_tenant, 'deleted_logins', c);
END $$;

REVOKE ALL ON FUNCTION public.delete_tenant_now(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_tenant_now(text) TO authenticated;
