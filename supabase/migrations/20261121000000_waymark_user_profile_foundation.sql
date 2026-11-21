-- ============================================================================
-- Waymark Mobile — Feature 04.4: User Profile, Saved Places & Traveler Preferences
-- Migration: 20261121000000_waymark_user_profile_foundation.sql
-- Description: Establishes public.profiles, public.saved_places, and
--              public.traveler_preferences with strict Row Level Security (RLS).
-- ============================================================================

-- 1. PROFILES TABLE
-- Stores public-facing traveler profile attributes linked 1:1 to auth.users.
-- Sensitive identity details (email, password hash, phone) remain strictly in auth.users.
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name varchar(50),
    avatar_url varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger or function to automatically maintain updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

-- 2. SAVED PLACES TABLE
-- Stores traveler-designated Home, Work, and Favorite custom destination shortcuts.
-- Bounded strings, no coordinates required, strict partial unique indexes.
create table if not exists public.saved_places (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    kind varchar(20) not null check (kind in ('home', 'work', 'favorite')),
    label varchar(50) not null,
    place_text varchar(120) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Partial unique indexes: each authenticated user may possess at most one Home and one Work place
create unique index if not exists idx_saved_places_unique_home
    on public.saved_places (user_id)
    where (kind = 'home');

create unique index if not exists idx_saved_places_unique_work
    on public.saved_places (user_id)
    where (kind = 'work');

-- Performance index for user-scoped lookup
create index if not exists idx_saved_places_user_id
    on public.saved_places (user_id);

drop trigger if exists set_saved_places_updated_at on public.saved_places;
create trigger set_saved_places_updated_at
    before update on public.saved_places
    for each row
    execute function public.handle_updated_at();

-- 3. TRAVELER PREFERENCES TABLE
-- Stores user-configured transit preferences (preferred modes, distance units).
-- Non-sensitive traveler settings; never stores health, disability, or diagnosis data.
create table if not exists public.traveler_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferred_modes text[] not null default '{}',
    distance_unit varchar(10) not null default 'km' check (distance_unit in ('km', 'mi')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists set_traveler_preferences_updated_at on public.traveler_preferences;
create trigger set_traveler_preferences_updated_at
    before update on public.traveler_preferences
    for each row
    execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user ownership isolation: auth.uid() must match row owner on all operations.
-- The unauthenticated 'anon' role is granted zero access to any private row.
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.saved_places enable row level security;
alter table public.traveler_preferences enable row level security;

-- Revoke dangerous broad permissions from public / anon
revoke all on public.profiles from public, anon;
revoke all on public.saved_places from public, anon;
revoke all on public.traveler_preferences from public, anon;

-- Grant minimal necessary table privileges to authenticated role
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, update, delete on public.traveler_preferences to authenticated;

-- PROFILES POLICIES
drop policy if exists "Users can select own profile" on public.profiles;
create policy "Users can select own profile"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
    on public.profiles
    for delete
    to authenticated
    using (auth.uid() = id);

-- SAVED PLACES POLICIES
drop policy if exists "Users can select own saved places" on public.saved_places;
create policy "Users can select own saved places"
    on public.saved_places
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved places" on public.saved_places;
create policy "Users can insert own saved places"
    on public.saved_places
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved places" on public.saved_places;
create policy "Users can update own saved places"
    on public.saved_places
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved places" on public.saved_places;
create policy "Users can delete own saved places"
    on public.saved_places
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- TRAVELER PREFERENCES POLICIES
drop policy if exists "Users can select own preferences" on public.traveler_preferences;
create policy "Users can select own preferences"
    on public.traveler_preferences
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.traveler_preferences;
create policy "Users can insert own preferences"
    on public.traveler_preferences
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.traveler_preferences;
create policy "Users can update own preferences"
    on public.traveler_preferences
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own preferences" on public.traveler_preferences;
create policy "Users can delete own preferences"
    on public.traveler_preferences
    for delete
    to authenticated
    using (auth.uid() = user_id);
