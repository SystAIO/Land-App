-- SystIO Land — full application schema for the Node/Express backend.
-- Run once (or re-run after reset.sql) in the SQL editor of the SAME Supabase
-- project you use for the database. The database stays on Supabase; every
-- other backend concern (auth, payments, listings, admin) lives in Express.
--
-- Safe to re-run: objects are dropped and recreated where needed. If you want
-- to keep data, use reset.sql instead of running this on an old database.
--
-- Connection used by the backend: DATABASE_URL (postgres role). That role owns
-- these tables, so RLS is intentionally NOT used — all authorization happens
-- in the Express layer.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (no auth.users dependency — accounts are self-contained)
-- ---------------------------------------------------------------------------

drop table if exists public.favorites cascade;
drop table if exists public.payments cascade;
drop table if exists public.properties cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  phone text,
  email text,
  password_hash text,
  name text not null default '',
  role text not null default 'owner' check (role in ('owner', 'broker', 'browse', 'admin')),
  avatar_url text,
  free_listing_used boolean not null default false,
  onboarding_completed boolean not null default false,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;

create unique index if not exists profiles_email_unique
  on public.profiles (lower(email))
  where email is not null;

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text not null default '',
  listing_type text not null check (listing_type in ('sale', 'rent')),
  property_type text not null
    check (property_type in ('plot', 'flat', 'house', 'commercial', 'agricultural')),
  price numeric(14, 2) not null check (price > 0),
  area_value numeric(14, 2) not null check (area_value > 0),
  area_unit text not null
    check (area_unit in ('sqft', 'sqm', 'acre', 'kattha', 'dismil', 'bigha')),
  address text not null,
  locality text not null,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  boundary jsonb not null default '[]'::jsonb
    check (jsonb_typeof(boundary) = 'array'),
  images text[] not null default '{}'::text[],
  youtube_url text,
  nearby_landmarks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(nearby_landmarks) = 'array'),
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'approved', 'declined')),
  admin_note text,
  is_featured boolean not null default false,
  views_count integer not null default 0 check (views_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_owner_id_fkey
    foreign key (owner_id) references public.profiles (id) on delete cascade,
  constraint properties_title_length_check
    check (char_length(title) between 6 and 140),
  constraint properties_description_length_check
    check (char_length(description) <= 5000),
  constraint properties_min_images_check
    check (status = 'draft' or coalesce(array_length(images, 1), 0) >= 4)
);

create index if not exists properties_owner_idx on public.properties (owner_id);
create index if not exists properties_status_idx on public.properties (status);
create index if not exists properties_city_idx on public.properties (lower(city));
create index if not exists properties_created_idx on public.properties (created_at desc);
create index if not exists properties_status_created_idx
  on public.properties (status, created_at desc);
create index if not exists properties_featured_idx
  on public.properties (is_featured)
  where status = 'approved';

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null,
  property_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id),
  constraint favorites_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint favorites_property_id_fkey
    foreign key (property_id) references public.properties (id) on delete cascade
);

create index if not exists favorites_property_idx on public.favorites (property_id);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_id uuid,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded')),
  kind text not null check (kind in ('free_listing', 'listing_fee')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint payments_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete restrict,
  constraint payments_property_id_fkey
    foreign key (property_id) references public.properties (id) on delete set null
);

create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_property_idx on public.payments (property_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_idx on public.payments (created_at desc);
create unique index if not exists payments_one_open_order_idx
  on public.payments (property_id)
  where status = 'created' and kind = 'listing_fee' and property_id is not null;

-- ---------------------------------------------------------------------------
-- Full-text search helper (trigram)
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;
create index if not exists properties_locality_trgm on public.properties using gin (lower(locality) gin_trgm_ops);
create index if not exists properties_title_trgm on public.properties using gin (lower(title) gin_trgm_ops);
