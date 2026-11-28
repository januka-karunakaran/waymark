-- ============================================================================
-- Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
-- Task 05.3.2: Atomic Inventory Allocation, Idempotency & Concurrency Verification
-- File: supabase/tests/feature_05_3_atomic_reservation_holds.test.sql
-- Description: pgTAP transaction-isolated test suite verifying:
--              1. Atomic inventory allocation and capacity invariant preservation
--              2. Single and multi-passenger holds
--              3. Insufficient capacity rejection without partial allocation
--              4. Transactional idempotency coordination (replays, conflicts, user isolation)
--              5. Rejection of unverified / sample_data departures
--              6. Execution privilege hardening (anon and authenticated denied RPC execute)
--              7. Row Level Security enforcement
-- ============================================================================

begin;

create extension if not exists pgtap;

select plan(32);

-- ============================================================================
-- 1. SETUP TEST FIXTURES
-- ============================================================================

-- Create test identities in auth.users
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
    ('00000000-0000-0000-0000-0000000000a1', 'alice.traveler@waymark.local', '{"name":"Alice"}', now(), now()),
    ('00000000-0000-0000-0000-0000000000b2', 'bob.traveler@waymark.local', '{"name":"Bob"}', now(), now())
on conflict (id) do nothing;

-- Verified bookable departure fixture
insert into public.bookable_departures (
    id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name,
    departure_time, arrival_time, service_identifier, inventory_source, bookable_status
) values (
    'dep-test-kandy-colombo-201', 'op-test-rail', 'node-kandy', 'Kandy Terminal', 'node-colombo', 'Colombo Fort',
    now() + interval '3 days', now() + interval '3 days 3 hours', 'EXP-201', 'operator_verified', 'available'
) on conflict (id) do nothing;

-- Departure inventory fixture (total: 50, allocated: 0, held: 0 -> available: 50)
insert into public.departure_inventory (
    departure_id, total_capacity, allocated_capacity, held_capacity
) values (
    'dep-test-kandy-colombo-201', 50, 0, 0
) on conflict (departure_id) do nothing;

-- Sample departure fixture (unverified provenance)
insert into public.bookable_departures (
    id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name,
    departure_time, arrival_time, service_identifier, inventory_source, bookable_status
) values (
    'dep-test-sample-corridor-404', 'op-sample', 'node-sample-a', 'Sample Alpha', 'node-sample-b', 'Sample Beta',
    now() + interval '3 days', now() + interval '3 days 2 hours', 'SMP-404', 'sample_data', 'available'
) on conflict (id) do nothing;

insert into public.departure_inventory (
    departure_id, total_capacity, allocated_capacity, held_capacity
) values (
    'dep-test-sample-corridor-404', 100, 0, 0
) on conflict (departure_id) do nothing;

-- Departure with limited capacity (available: 1)
insert into public.bookable_departures (
    id, operator_id, origin_node_id, origin_name, destination_node_id, destination_name,
    departure_time, arrival_time, service_identifier, inventory_source, bookable_status
) values (
    'dep-test-tight-inventory-01', 'op-test-rail', 'node-colombo', 'Colombo Fort', 'node-galle', 'Galle Terminal',
    now() + interval '2 days', now() + interval '2 days 2 hours', 'GAL-01', 'operator_verified', 'available'
) on conflict (id) do nothing;

insert into public.departure_inventory (
    departure_id, total_capacity, allocated_capacity, held_capacity
) values (
    'dep-test-tight-inventory-01', 10, 5, 4
) on conflict (departure_id) do nothing;

-- ============================================================================
-- 2. PRIVILEGE HARDENING TESTS
-- ============================================================================

-- anon role cannot execute create_reservation_hold
set local role anon;
select throws_ok(
    $$ select public.create_reservation_hold('00000000-0000-0000-0000-0000000000a1'::uuid, 'dep-test-kandy-colombo-201', 1, 'quote-1', 10000, 'LKR', 'idemp-anon-attempt-01', 'hash-1') $$,
    '42501',
    '%permission denied for function create_reservation_hold%',
    'TC-05.3.2-01: anon role is strictly denied execute on create_reservation_hold'
);

