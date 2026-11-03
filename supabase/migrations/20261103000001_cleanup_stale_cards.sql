-- Deletes cards that have not been scanned for N months (default 3). Called by a cron-job.org rule:
--   POST https://<project>.supabase.co/rest/v1/rpc/cleanup_stale_cards   body {"p_months": 3}   (service role key)
-- Cards that were never scanned (last_scan_at is null) are kept. The scan_events of a deleted card go with it
-- (scan_events_card_id_fkey is ON DELETE CASCADE).
CREATE OR REPLACE FUNCTION public.cleanup_stale_cards(p_months integer DEFAULT 3)
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

  WITH gone AS (
    DELETE FROM public.cards
    WHERE last_scan_at < now() - make_interval(months => p_months)
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM gone;

  RETURN jsonb_build_object('deleted_cards', deleted_count, 'months', p_months, 'ran_at', now());
END $$;

REVOKE ALL ON FUNCTION public.cleanup_stale_cards(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_cards(integer) TO service_role;

COMMENT ON FUNCTION public.cleanup_stale_cards(integer) IS 'Deletes cards not scanned for p_months months (default 3). Called by cron-job.org with the service role key.';
