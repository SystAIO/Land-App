-- SystIO Land — wipe EVERYTHING the application created (tables + triggers +
-- functions). ⚠️ DESTRUCTIVE: deletes all data. Run in the SQL editor,
-- then re-run schema.sql and seed.sql to rebuild the app fresh.

drop table if exists public.favorites cascade;
drop table if exists public.payments cascade;
drop table if exists public.properties cascade;
drop table if exists public.profiles cascade;

drop function if exists public.set_updated_at() cascade;