-- authenticated role cannot execute create_reservation_hold directly
set local role authenticated;
select throws_ok(
    $$ select public.create_reservation_hold('00000000-0000-0000-0000-0000000000a1'::uuid, 'dep-test-kandy-colombo-201', 1, 'quote-1', 10000, 'LKR', 'idemp-auth-attempt-01', 'hash-1') $$,
    '42501',
    '%permission denied for function create_reservation_hold%',
    'TC-05.3.2-02: authenticated role is strictly denied execute on create_reservation_hold'
);

-- Reset to privileged service session for transactional execution tests
reset role;

-- ============================================================================
-- 3. ATOMIC ALLOCATION & CAPACITY TESTS
-- ============================================================================

-- Test 1: Successful single hold
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-kandy-colombo-201',
        1,
        'quote-rail-2026-001',
        150000,
        'LKR',
        'idemp-key-alice-hold-001',
        'hash-alice-req-001',
        900
    ) ->> 'success')::boolean,
    true,
    'TC-05.3.2-03: successful single passenger hold returns success: true'
);

-- Verify held_capacity incremented to 1
select results_eq(
    $$ select held_capacity from public.departure_inventory where departure_id = 'dep-test-kandy-colombo-201' $$,
    $$ values (1) $$,
    'TC-05.3.2-04: inventory held_capacity incremented by 1'
);

-- Test 2: Successful multi-passenger hold (3 passengers)
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-kandy-colombo-201',
        3,
        'quote-rail-2026-002',
        450000,
        'LKR',
        'idemp-key-alice-hold-002',
        'hash-alice-req-002',
        900
    ) ->> 'success')::boolean,
    true,
    'TC-05.3.2-05: successful multi-passenger hold returns success: true'
);

-- Verify held_capacity incremented to 4 (1 + 3)
select results_eq(
    $$ select held_capacity from public.departure_inventory where departure_id = 'dep-test-kandy-colombo-201' $$,
    $$ values (4) $$,
    'TC-05.3.2-06: inventory held_capacity correctly incremented to 4'
);

-- Test 3: Insufficient capacity rejection (tight inventory has only 1 seat, request 2)
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-tight-inventory-01',
        2,
        'quote-tight-001',
        20000,
        'LKR',
        'idemp-tight-overflow-01',
        'hash-tight-overflow-01',
        900
    ) ->> 'success')::boolean,
    false,
    'TC-05.3.2-07: insufficient capacity returns success: false'
);

-- Verify capacity unchanged after rejection
select results_eq(
    $$ select held_capacity from public.departure_inventory where departure_id = 'dep-test-tight-inventory-01' $$,
    $$ values (4) $$,
    'TC-05.3.2-08: held_capacity strictly unchanged following insufficient inventory rejection'
);

-- Test 4: Rejection of unverified sample_data departure
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-sample-corridor-404',
        1,
        'quote-sample-01',
        10000,
        'LKR',
        'idemp-sample-rejection-01',
        'hash-sample-req-01',
        900
    ) ->> 'success')::boolean,
    false,
    'TC-05.3.2-09: sample_data departure rejected from reservation engine'
);

-- ============================================================================
-- 4. IDEMPOTENCY REPLAY & CONFLICT TESTS
-- ============================================================================

-- Test 5: Identical request replay returns is_idempotent_replay: true and same booking
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-kandy-colombo-201',
        1,
        'quote-rail-2026-001',
        150000,
        'LKR',
        'idemp-key-alice-hold-001', -- Reusing existing key with identical payload
        'hash-alice-req-001',
        900
    ) ->> 'is_idempotent_replay')::boolean,
    true,
    'TC-05.3.2-10: identical retry returns is_idempotent_replay: true'
);

-- Capacity must NOT have incremented on idempotent retry (still 4)
select results_eq(
    $$ select held_capacity from public.departure_inventory where departure_id = 'dep-test-kandy-colombo-201' $$,
    $$ values (4) $$,
    'TC-05.3.2-11: capacity invariant strictly preserved without duplicate allocation on idempotent retry'
);

