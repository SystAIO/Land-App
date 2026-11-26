-- SystIO Land — seed: admin account only.
-- Run once after schema.sql in the SQL editor.
--
-- Login (change immediately afterwards):
--   Email:    admin@systio.land
--   Password: Admin@123
--
-- The admin row is a normal profile with role = 'admin' and a bcrypt password
-- hash — there is no Supabase Auth involved.

-- Admin credentials can be overridden safely:
--   1. run schema.sql
--   2. run this file
-- The password is hashed with pgcrypto's bf (bcrypt).

delete from public.profiles where lower(email) = 'admin@systio.land';

insert into public.profiles (
  email,
  phone,
  name,
  role,
  onboarding_completed,
  phone_verified,
  password_hash,
  free_listing_used
)
values (
  'admin@systio.land',
  null,
  'SystIO Admin',
  'admin',
  true,
  true,
  crypt('Admin@123', gen_salt('bf')),
  true
);
