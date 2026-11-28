/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.3: Booking Database, RLS & Transaction Security Verification
 *
 * Verifies:
 * 1. PostgreSQL Booking Foundation Migration & Schema Declarations (AST & Static Verification)
 * 2. pgTAP SQL Test Infrastructure Integrity (`supabase/tests/feature_05_1_booking_security.test.sql`)
 * 3. Row Level Security (RLS) Policies on Departures, Inventory, Bookings, and Idempotency Records
 * 4. Zero Direct Client Write Access to Authoritative Booking State
 * 5. Database Constraints (Capacity bounds, passenger limits, minor-unit money, ISO 4217, status)
 * 6. Idempotency Key Scoping and Cross-User Data Isolation
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Feature 05.1.3 — Booking Database, RLS & Transaction Security Verification', () => {
  const rootDir = path.resolve(__dirname, '../../../../../');
  const migrationPath = path.join(
    rootDir,
    'supabase/migrations/20261126160000_waymark_booking_foundation.sql'
  );
  const rlsTestPath = path.join(
    rootDir,
    'supabase/tests/feature_05_1_booking_security.test.sql'
  );
  const atomicHoldMigrationPath = path.join(
    rootDir,
    'supabase/migrations/20261128100000_waymark_atomic_reservation_holds.sql'
  );
  const atomicHoldTestPath = path.join(
    rootDir,
    'supabase/tests/feature_05_3_atomic_reservation_holds.test.sql'
  );

  let migrationSql: string;
  let rlsTestSql: string;
  let atomicHoldMigrationSql: string;
  let atomicHoldTestSql: string;

  beforeAll(() => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rlsTestPath)).toBe(true);
    expect(fs.existsSync(atomicHoldMigrationPath)).toBe(true);
    expect(fs.existsSync(atomicHoldTestPath)).toBe(true);
    migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    rlsTestSql = fs.readFileSync(rlsTestPath, 'utf-8');
    atomicHoldMigrationSql = fs.readFileSync(atomicHoldMigrationPath, 'utf-8');
    atomicHoldTestSql = fs.readFileSync(atomicHoldTestPath, 'utf-8');
  });

  // ==========================================================================
  // SECTION 1: DATABASE MIGRATION & RLS POLICIES AUDIT
  // ==========================================================================
  describe('1. Database Migration & RLS Security Audit', () => {
    it('TC-05.1.3-01: verifies RLS is strictly enabled on all booking tables', () => {
      expect(migrationSql).toMatch(/alter table public\.bookable_departures enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.departure_inventory enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.booking_reservations enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.booking_idempotency_records enable row level security;/i);
    });

    it('TC-05.1.3-02: revokes all default permissions from public and anon roles on all booking tables', () => {
      expect(migrationSql).toMatch(/revoke all on public\.bookable_departures from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.departure_inventory from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.booking_reservations from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.booking_idempotency_records from public, anon;/i);
    });

    it('TC-05.1.3-03: grants select strictly on public catalog tables to anon and authenticated', () => {
      expect(migrationSql).toMatch(/grant select on public\.bookable_departures to anon, authenticated;/i);
      expect(migrationSql).toMatch(/grant select on public\.departure_inventory to anon, authenticated;/i);
    });

    it('TC-05.1.3-04: grants select on private booking tables strictly to authenticated role', () => {
      expect(migrationSql).toMatch(/grant select on public\.booking_reservations to authenticated;/i);
      expect(migrationSql).toMatch(/grant select on public\.booking_idempotency_records to authenticated;/i);
    });

    it('TC-05.1.3-05: enforces auth.uid() ownership predicate on booking_reservations', () => {
      expect(migrationSql).toMatch(/create policy "Authenticated users can read own bookings"/i);
      expect(migrationSql).toMatch(/using \(auth\.uid\(\) = user_id\)/i);
    });

    it('TC-05.1.3-06: forbids direct client INSERT, UPDATE, DELETE grants on booking_reservations', () => {
      expect(migrationSql).not.toMatch(/grant insert on public\.booking_reservations/i);
      expect(migrationSql).not.toMatch(/grant update on public\.booking_reservations/i);
      expect(migrationSql).not.toMatch(/grant delete on public\.booking_reservations/i);
    });

    it('TC-05.1.3-07: forbids direct client INSERT, UPDATE, DELETE grants on departure_inventory', () => {
      expect(migrationSql).not.toMatch(/grant insert on public\.departure_inventory/i);
      expect(migrationSql).not.toMatch(/grant update on public\.departure_inventory/i);
      expect(migrationSql).not.toMatch(/grant delete on public\.departure_inventory/i);
    });
  });

  // ==========================================================================
  // SECTION 2: DATABASE INTEGRITY CONSTRAINTS AUDIT
  // ==========================================================================
  describe('2. Database Integrity Constraints Audit', () => {
    it('TC-05.1.3-08: enforces non-negative capacity and upper-bound constraints on departure_inventory', () => {
      expect(migrationSql).toMatch(/total_capacity integer not null check \(total_capacity >= 0\)/i);
      expect(migrationSql).toMatch(/allocated_capacity integer not null default 0 check \(allocated_capacity >= 0\)/i);
      expect(migrationSql).toMatch(/held_capacity integer not null default 0 check \(held_capacity >= 0\)/i);
      expect(migrationSql).toMatch(/constraint chk_inventory_capacity_bounds check \(\(allocated_capacity \+ held_capacity\) <= total_capacity\)/i);
    });

    it('TC-05.1.3-09: enforces passenger count bounds (1 to 9) on booking_reservations', () => {
      expect(migrationSql).toMatch(/passenger_count integer not null check \(passenger_count >= 1 and passenger_count <= 9\)/i);
    });

    it('TC-05.1.3-10: enforces non-negative minor-unit monetary amount on booking_reservations', () => {
      expect(migrationSql).toMatch(/total_amount_minor_units bigint not null check \(total_amount_minor_units >= 0\)/i);
    });

    it('TC-05.1.3-11: enforces supported ISO 4217 currencies on booking_reservations', () => {
      expect(migrationSql).toMatch(/currency in \('USD', 'EUR', 'GBP', 'LKR', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD'\)/i);
    });

    it('TC-05.1.3-12: enforces comprehensive booking state machine statuses on booking_reservations', () => {
      expect(migrationSql).toMatch(/'draft'/);
      expect(migrationSql).toMatch(/'pending_inventory'/);
      expect(migrationSql).toMatch(/'held'/);
      expect(migrationSql).toMatch(/'awaiting_payment'/);
      expect(migrationSql).toMatch(/'confirmed'/);
      expect(migrationSql).toMatch(/'ticket_issued'/);
      expect(migrationSql).toMatch(/'expired'/);
      expect(migrationSql).toMatch(/'cancelled'/);
      expect(migrationSql).toMatch(/'payment_failed'/);
      expect(migrationSql).toMatch(/'failed'/);
      expect(migrationSql).toMatch(/'refund_pending'/);
      expect(migrationSql).toMatch(/'refunded'/);
    });

    it('TC-05.1.3-13: enforces unique idempotency key scoped to user on booking_reservations', () => {
      expect(migrationSql).toMatch(/create unique index if not exists idx_booking_reservations_user_idempotency\s+on public\.booking_reservations \(user_id, idempotency_key\);/i);
    });

    it('TC-05.1.3-14: enforces arrival time order constraint on bookable_departures', () => {
      expect(migrationSql).toMatch(/constraint chk_departure_arrival_order check \(arrival_time is null or arrival_time >= departure_time\)/i);
    });
  });

  // ==========================================================================
  // SECTION 3: PGTAP TEST SUITE AUDIT
  // ==========================================================================
  describe('3. pgTAP Test Infrastructure Audit', () => {
    it('TC-05.1.3-15: verifies pgTAP test file executes within a transaction with rollback', () => {
      expect(rlsTestSql).toMatch(/^begin;/m);
      expect(rlsTestSql).toMatch(/rollback;$/m);
    });

    it('TC-05.1.3-16: verifies anonymous access is denied for private bookings and idempotency records', () => {
      expect(rlsTestSql).toMatch(/RLS-03 \[Bookings\]: Anonymous caller cannot read any booking reservations/i);
      expect(rlsTestSql).toMatch(/RLS-04 \[Idempotency\]: Anonymous caller cannot read any idempotency records/i);
      expect(rlsTestSql).toMatch(/RLS-05 \[Bookings\]: Anonymous caller cannot insert booking records/i);
    });

    it('TC-05.1.3-17: verifies cross-user isolation prevents reading or modifying another user bookings', () => {
      expect(rlsTestSql).toMatch(/RLS-07 \[Cross-User Isolation\]: Alice cannot read Bob''s booking reservation/i);
      expect(rlsTestSql).toMatch(/RLS-08 \[Cross-User Isolation\]: Alice cannot read Bob''s idempotency record/i);
      expect(rlsTestSql).toMatch(/RLS-09 \[Write Defense\]: Direct client insert to booking_reservations is rejected/i);
      expect(rlsTestSql).toMatch(/RLS-10 \[Write Defense\]: Direct client update on booking_reservations is rejected/i);
      expect(rlsTestSql).toMatch(/RLS-11 \[Write Defense\]: Direct client delete on booking_reservations is rejected/i);
    });

    it('TC-05.1.3-18: verifies inventory bounds and negative capacity checks are tested', () => {
      expect(rlsTestSql).toMatch(/CONST-01 \[Inventory Bounds\]: Rejects negative total capacity/i);
      expect(rlsTestSql).toMatch(/CONST-02 \[Inventory Bounds\]: Rejects allocated \+ held capacity exceeding total capacity/i);
      expect(rlsTestSql).toMatch(/CONST-03 \[Passenger Count\]: Rejects passenger count below minimum \(0\)/i);
      expect(rlsTestSql).toMatch(/CONST-04 \[Passenger Count\]: Rejects passenger count above maximum \(10\)/i);
      expect(rlsTestSql).toMatch(/CONST-05 \[Monetary Bounds\]: Rejects negative monetary amounts/i);
    });
  });

  // ==========================================================================
  // SECTION 4: TASK 05.3.2 ATOMIC RESERVATION HOLD RPC & HARDENING AUDIT
  // ==========================================================================
  describe('4. Task 05.3.2 Atomic Reservation Hold Migration & Security Audit', () => {
    it('TC-05.3.2-DB-01: verifies create_reservation_hold function uses security definer with safe search_path', () => {
      expect(atomicHoldMigrationSql).toMatch(/create or replace function public\.create_reservation_hold/i);
      expect(atomicHoldMigrationSql).toMatch(/security definer/i);
      expect(atomicHoldMigrationSql).toMatch(/set search_path = public, pg_temp/i);
    });

    it('TC-05.3.2-DB-02: verifies EXECUTE privilege is strictly revoked from public, anon, and authenticated', () => {
      expect(atomicHoldMigrationSql).toMatch(
        /revoke all on function public\.create_reservation_hold\([\s\S]*?\) from public, anon, authenticated;/i
      );
    });

    it('TC-05.3.2-DB-03: verifies EXECUTE privilege is granted strictly to service_role', () => {
      expect(atomicHoldMigrationSql).toMatch(
        /grant execute on function public\.create_reservation_hold\([\s\S]*?\) to service_role;/i
      );
    });

    it('TC-05.3.2-DB-04: verifies row-level inventory locking via SELECT ... FOR UPDATE', () => {
      expect(atomicHoldMigrationSql).toMatch(/select \* into v_inventory\s+from public\.departure_inventory\s+where departure_id = p_departure_id\s+for update;/i);
    });

    it('TC-05.3.2-DB-05: verifies capacity invariant enforcement check in plpgsql function', () => {
      expect(atomicHoldMigrationSql).toMatch(/v_available := v_inventory\.total_capacity - v_inventory\.allocated_capacity - v_inventory\.held_capacity;/i);
      expect(atomicHoldMigrationSql).toMatch(/if v_available < p_passenger_count then/i);
      expect(atomicHoldMigrationSql).toMatch(/'error_code', 'INVENTORY_UNAVAILABLE'/i);
    });

    it('TC-05.3.2-DB-06: verifies transactional idempotency replay check in plpgsql function', () => {
      expect(atomicHoldMigrationSql).toMatch(/select \* into v_existing_idempotency\s+from public\.booking_idempotency_records/i);
      expect(atomicHoldMigrationSql).toMatch(/if v_existing_idempotency\.request_hash = p_request_hash then/i);
      expect(atomicHoldMigrationSql).toMatch(/'is_idempotent_replay', true/i);
      expect(atomicHoldMigrationSql).toMatch(/'error_code', 'IDEMPOTENCY_CONFLICT'/i);
    });

    it('TC-05.3.2-DB-07: verifies unverified / sample_data departure rejection at database layer', () => {
      expect(atomicHoldMigrationSql).toMatch(/if v_departure\.inventory_source != 'operator_verified' then/i);
      expect(atomicHoldMigrationSql).toMatch(/'error_code', 'INVENTORY_UNAVAILABLE'/i);
    });

    it('TC-05.3.2-DB-08: verifies pgTAP atomic hold test suite executes in transaction with rollback and 32 assertions', () => {
      expect(atomicHoldTestSql).toMatch(/^begin;/m);
      expect(atomicHoldTestSql).toMatch(/select plan\(32\);/i);
      expect(atomicHoldTestSql).toMatch(/rollback;$/m);
    });
  });
});
