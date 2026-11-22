-- ============================================================================
-- Waymark Mobile — Feature 04.5: Account Security, Settings & Final Feature 04 QA
-- Task 04.5.3: Supabase RLS, Session & Account Security Verification
-- File: supabase/tests/feature_04_5_account_rls.test.sql
-- Description: pgTAP / PostgreSQL transaction-isolated test suite verifying
--              genuine Row Level Security (RLS) isolation and access control
--              across public.profiles, public.saved_places, and public.traveler_preferences.
-- ============================================================================

begin;

-- Verify pgTAP extension is available
create extension if not exists pgtap;

select plan(26);

-- ============================================================================
-- 1. SETUP TEST FIXTURES (within isolated transaction)
-- ============================================================================

-- Create test identities in auth.users
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
    ('00000000-0000-0000-0000-000000000001', 'alice@waymark.local', '{"name":"Alice Traveler"}', now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'bob@waymark.local', '{"name":"Bob Traveler"}', now(), now())
on conflict (id) do nothing;

-- Pre-populate User B's private fixtures using privileged session
insert into public.profiles (id, display_name, avatar_url)
values ('00000000-0000-0000-0000-000000000002', 'Bob Secret', 'https://waymark.local/bob.png')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.saved_places (id, user_id, kind, label, place_text)
values
    ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000002', 'home', 'Home', '742 Evergreen Terrace, Springfield'),
    ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000002', 'work', 'Work', 'Nuclear Power Plant, Sector 7G')
on conflict (id) do nothing;

insert into public.traveler_preferences (user_id, preferred_modes, distance_unit)
values ('00000000-0000-0000-0000-000000000002', array['subway', 'ferry'], 'mi')
on conflict (user_id) do nothing;

-- ============================================================================
-- 2. ANONYMOUS CALLER TESTS (Role: anon)
-- ============================================================================

set local role anon;
set local "request.jwt.claims" = '';

-- PROFILES
select is_empty(
    $$ select * from public.profiles $$,
    'RLS-01 [Profiles]: Anonymous caller cannot select any profile'
);

select throws_ok(
    $$ insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-000000000001', 'Hacker') $$,
    '42501',
    null,
    'RLS-02 [Profiles]: Anonymous caller cannot insert profile'
);

select throws_ok(
    $$ update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-03 [Profiles]: Anonymous caller cannot update profiles'
);

select throws_ok(
    $$ delete from public.profiles where id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-04 [Profiles]: Anonymous caller cannot delete profiles'
);

-- SAVED PLACES
select is_empty(
    $$ select * from public.saved_places $$,
    'RLS-05 [Saved Places]: Anonymous caller cannot select any saved places'
);

select throws_ok(
    $$ insert into public.saved_places (user_id, kind, label, place_text) values ('00000000-0000-0000-0000-000000000001', 'home', 'Fake Home', '123 Fake St') $$,
    '42501',
    null,
    'RLS-06 [Saved Places]: Anonymous caller cannot insert saved places'
);

select throws_ok(
    $$ update public.saved_places set place_text = 'Compromised' where user_id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-07 [Saved Places]: Anonymous caller cannot update saved places'
);

select throws_ok(
    $$ delete from public.saved_places where user_id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-08 [Saved Places]: Anonymous caller cannot delete saved places'
);

-- TRAVELER PREFERENCES
select is_empty(
    $$ select * from public.traveler_preferences $$,
    'RLS-09 [Traveler Preferences]: Anonymous caller cannot select traveler preferences'
);

select throws_ok(
    $$ insert into public.traveler_preferences (user_id, preferred_modes, distance_unit) values ('00000000-0000-0000-0000-000000000001', array['bus'], 'km') $$,
    '42501',
    null,
    'RLS-10 [Traveler Preferences]: Anonymous caller cannot insert traveler preferences'
);

-- ============================================================================
-- 3. AUTHENTICATED USER A TESTS (Role: authenticated, sub: User A)
-- ============================================================================

set local role authenticated;
set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001"}';

-- PROFILES (User A)
select lives_ok(
    $$ insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-000000000001', 'Alice Genuine') $$,
    'RLS-11 [Profiles]: User A can insert own profile'
);

select results_eq(
    $$ select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000001' $$,
    $$ values ('Alice Genuine'::varchar(50)) $$,
    'RLS-12 [Profiles]: User A can read own profile'
);

