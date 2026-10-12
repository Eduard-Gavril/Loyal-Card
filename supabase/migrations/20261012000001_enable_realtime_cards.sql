-- Enable Realtime on cards so the client page sees new stamps instantly.
-- Already applied on the hosted project; idempotent so a later `db push` or a
-- fresh environment doesn't fail with "relation is already member of publication".
-- Rollback: alter publication supabase_realtime drop table public.cards;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cards'
  ) then
    alter publication supabase_realtime add table public.cards;
  end if;
end $$;
