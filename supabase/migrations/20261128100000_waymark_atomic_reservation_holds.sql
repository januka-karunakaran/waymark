-- ============================================================================
-- Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
-- Migration: 20261128100000_waymark_atomic_reservation_holds.sql
-- Description: Implements atomic PostgreSQL transactional reservation hold procedure
--              `public.create_reservation_hold` with row-level locking (SELECT ... FOR UPDATE),
--              strict capacity invariants, transactional idempotency coordination,
--              and restricted service_role execution privileges.
-- ============================================================================

-- 1. ATOMIC RESERVATION HOLD TRANSACTION FUNCTION
-- Atomically locks inventory row, verifies capacity, increments held_capacity,
-- persists held reservation, and records idempotency outcome within ONE transaction.
create or replace function public.create_reservation_hold(
    p_user_id uuid,
    p_departure_id varchar(64),
    p_passenger_count integer,
    p_fare_quote_id varchar(64),
    p_total_amount_minor_units bigint,
    p_currency varchar(3),
    p_idempotency_key varchar(128),
    p_request_hash varchar(64),
    p_hold_duration_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_existing_idempotency public.booking_idempotency_records%rowtype;
    v_departure public.bookable_departures%rowtype;
    v_inventory public.departure_inventory%rowtype;
    v_available integer;
    v_hold_expires timestamptz;
    v_booking public.booking_reservations%rowtype;
    v_result jsonb;
begin
    -- 1. Input parameter validation
    if p_user_id is null then
        return jsonb_build_object(
            'success', false,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'User identifier is required.'
        );
    end if;

    if p_passenger_count is null or p_passenger_count < 1 or p_passenger_count > 9 then
        return jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_REQUEST',
            'error_message', 'Passenger count must be an integer between 1 and 9.'
        );
    end if;

    if p_total_amount_minor_units is null or p_total_amount_minor_units < 0 then
        return jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_REQUEST',
            'error_message', 'Total amount in minor units must be non-negative.'
        );
    end if;

    if p_currency is null or p_currency not in ('USD', 'EUR', 'GBP', 'LKR', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD') then
        return jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_REQUEST',
            'error_message', 'Invalid or unsupported currency code.'
        );
    end if;

    if p_idempotency_key is null or length(p_idempotency_key) < 16 or length(p_idempotency_key) > 128 then
        return jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_REQUEST',
            'error_message', 'Idempotency key must be between 16 and 128 characters.'
        );
    end if;

    -- 2. Idempotency Check (Scoped to user_id, operation_type = 'reserve', idempotency_key)
    select * into v_existing_idempotency
    from public.booking_idempotency_records
    where user_id = p_user_id
      and operation_type = 'reserve'
      and idempotency_key = p_idempotency_key
    for update;

    if found then
        if v_existing_idempotency.request_hash = p_request_hash then
            if v_existing_idempotency.status = 'completed' and v_existing_idempotency.response_payload is not null then
                return jsonb_build_object(
                    'success', true,
                    'is_idempotent_replay', true,
                    'booking', v_existing_idempotency.response_payload
                );
            elsif v_existing_idempotency.status = 'pending' then
                return jsonb_build_object(
                    'success', false,
                    'error_code', 'IDEMPOTENCY_CONFLICT',
                    'error_message', 'A concurrent reservation request with this idempotency key is already in progress.'
                );
            end if;
        else
            return jsonb_build_object(
                'success', false,
                'error_code', 'IDEMPOTENCY_CONFLICT',
                'error_message', 'Idempotency key was previously used with different request parameters.'
            );
        end if;
    else
        -- Record initial pending state in idempotency ledger
        insert into public.booking_idempotency_records (
            user_id,
            idempotency_key,
            operation_type,
            request_hash,
            status,
            created_at,
            expires_at
        ) values (
            p_user_id,
            p_idempotency_key,
            'reserve',
            p_request_hash,
            'pending',
            now(),
            now() + interval '24 hours'
        );
    end if;

    -- 3. Verify Departure Exists and is Verified
    select * into v_departure
    from public.bookable_departures
    where id = p_departure_id;

    if not found then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'BOOKING_NOT_FOUND',
            'error_message', 'Departure not found in catalog.'
        );
    end if;

    if v_departure.inventory_source != 'operator_verified' then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'INVENTORY_UNAVAILABLE',
            'error_message', 'Only operator_verified departures can be reserved. Sample data is prohibited.'
        );
    end if;

    if v_departure.bookable_status != 'available' then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'INVENTORY_UNAVAILABLE',
            'error_message', 'Departure is not currently bookable.'
        );
    end if;

    if v_departure.departure_time <= now() then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'INVENTORY_UNAVAILABLE',
            'error_message', 'Departure has already passed.'
        );
    end if;

    -- 4. Lock Departure Inventory Row & Verify Capacity Invariant
    select * into v_inventory
    from public.departure_inventory
    where departure_id = p_departure_id
    for update;

    if not found then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'INVENTORY_UNAVAILABLE',
            'error_message', 'Inventory capacity record not found for departure.'
        );
    end if;

    v_available := v_inventory.total_capacity - v_inventory.allocated_capacity - v_inventory.held_capacity;

    if v_available < p_passenger_count then
        update public.booking_idempotency_records
        set status = 'failed'
        where user_id = p_user_id and operation_type = 'reserve' and idempotency_key = p_idempotency_key;

        return jsonb_build_object(
            'success', false,
            'error_code', 'INVENTORY_UNAVAILABLE',
            'error_message', 'Insufficient inventory capacity to reserve requested passenger count.'
        );
    end if;

    -- 5. Atomically increment held_capacity
    update public.departure_inventory
    set held_capacity = held_capacity + p_passenger_count,
        version = version + 1,
        updated_at = now()
    where departure_id = p_departure_id;

    -- 6. Insert booking reservation in 'held' status with server-generated UUID
    v_hold_expires := now() + (p_hold_duration_seconds || ' seconds')::interval;

    insert into public.booking_reservations (
        id,
        user_id,
        departure_id,
        passenger_count,
        fare_quote_id,
        total_amount_minor_units,
        currency,
        status,
        idempotency_key,
        hold_expires_at,
        created_at,
        updated_at
    ) values (
        gen_random_uuid(),
        p_user_id,
        p_departure_id,
        p_passenger_count,
        p_fare_quote_id,
        p_total_amount_minor_units,
        p_currency,
        'held',
        p_idempotency_key,
        v_hold_expires,
        now(),
        now()
    )
    returning * into v_booking;

    -- Format result payload
    v_result := jsonb_build_object(
        'id', v_booking.id,
        'userId', v_booking.user_id,
        'departureId', v_booking.departure_id,
        'passengerCount', v_booking.passenger_count,
        'fareQuoteId', v_booking.fare_quote_id,
        'totalAmountMinorUnits', v_booking.total_amount_minor_units,
        'currency', v_booking.currency,
        'status', v_booking.status,
        'idempotencyKey', v_booking.idempotency_key,
        'holdExpiresAt', to_char(v_booking.hold_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'createdAt', to_char(v_booking.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'updatedAt', to_char(v_booking.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );

    -- 7. Persist committed idempotency outcome
    update public.booking_idempotency_records
    set status = 'completed',
        response_payload = v_result
    where user_id = p_user_id
      and operation_type = 'reserve'
      and idempotency_key = p_idempotency_key;

    return jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'booking', v_result
    );
end;
$$;

-- 2. PRIVILEGE HARDENING & ACCESS CONTROL
-- Revoke all privileges from public, anon, and authenticated roles.
-- Grant execute strictly to service_role (the trusted backend boundary).
revoke all on function public.create_reservation_hold(
    uuid, varchar, integer, varchar, bigint, varchar, varchar, varchar, integer
) from public, anon, authenticated;

grant execute on function public.create_reservation_hold(
    uuid, varchar, integer, varchar, bigint, varchar, varchar, varchar, integer
) to service_role;