select is_empty(
    $$ select * from public.profiles where id = '00000000-0000-0000-0000-000000000002' $$,
    'RLS-13 [Profiles]: User A cannot select User B profile (0 rows returned)'
);

-- Attempt unauthorized update of User B profile
with updated as (
    update public.profiles set display_name = 'Attacked' where id = '00000000-0000-0000-0000-000000000002' returning *
)
select is_empty(
    $$ select * from updated $$,
    'RLS-14 [Profiles]: User A cannot update User B profile (0 rows updated)'
);

select throws_ok(
    $$ insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-000000000002', 'Spoofed Bob') $$,
    '42501',
    null,
    'RLS-15 [Profiles]: User A cannot insert profile spoofing User B ID'
);

-- SAVED PLACES (User A)
select lives_ok(
    $$ insert into public.saved_places (id, user_id, kind, label, place_text) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'home', 'Home', '100 Main St, Colombo') $$,
    'RLS-16 [Saved Places]: User A can insert own Home'
);

select results_eq(
    $$ select place_text from public.saved_places where user_id = '00000000-0000-0000-0000-000000000001' and kind = 'home' $$,
    $$ values ('100 Main St, Colombo'::varchar(120)) $$,
    'RLS-17 [Saved Places]: User A can read own Home'
);

select is_empty(
    $$ select * from public.saved_places where user_id = '00000000-0000-0000-0000-000000000002' $$,
    'RLS-18 [Saved Places]: User A cannot read User B saved places (Home or Work)'
);

-- Attempt unauthorized update of User B saved place
with updated as (
    update public.saved_places set place_text = 'Tampered' where user_id = '00000000-0000-0000-0000-000000000002' returning *
)
select is_empty(
    $$ select * from updated $$,
    'RLS-19 [Saved Places]: User A cannot update User B saved places'
);

-- Attempt unauthorized delete of User B saved place
with deleted as (
    delete from public.saved_places where user_id = '00000000-0000-0000-0000-000000000002' returning *
)
select is_empty(
    $$ select * from deleted $$,
    'RLS-20 [Saved Places]: User A cannot delete User B saved places'
);

select throws_ok(
    $$ insert into public.saved_places (user_id, kind, label, place_text) values ('00000000-0000-0000-0000-000000000002', 'favorite', 'Injected', 'Malicious Loc') $$,
    '42501',
    null,
    'RLS-21 [Saved Places]: User A cannot insert row owned by User B'
);

-- Home uniqueness constraint per user
select throws_ok(
    $$ insert into public.saved_places (user_id, kind, label, place_text) values ('00000000-0000-0000-0000-000000000001', 'home', 'Second Home', 'Duplicate Address') $$,
    '23505',
    null,
    'RLS-22 [Saved Places]: Unique Home per user constraint enforced (duplicate Home rejected)'
);

-- TRAVELER PREFERENCES (User A)
select lives_ok(
    $$ insert into public.traveler_preferences (user_id, preferred_modes, distance_unit) values ('00000000-0000-0000-0000-000000000001', array['bus', 'train'], 'km') $$,
    'RLS-23 [Traveler Preferences]: User A can insert own traveler preferences'
);

select results_eq(
    $$ select distance_unit from public.traveler_preferences where user_id = '00000000-0000-0000-0000-000000000001' $$,
    $$ values ('km'::varchar(10)) $$,
    'RLS-24 [Traveler Preferences]: User A can read own traveler preferences'
);

select is_empty(
    $$ select * from public.traveler_preferences where user_id = '00000000-0000-0000-0000-000000000002' $$,
    'RLS-25 [Traveler Preferences]: User A cannot read User B traveler preferences'
);

select throws_ok(
    $$ insert into public.traveler_preferences (user_id, preferred_modes, distance_unit) values ('00000000-0000-0000-0000-000000000002', array['tram'], 'mi') $$,
    '42501',
    null,
    'RLS-26 [Traveler Preferences]: User A cannot forge another user preferences row'
);

-- ============================================================================
-- 4. FINISH AND SAFE TRANSACTION ROLLBACK
-- ============================================================================

select * from finish();

-- Roll back all test data cleanly so no fixtures persist in the environment
rollback;
