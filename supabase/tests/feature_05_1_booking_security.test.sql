-- ============================================================================
-- Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
-- Task 05.1.3: Supabase RLS, Database Constraints & Transaction Security Verification
-- File: supabase/tests/feature_05_1_booking_security.test.sql
-- Description: pgTAP / PostgreSQL transaction-isolated test suite verifying:
--              1. Row Level Security (RLS) isolation on bookings & idempotency tables
--              2. Database integrity constraints on inventory and reservations
--              3. Zero direct client write access to authoritative booking state
-- ============================================================================

begin;

create extension if not exists pgtap;

select plan(24);

-- ============================================================================
-- 1. SETUP TEST FIXTURES (within isolated transaction)
-- ============================================================================

-- Create test identities in auth.users
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
    ('00000000-0000-0000-0000-000000000001', 'alice.traveler@waymark.local', '{"name":"Alice"}', now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'bob.traveler@waymark.local', '{"name":"Bob"}', now(), now())
on conflict (id) do nothing;

-- Pre-populate catalog departure and inventory fixtures using privileged session
insert into public.bookable_departures (
    id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name,
    departure_time, arrival_time, service_identifier, inventory_source, bookable_status
) values (
    'dep-test-colombo-kandy-01', 'op-test-rail', 'node-colombo', 'Colombo Fort', 'node-kandy', 'Kandy Terminal',
    now() + interval '2 days', now() + interval '2 days 3 hours', 'EXP-01', 'operator_verified', 'available'
) on conflict (id) do nothing;

insert into public.departure_inventory (
    departure_id, total_capacity, allocated_capacity, held_capacity
) values (
    'dep-test-colombo-kandy-01', 100, 10, 5
) on conflict (departure_id) do nothing;

-- Populate Bob's private booking record
insert into public.booking_reservations (
    id, user_id, departure_id, passenger_count, fare_quote_id,
    total_amount_minor_units, currency, status, idempotency_key
) values (
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-000000000002',
    'dep-test-colombo-kandy-01',
    2,
    'quote-bob-001',
    500000,
    'LKR',
    'confirmed',
    'bob-idemp-key-001'
) on conflict (id) do nothing;

insert into public.booking_idempotency_records (
    id, user_id, idempotency_key, operation_type, request_hash, status
) values (
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-000000000002',
    'bob-idemp-key-001',
    'reserve',
    'hash-bob-001',
    'completed'
) on conflict (id) do nothing;

-- ============================================================================
-- 2. ANONYMOUS CALLER TESTS (Role: anon)
-- ============================================================================

set local role anon;
set local "request.jwt.claims" = '';

select isnt_empty(
    $$ select * from public.bookable_departures where id = 'dep-test-colombo-kandy-01' $$,
    'RLS-01 [Departures]: Anonymous caller can read public departures catalog'
);

select isnt_empty(
    $$ select * from public.departure_inventory where departure_id = 'dep-test-colombo-kandy-01' $$,
    'RLS-02 [Inventory]: Anonymous caller can read public departure capacity'
);

select is_empty(
    $$ select * from public.booking_reservations $$,
    'RLS-03 [Bookings]: Anonymous caller cannot read any booking reservations'
);

select is_empty(
    $$ select * from public.booking_idempotency_records $$,
    'RLS-04 [Idempotency]: Anonymous caller cannot read any idempotency records'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 1, 'quote-1', 100, 'LKR', 'confirmed', 'key-1') $$,
    '42501',
    null,
    'RLS-05 [Bookings]: Anonymous caller cannot insert booking records'
);

select throws_ok(
    $$ insert into public.bookable_departures (id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name, departure_time, service_identifier, inventory_source)
       values ('dep-hacked', 'op-hack', 'node-1', 'A', 'node-2', 'B', now(), 'HACK', 'sample_data') $$,
    '42501',
    null,
    'RLS-06 [Departures]: Anonymous caller cannot modify departures catalog'
);

-- ============================================================================
-- 3. AUTHENTICATED USER A CALLER TESTS (Role: authenticated, User: Alice)
-- ============================================================================

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is_empty(
    $$ select * from public.booking_reservations where user_id = '00000000-0000-0000-0000-000000000002' $$,
    'RLS-07 [Cross-User Isolation]: Alice cannot read Bob''s booking reservation'
);

