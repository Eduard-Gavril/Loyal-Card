-- Deletes customer accounts (clients table, never a shop) that have not been used for N months (default 10).
-- Called by a cron-job.org rule:
--   POST https://<project>.supabase.co/rest/v1/rpc/cleanup_inactive_users   body {"p_months": 10}   (service role key)
-- "Used" = the account was created or edited, a card was opened, or a card was scanned: the most recent of those
-- dates must be older than N months. Cards and scan_events go with the account (ON DELETE CASCADE).
CREATE OR REPLACE FUNCTION public.cleanup_inactive_users(p_months integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF p_months IS NULL OR p_months < 1 THEN
    RAISE EXCEPTION 'p_months must be at least 1';
  END IF;

  WITH inactive AS (
    SELECT c.id
    FROM public.clients c
    LEFT JOIN public.cards k ON k.client_id = c.id
    GROUP BY c.id
    HAVING greatest(c.created_at, c.updated_at, max(k.last_scan_at), max(k.created_at)) < now() - make_interval(months => p_months)
  ),
  gone AS (
    DELETE FROM public.clients WHERE id IN (SELECT id FROM inactive) RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM gone;

  RETURN jsonb_build_object('deleted_users', deleted_count, 'months', p_months, 'ran_at', now());
END $$;

REVOKE ALL ON FUNCTION public.cleanup_inactive_users(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_users(integer) TO service_role;

COMMENT ON FUNCTION public.cleanup_inactive_users(integer) IS 'Deletes customer accounts unused for p_months months (default 10). Called by cron-job.org with the service role key.';
