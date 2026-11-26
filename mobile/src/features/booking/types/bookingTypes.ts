/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Core Booking Domain Types, Lifecycle State Machine & Operators
 */

import { CurrencyCode } from './fareTypes';
import { PassengerType } from './ticketTypes';

export type OperatorVerificationState = 'verified' | 'unverified' | 'simulated';

export type InventorySource = 'sample_data' | 'operator_verified' | 'provider_unavailable';

export type DepartureBookableStatus = 'available' | 'sold_out' | 'cancelled' | 'unavailable';

/**
 * Transport operator offering services on the Waymark transit network.
 */
export interface TransportOperator {
  /** Unique operator identifier */
  id: string;
  /** Public display name */
  name: string;
  /** Internal or GTFS/operator registry identifier */
  sourceIdentifier: string;
  /** Verification status of this operator */
  verificationState: OperatorVerificationState;
  /** Optional official website URL */
  websiteUrl?: string;
  /** Optional customer support telephone */
  contactPhone?: string;
}

/**
 * Scheduled departure for a specific corridor or transit line.
 * Rule: Static sample route suggestions in Discovery or Home do NOT constitute bookable departures.
 */
export interface BookableDeparture {
  /** Unique departure identifier */
  id: string;
  /** Verified operator reference */
  operatorId: string;
  /** Origin terminal/hub identifier */
  originNodeId: string;
  /** Human-readable origin title */
  originName: string;
  /** Destination terminal/hub identifier */
  destinationNodeId: string;
  /** Human-readable destination title */
  destinationName: string;
  /** ISO 8601 UTC departure timestamp */
  departureTime: string;
  /** Estimated ISO 8601 UTC arrival timestamp, if scheduled */
  arrivalTime?: string;
  /** Flight / train / vehicle service identifier */
  serviceIdentifier: string;
  /** Data provenance of this departure's inventory */
  inventorySource: InventorySource;
  /** Current bookability state */
  bookableStatus: DepartureBookableStatus;
  /** Optional transit mode (maglev, bus, air, etc.) */
  transitMode?: string;
}

/**
 * Explicit lifecycle states of a Waymark booking.
 */
export type BookingStatus =
  | 'draft'
  | 'pending_inventory'
  | 'held'
  | 'awaiting_payment'
  | 'confirmed'
  | 'ticket_issued'
  | 'expired'
  | 'cancelled'
  | 'payment_failed'
  | 'failed'
  | 'refund_pending'
  | 'refunded';

/**
 * Strict state transition graph for booking lifecycle.
 * Client actions must NEVER directly elevate a booking to 'confirmed' or 'ticket_issued'.
 */
export const BOOKING_ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ['pending_inventory', 'cancelled'],
  pending_inventory: ['held', 'failed', 'cancelled'],
  held: ['awaiting_payment', 'expired', 'cancelled'],
  awaiting_payment: ['confirmed', 'payment_failed', 'expired', 'cancelled'],
  confirmed: ['ticket_issued', 'refund_pending', 'cancelled'],
  ticket_issued: ['refund_pending', 'cancelled'],
  payment_failed: ['awaiting_payment', 'cancelled', 'failed'],
  refund_pending: ['refunded', 'failed'],
  expired: [],
  cancelled: [],
  failed: [],
  refunded: []
} as const;

/**
 * Validates whether a requested transition between two booking states is permitted.
 */
export function isValidBookingStateTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true;
  const allowed = BOOKING_ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Checks if a booking status represents a terminal (final) state.
 */
export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return (
    status === 'expired' ||
    status === 'cancelled' ||
    status === 'failed' ||
    status === 'refunded'
  );
}

/**
 * Passenger details submitted with a booking reservation request.
 */
export interface PassengerInput {
  fullName: string;
  passengerType?: PassengerType;
  specialAssistanceRequired?: boolean;
}

/**
 * Client reservation request payload.
 * Rule: Does NOT accept client-controlled prices or arbitrary user IDs.
 * Price is resolved strictly server-side from the verified FareQuote.
 */
export interface BookingRequest {
  /** Reference to the bookable departure */
  departureId: string;
  /** Number of seats / tickets requested (1-9) */
  passengerCount: number;
  /** Reference to the server-issued fare quote */
  fareQuoteId: string;
  /** Unique idempotency key to prevent double reservation */
  idempotencyKey: string;
  /** Optional passenger details */
  passengers?: PassengerInput[];
}

/**
 * Authoritative booking record managed by the backend / database.
 */
export interface Booking {
  /** Unique booking identifier */
  id: string;
  /** Authenticated user reference from auth.users */
  userId: string;
  /** Verified departure reference */
  departureId: string;
  /** Verified fare quote reference */
  fareQuoteId: string;
  /** Number of passenger tickets */
  passengerCount: number;
  /** Authoritative server-confirmed amount in minor units */
  confirmedAmountMinorUnits: number;
  /** Currency code */
  currency: CurrencyCode;
  /** Current state machine status */
  status: BookingStatus;
  /** Idempotency key associated with this booking */
  idempotencyKey: string;
  /** Passenger details */
  passengers?: PassengerInput[];
  /** ISO 8601 UTC creation timestamp */
  createdAt: string;
  /** ISO 8601 UTC last update timestamp */
  updatedAt: string;
  /** Expiration timestamp for held reservations */
  expiresAt?: string;
  /** Optional cancellation reason */
  cancellationReason?: string;
}