select is_empty(
    $$ select * from public.booking_idempotency_records where user_id = '00000000-0000-0000-0000-000000000002' $$,
    'RLS-08 [Cross-User Isolation]: Alice cannot read Bob''s idempotency record'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 1, 'quote-1', 100, 'LKR', 'confirmed', 'alice-key-1') $$,
    '42501',
    null,
    'RLS-09 [Write Defense]: Direct client insert to booking_reservations is rejected'
);

select throws_ok(
    $$ update public.booking_reservations set status = 'ticket_issued' where user_id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-10 [Write Defense]: Direct client update on booking_reservations is rejected'
);

select throws_ok(
    $$ delete from public.booking_reservations where user_id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    null,
    'RLS-11 [Write Defense]: Direct client delete on booking_reservations is rejected'
);

select throws_ok(
    $$ update public.departure_inventory set allocated_capacity = 0 where departure_id = 'dep-test-colombo-kandy-01' $$,
    '42501',
    null,
    'RLS-12 [Write Defense]: Direct client update on departure_inventory is rejected'
);

-- ============================================================================
-- 4. AUTHENTICATED USER B CALLER TESTS (Role: authenticated, User: Bob)
-- ============================================================================

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select results_eq(
    $$ select status from public.booking_reservations where user_id = '00000000-0000-0000-0000-000000000002' $$,
    array['confirmed'::varchar],
    'RLS-13 [Own Record Access]: Bob can select his own confirmed booking reservation'
);

select results_eq(
    $$ select idempotency_key from public.booking_idempotency_records where user_id = '00000000-0000-0000-0000-000000000002' $$,
    array['bob-idemp-key-001'::varchar],
    'RLS-14 [Own Record Access]: Bob can select his own idempotency record'
);

-- ============================================================================
-- 5. DATABASE INTEGRITY CONSTRAINTS (Privileged / Transaction Engine Role)
-- ============================================================================

set local role postgres;

select throws_ok(
    $$ insert into public.departure_inventory (departure_id, total_capacity, allocated_capacity, held_capacity)
       values ('dep-test-colombo-kandy-01', -10, 0, 0) $$,
    '23514',
    null,
    'CONST-01 [Inventory Bounds]: Rejects negative total capacity'
);

select throws_ok(
    $$ update public.departure_inventory set allocated_capacity = 95, held_capacity = 10 where departure_id = 'dep-test-colombo-kandy-01' $$,
    '23514',
    null,
    'CONST-02 [Inventory Bounds]: Rejects allocated + held capacity exceeding total capacity'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 0, 'quote-1', 100, 'LKR', 'draft', 'key-pass-0') $$,
    '23514',
    null,
    'CONST-03 [Passenger Count]: Rejects passenger count below minimum (0)'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 10, 'quote-1', 100, 'LKR', 'draft', 'key-pass-10') $$,
    '23514',
    null,
    'CONST-04 [Passenger Count]: Rejects passenger count above maximum (10)'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 1, 'quote-1', -500, 'LKR', 'draft', 'key-neg-amount') $$,
    '23514',
    null,
    'CONST-05 [Monetary Bounds]: Rejects negative monetary amounts'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 1, 'quote-1', 500, 'INVALID_CURRENCY', 'draft', 'key-bad-cur') $$,
    '23514',
    null,
    'CONST-06 [Currency Bounds]: Rejects unsupported currency code'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-test-colombo-kandy-01', 1, 'quote-1', 500, 'LKR', 'arbitrary_status', 'key-bad-status') $$,
    '23514',
    null,
    'CONST-07 [Status Machine]: Rejects arbitrary booking lifecycle status'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000002', 'dep-test-colombo-kandy-01', 1, 'quote-2', 500, 'LKR', 'draft', 'bob-idemp-key-001') $$,
    '23505',
    null,
    'CONST-08 [Idempotency Unique]: Rejects duplicate idempotency key for same user'
);

select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key)
       values ('00000000-0000-0000-0000-000000000001', 'dep-nonexistent', 1, 'quote-1', 500, 'LKR', 'draft', 'key-nonexistent-dep') $$,
    '23503',
    null,
    'CONST-09 [Foreign Key]: Rejects booking for non-existent departure'
);

select throws_ok(
    $$ insert into public.bookable_departures (
           id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name,
           departure_time, arrival_time, service_identifier, inventory_source
       ) values (
           'dep-bad-order', 'op-test', 'node-1', 'A', 'node-2', 'B',
           now() + interval '2 hours', now() + interval '1 hour', 'EXP-X', 'sample_data'
       ) $$,
    '23514',
    null,
    'CONST-10 [Timestamp Order]: Rejects arrival time occurring before departure time'
);

select * from finish();

rollback;
