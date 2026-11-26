-- ============================================================================
-- Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
-- Migration: 20261126160000_waymark_booking_foundation.sql
-- Description: Establishes public.bookable_departures, public.departure_inventory,
--              public.booking_reservations, and public.booking_idempotency_records
--              with strict Row Level Security (RLS) and PostgreSQL integrity constraints.
-- ============================================================================

-- 1. BOOKABLE DEPARTURES TABLE
-- Catalog of operational transit departures.
-- Managed exclusively by backend / inventory sync. Mobile clients have read-only access.
create table if not exists public.bookable_departures (
    id varchar(64) primary key,
    operator_id varchar(64) not null,
    origin_node_id varchar(64) not null,
    origin_name varchar(100) not null,
    destination_node_id varchar(64) not null,
    destination_name varchar(100) not null,
    departure_time timestamptz not null,
    arrival_time timestamptz,
    service_identifier varchar(64) not null,
    inventory_source varchar(32) not null check (inventory_source in ('sample_data', 'operator_verified', 'provider_unavailable')),
    bookable_status varchar(32) not null default 'unavailable' check (bookable_status in ('available', 'sold_out', 'cancelled', 'unavailable')),
    transit_mode varchar(32) not null default 'transit',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_departure_arrival_order check (arrival_time is null or arrival_time >= departure_time)
);

create index if not exists idx_bookable_departures_corridor
    on public.bookable_departures (origin_node_id, destination_node_id, departure_time);

create index if not exists idx_bookable_departures_status
    on public.bookable_departures (bookable_status, departure_time);

drop trigger if exists set_bookable_departures_updated_at on public.bookable_departures;
create trigger set_bookable_departures_updated_at
    before update on public.bookable_departures
    for each row
    execute function public.handle_updated_at();

-- 2. DEPARTURE INVENTORY TABLE
-- Real-time capacity and allocation tracking for verified departures.
-- Prevents overbooking, negative capacity, and negative reservations at database level.
create table if not exists public.departure_inventory (
    departure_id varchar(64) primary key references public.bookable_departures(id) on delete cascade,
    total_capacity integer not null check (total_capacity >= 0),
    allocated_capacity integer not null default 0 check (allocated_capacity >= 0),
    held_capacity integer not null default 0 check (held_capacity >= 0),
    version integer not null default 1 check (version >= 1),
    last_observed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_inventory_capacity_bounds check ((allocated_capacity + held_capacity) <= total_capacity)
);

drop trigger if exists set_departure_inventory_updated_at on public.departure_inventory;
create trigger set_departure_inventory_updated_at
    before update on public.departure_inventory
    for each row
    execute function public.handle_updated_at();

-- 3. BOOKING RESERVATIONS TABLE
-- Authoritative user reservations.
-- Private records governed by strict auth.uid() ownership RLS.
create table if not exists public.booking_reservations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    departure_id varchar(64) not null references public.bookable_departures(id) on delete restrict,
    passenger_count integer not null check (passenger_count >= 1 and passenger_count <= 9),
    fare_quote_id varchar(64) not null,
    total_amount_minor_units bigint not null check (total_amount_minor_units >= 0),
    currency varchar(3) not null check (currency in ('USD', 'EUR', 'GBP', 'LKR', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD')),
    status varchar(32) not null default 'draft' check (status in (
        'draft',
        'pending_inventory',
        'held',
        'awaiting_payment',
        'confirmed',
        'ticket_issued',
        'expired',
        'cancelled',
        'payment_failed',
        'failed',
        'refund_pending',
        'refunded'
    )),
    idempotency_key varchar(128) not null,
    hold_expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for efficient lookup
create index if not exists idx_booking_reservations_user_id
    on public.booking_reservations (user_id, created_at desc);

create index if not exists idx_booking_reservations_departure
    on public.booking_reservations (departure_id, status);

-- Unique idempotency key scoped to user to prevent double-reservation
create unique index if not exists idx_booking_reservations_user_idempotency
    on public.booking_reservations (user_id, idempotency_key);

drop trigger if exists set_booking_reservations_updated_at on public.booking_reservations;
create trigger set_booking_reservations_updated_at
    before update on public.booking_reservations
    for each row
    execute function public.handle_updated_at();

-- 4. BOOKING IDEMPOTENCY RECORDS TABLE
-- Operation-level idempotency ledger for financial & reservation calls.
create table if not exists public.booking_idempotency_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    idempotency_key varchar(128) not null,
    operation_type varchar(32) not null check (operation_type in ('reserve', 'cancel', 'quote')),
    request_hash varchar(64) not null,
    response_payload jsonb,
    status varchar(20) not null default 'pending' check (status in ('pending', 'completed', 'failed')),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '24 hours'),
    constraint uq_idempotency_user_op_key unique (user_id, operation_type, idempotency_key)
);

create index if not exists idx_booking_idempotency_lookup
    on public.booking_idempotency_records (user_id, idempotency_key);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ============================================================================

-- A. Bookable Departures (Public Catalog)
alter table public.bookable_departures enable row level security;
revoke all on public.bookable_departures from public, anon;
grant select on public.bookable_departures to anon, authenticated;

create policy "Allow read access to operational departures for all callers"
    on public.bookable_departures
    for select
    using (true);

-- No direct client inserts/updates/deletes on departures catalog
-- (Writes are strictly reserved for service_role / backend migrations)

-- B. Departure Inventory
alter table public.departure_inventory enable row level security;
revoke all on public.departure_inventory from public, anon;
grant select on public.departure_inventory to anon, authenticated;

create policy "Allow read access to departure inventory for all callers"
    on public.departure_inventory
    for select
    using (true);

-- No direct client writes to departure inventory
-- (Inventory mutations must occur through server-side atomic transactions)

-- C. Booking Reservations (Strict Private Ownership)
alter table public.booking_reservations enable row level security;
revoke all on public.booking_reservations from public, anon;
grant select on public.booking_reservations to authenticated;

-- Users may select ONLY their own bookings
create policy "Authenticated users can read own bookings"
    on public.booking_reservations
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Explicitly deny direct client inserts/updates/deletes.
-- Client cannot directly insert bookings to forge price, status, or tickets.
-- Privileged mutations occur via trusted server RPC / Edge Functions.

-- D. Booking Idempotency Records
alter table public.booking_idempotency_records enable row level security;
revoke all on public.booking_idempotency_records from public, anon;
grant select on public.booking_idempotency_records to authenticated;

create policy "Authenticated users can read own idempotency records"
    on public.booking_idempotency_records
    for select
    to authenticated
    using (auth.uid() = user_id);
