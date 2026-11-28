/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.2: Database Reservation Transaction Coordinator
 *
 * Requirements:
 * - Eliminates false-success in-memory path in production.
 * - Only committed PostgreSQL transactions can produce a successful 'held' reservation.
 * - Derives booking ID strictly from committed database state (PostgreSQL UUID), never from client strings.
 * - Manages atomic inventory holds, capacity invariant verification, and idempotency coordination.
 */

import { AuthoritativeBookingRecord } from '../types';
import { BookingErrorCode } from '../../../../mobile/src/features/booking/services/BookingService';

export interface DatabaseReservationParams {
  userId: string;
  departureId: string;
  passengerCount: number;
  fareQuoteId: string;
  totalAmountMinorUnits: number;
  currency: string;
  idempotencyKey: string;
  requestHash: string;
  holdDurationSeconds?: number;
}

export interface DatabaseReservationOutcome {
  success: boolean;
  booking?: AuthoritativeBookingRecord;
  isIdempotentReplay?: boolean;
  errorCode?: BookingErrorCode;
  errorMessage?: string;
}

export interface ReservationTransactionCoordinator {
  isConfigured(): boolean;
  executeReservationHold(params: DatabaseReservationParams): Promise<DatabaseReservationOutcome>;
}

/**
 * Production Default Safe Fallback:
 * If the database transaction engine is not configured, strictly fails closed with NOT_CONFIGURED.
 * Prevents any uncommitted or in-memory reservations in production.
 */
export class UnconfiguredReservationTransactionCoordinator implements ReservationTransactionCoordinator {
  isConfigured(): boolean {
    return false;
  }

  async executeReservationHold(_params: DatabaseReservationParams): Promise<DatabaseReservationOutcome> {
    return {
      success: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Database reservation transaction engine is not configured. Live capacity allocation is unavailable.'
    };
  }
}

/**
 * Production Supabase PostgreSQL RPC Transaction Coordinator:
 * Invokes the restricted `public.create_reservation_hold` database function via service_role client.
 */
// Minimal interface for Supabase RPC execution
export interface MinimalSupabaseRpcClient {
  rpc(fn: string, params: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
}

export class SupabaseRpcReservationTransactionCoordinator implements ReservationTransactionCoordinator {
  private serviceClient: MinimalSupabaseRpcClient;

  constructor(serviceClient: MinimalSupabaseRpcClient) {
    this.serviceClient = serviceClient;
  }

  isConfigured(): boolean {
    return Boolean(this.serviceClient);
  }

  async executeReservationHold(params: DatabaseReservationParams): Promise<DatabaseReservationOutcome> {
    try {
      const { data, error } = await this.serviceClient.rpc('create_reservation_hold', {
        p_user_id: params.userId,
        p_departure_id: params.departureId,
        p_passenger_count: params.passengerCount,
        p_fare_quote_id: params.fareQuoteId,
        p_total_amount_minor_units: params.totalAmountMinorUnits,
        p_currency: params.currency,
        p_idempotency_key: params.idempotencyKey,
        p_request_hash: params.requestHash,
        p_hold_duration_seconds: params.holdDurationSeconds ?? 900
      });

      if (error) {
        return {
          success: false,
          errorCode: 'SERVICE_UNAVAILABLE',
          errorMessage: `Database transaction execution failed: ${error.message}`
        };
      }

      if (!data || typeof data !== 'object') {
        return {
          success: false,
          errorCode: 'SERVICE_UNAVAILABLE',
          errorMessage: 'Invalid response from reservation transaction procedure.'
        };
      }

      const rpcResult = data as {
        success: boolean;
        booking?: AuthoritativeBookingRecord;
        is_idempotent_replay?: boolean;
        error_code?: BookingErrorCode;
        error_message?: string;
      };

      if (!rpcResult.success) {
        return {
          success: false,
          errorCode: rpcResult.error_code || 'INVENTORY_UNAVAILABLE',
          errorMessage: rpcResult.error_message || 'Reservation hold could not be allocated.'
        };
      }

      return {
        success: true,
        booking: rpcResult.booking,
        isIdempotentReplay: Boolean(rpcResult.is_idempotent_replay)
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown database transaction error.';
      return {
        success: false,
        errorCode: 'SERVICE_UNAVAILABLE',
        errorMessage: msg
      };
    }
  }
}

/**
 * Isolated Test Double Transaction Coordinator:
 * Strictly for unit/contract tests where PostgreSQL is not available in local test runner.
 * Accurately models:
 * 1. Atomic capacity locking & bounds (total - allocated - held >= requested)
 * 2. Idempotency checking, hashing, replay detection, and conflict rejection
 * 3. PostgreSQL UUID generation format
 * 4. Transactional rollback simulation on capacity/database errors
 *
 * NOTE: MUST NOT BE SELECTED IN PRODUCTION.
 */
export class TestDoubleReservationCoordinator implements ReservationTransactionCoordinator {
  private inventories: Map<string, { totalCapacity: number; allocatedCapacity: number; heldCapacity: number }>;
  private idempotencyLedger: Map<string, { userId: string; requestHash: string; status: string; booking: AuthoritativeBookingRecord }>;
  private bookings: Map<string, AuthoritativeBookingRecord>;
  private simulateDbFailure: boolean;

