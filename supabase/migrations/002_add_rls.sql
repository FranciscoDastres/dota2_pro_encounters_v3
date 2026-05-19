-- Enable Row Level Security on both tables.
--
-- The backend uses the service_role key which bypasses RLS by design,
-- so existing functionality is unaffected. RLS blocks any access through
-- the anon or authenticated roles (e.g. direct PostgREST calls with the
-- public anon key).
--
-- No explicit policies are added: only the service_role should touch
-- these tables, and it bypasses RLS automatically.

ALTER TABLE pro_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_cache  ENABLE ROW LEVEL SECURITY;
