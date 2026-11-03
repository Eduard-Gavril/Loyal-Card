-- A business that asked to be deleted is hidden right away (active = false) so it no longer shows in the partners list.
-- Cancelling the deletion makes it visible again, as it was before (deletion_was_active remembers the previous state).
-- While the deletion is scheduled the owner cannot make the business visible again except by cancelling the deletion.
-- When the grace period ends purge_tenants_due() deletes the business and everything that hangs off it
-- (stores, products, categories, reward rules, cards, scans, broadcasts; audit_logs keep their row with tenant_id = null).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS deletion_was_active boolean;

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
      OR NEW.deletion_scheduled_at IS DISTINCT FROM OLD.deletion_scheduled_at
      OR NEW.deletion_was_active IS DISTINCT FROM OLD.deletion_was_active)
     AND NOT public.tenant_deletion_allowed() THEN
    RAISE EXCEPTION 'DELETION_PROTECTED: use request_tenant_deletion() / cancel_tenant_deletion()' USING ERRCODE = '42501';
  END IF;

  IF NEW.deletion_scheduled_at IS NOT NULL
     AND NEW.active IS TRUE AND OLD.active IS NOT TRUE
     AND NOT public.tenant_deletion_allowed() THEN
    RAISE EXCEPTION 'DELETION_PENDING: the business stays hidden until the deletion is cancelled' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

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
     SET deletion_was_active = CASE WHEN deletion_scheduled_at IS NULL THEN active ELSE deletion_was_active END,
         deletion_requested_at = coalesce(deletion_requested_at, now()),
         deletion_scheduled_at = coalesce(deletion_scheduled_at, v_when),
         active = false
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
     SET active = CASE WHEN approval_status = 'approved' THEN coalesce(deletion_was_active, true) ELSE active END,
         deletion_requested_at = NULL,
         deletion_scheduled_at = NULL,
         deletion_was_active = NULL
   WHERE id = v_tenant;

  RETURN jsonb_build_object('cancelled', true);
END $$;

-- businesses that already have a deletion scheduled: hide them now
UPDATE public.tenants
   SET deletion_was_active = active, active = false
 WHERE deletion_scheduled_at IS NOT NULL AND deletion_was_active IS NULL AND active = true;