  constructor(options?: {
    initialInventories?: Record<string, { totalCapacity: number; allocatedCapacity: number; heldCapacity: number }>;
    simulateDbFailure?: boolean;
  }) {
    this.inventories = new Map();
    if (options?.initialInventories) {
      for (const [depId, inv] of Object.entries(options.initialInventories)) {
        this.inventories.set(depId, { ...inv });
      }
    }
    this.idempotencyLedger = new Map();
    this.bookings = new Map();
    this.simulateDbFailure = Boolean(options?.simulateDbFailure);
  }

  isConfigured(): boolean {
    return true;
  }

  setSimulateDbFailure(val: boolean): void {
    this.simulateDbFailure = val;
  }

  getHeldCapacity(departureId: string): number {
    return this.inventories.get(departureId)?.heldCapacity ?? 0;
  }

  getInventory(departureId: string): { totalCapacity: number; allocatedCapacity: number; heldCapacity: number } | undefined {
    const inv = this.inventories.get(departureId);
    return inv ? { ...inv } : undefined;
  }

  getBooking(bookingId: string): AuthoritativeBookingRecord | undefined {
    return this.bookings.get(bookingId);
  }

  async executeReservationHold(params: DatabaseReservationParams): Promise<DatabaseReservationOutcome> {
    if (this.simulateDbFailure) {
      return {
        success: false,
        errorCode: 'SERVICE_UNAVAILABLE',
        errorMessage: 'Simulated PostgreSQL connection / transaction failure. Transaction rolled back.'
      };
    }

    // 1. Idempotency Check (Scoped to userId + idempotencyKey)
    const idempotencyKeyCompound = `${params.userId}:reserve:${params.idempotencyKey}`;
    const existing = this.idempotencyLedger.get(idempotencyKeyCompound);

    if (existing) {
      if (existing.requestHash === params.requestHash) {
        if (existing.status === 'completed') {
          // Idempotent replay: return existing booking without re-allocating capacity
          return {
            success: true,
            booking: existing.booking,
            isIdempotentReplay: true
          };
        }
        return {
          success: false,
          errorCode: 'IDEMPOTENCY_CONFLICT',
          errorMessage: 'A concurrent reservation request with this idempotency key is already in progress.'
        };
      }
      return {
        success: false,
        errorCode: 'IDEMPOTENCY_CONFLICT',
        errorMessage: 'Idempotency key was previously used with different request parameters.'
      };
    }

    // 2. Lock & Check Inventory Capacity
    const inv = this.inventories.get(params.departureId);
    if (!inv) {
      return {
        success: false,
        errorCode: 'INVENTORY_UNAVAILABLE',
        errorMessage: `Departure inventory record not found for '${params.departureId}'.`
      };
    }

    const available = inv.totalCapacity - inv.allocatedCapacity - inv.heldCapacity;
    if (available < params.passengerCount) {
      return {
        success: false,
        errorCode: 'INSUFFICIENT_CAPACITY',
        errorMessage: `Insufficient capacity. Available: ${available}, Requested: ${params.passengerCount}.`
      };
    }

    // 3. Atomically increment heldCapacity
    inv.heldCapacity += params.passengerCount;

    // 4. Generate PostgreSQL-standard UUID for booking
    const hex8 = Math.random().toString(16).slice(2, 10);
    const hex4a = Math.random().toString(16).slice(2, 6);
    const hex4b = Math.random().toString(16).slice(2, 6);
    const hex4c = Math.random().toString(16).slice(2, 6);
    const hex12 = Math.random().toString(16).slice(2, 14);
    const generatedUuid = `${hex8}-${hex4a}-${hex4b}-${hex4c}-${hex12}`;

    const serverNow = Date.now();
    const durationMs = (params.holdDurationSeconds ?? 900) * 1000;
    const holdExpiresAt = new Date(serverNow + durationMs).toISOString();

    const booking: AuthoritativeBookingRecord = {
      id: generatedUuid,
      userId: params.userId,
      departureId: params.departureId,
      passengerCount: params.passengerCount,
      fareQuoteId: params.fareQuoteId,
      totalAmountMinorUnits: params.totalAmountMinorUnits,
      currency: params.currency as AuthoritativeBookingRecord['currency'],
      status: 'held',
      idempotencyKey: params.idempotencyKey,
      holdExpiresAt,
      createdAt: new Date(serverNow).toISOString(),
      updatedAt: new Date(serverNow).toISOString()
    };

    // 5. Persist booking and idempotency result atomically
    this.bookings.set(booking.id, booking);
    this.idempotencyLedger.set(idempotencyKeyCompound, {
      userId: params.userId,
      requestHash: params.requestHash,
      status: 'completed',
      booking
    });

    return {
      success: true,
      booking,
      isIdempotentReplay: false
    };
  }
}
