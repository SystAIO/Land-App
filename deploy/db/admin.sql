-- Creates/updates the seeded admin profile during deployment.
-- psql variables: admin_email, admin_password (passed with -v by setup-server.sh).
-- Equivalent to backend/db/seed.sql, but the credentials come from deploy.env.

insert into public.profiles (
  email, name, role, onboarding_completed, phone_verified, password_hash, free_listing_used
)
select
  lower(:'admin_email'), 'SystIO Admin', 'admin', true, true,
  crypt(:'admin_password', gen_salt('bf')), true
where not exists (
  select 1 from public.profiles where lower(email) = lower(:'admin_email')
);

update public.profiles
   set role = 'admin',
       password_hash = crypt(:'admin_password', gen_salt('bf')),
       onboarding_completed = true,
       phone_verified = true,
       free_listing_used = true
 where lower(email) = lower(:'admin_email');