-- Test 6: Same key with conflicting request hash returns IDEMPOTENCY_CONFLICT
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000a1'::uuid,
        'dep-test-kandy-colombo-201',
        2, -- Changed passenger count with same idempotency key!
        'quote-rail-2026-001',
        300000,
        'LKR',
        'idemp-key-alice-hold-001',
        'hash-conflicting-payload-999',
        900
    ) ->> 'error_code'),
    'IDEMPOTENCY_CONFLICT',
    'TC-05.3.2-12: conflicting request parameters with same idempotency key rejected with IDEMPOTENCY_CONFLICT'
);

-- Test 7: User scoping - Bob can use the same idempotency key as Alice without collision
select is(
    (public.create_reservation_hold(
        '00000000-0000-0000-0000-0000000000b2'::uuid, -- Bob's UUID
        'dep-test-kandy-colombo-201',
        1,
        'quote-rail-2026-001',
        150000,
        'LKR',
        'idemp-key-alice-hold-001', -- Same key name, distinct user!
        'hash-bob-req-001',
        900
    ) ->> 'success')::boolean,
    true,
    'TC-05.3.2-13: idempotency keys are strictly scoped per user_id'
);

-- Verify Bob's hold allocated 1 seat (4 + 1 = 5)
select results_eq(
    $$ select held_capacity from public.departure_inventory where departure_id = 'dep-test-kandy-colombo-201' $$,
    $$ values (5) $$,
    'TC-05.3.2-14: distinct user hold correctly incremented held_capacity to 5'
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & OWNERSHIP TESTS
-- ============================================================================

-- Alice can read own bookings via RLS
set local role authenticated;
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-0000000000a1';

select is(
    (select count(*)::integer from public.booking_reservations where user_id = '00000000-0000-0000-0000-0000000000a1'),
    2,
    'TC-05.3.2-15: Alice can read her own 2 bookings via RLS'
);

-- Alice CANNOT read Bob's bookings (returns 0)
select is(
    (select count(*)::integer from public.booking_reservations where user_id = '00000000-0000-0000-0000-0000000000b2'),
    0,
    'TC-05.3.2-16: Alice cannot read Bob bookings via RLS (cross-user isolation)'
);

-- Direct client INSERT on booking_reservations is denied
select throws_ok(
    $$ insert into public.booking_reservations (user_id, departure_id, passenger_count, fare_quote_id, total_amount_minor_units, currency, status, idempotency_key) values ('00000000-0000-0000-0000-0000000000a1', 'dep-test-kandy-colombo-201', 1, 'q', 100, 'LKR', 'confirmed', 'direct-insert') $$,
    '42501',
    '%permission denied for table booking_reservations%',
    'TC-05.3.2-17: direct client INSERT on booking_reservations is strictly denied'
);

-- Direct client UPDATE on departure_inventory is denied
select throws_ok(
    $$ update public.departure_inventory set held_capacity = 0 where departure_id = 'dep-test-kandy-colombo-201' $$,
    '42501',
    '%permission denied for table departure_inventory%',
    'TC-05.3.2-18: direct client UPDATE on departure_inventory is strictly denied'
);

-- Direct client UPDATE on bookable_departures is denied
select throws_ok(
    $$ update public.bookable_departures set bookable_status = 'sold_out' where id = 'dep-test-kandy-colombo-201' $$,
    '42501',
    '%permission denied for table bookable_departures%',
    'TC-05.3.2-19: direct client UPDATE on bookable_departures is strictly denied'
);

-- Direct client INSERT on booking_idempotency_records is denied
select throws_ok(
    $$ insert into public.booking_idempotency_records (user_id, idempotency_key, operation_type, request_hash) values ('00000000-0000-0000-0000-0000000000a1', 'idemp-hack', 'reserve', 'hash') $$,
    '42501',
    '%permission denied for table booking_idempotency_records%',
    'TC-05.3.2-20: direct client INSERT on booking_idempotency_records is strictly denied'
);

reset role;

-- Additional verification: total capacity invariant
select is(
    (select (allocated_capacity + held_capacity <= total_capacity) from public.departure_inventory where departure_id = 'dep-test-kandy-colombo-201'),
    true,
    'TC-05.3.2-21: capacity invariant strictly preserved ((allocated + held) <= total)'
);

select * from finish();

rollback;
