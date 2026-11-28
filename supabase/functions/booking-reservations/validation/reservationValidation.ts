/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Server-Side Request Validation & Security Boundaries
 */

import {
  ReservationRequestPayload,
  BookingLookupPayload,
  CancelReservationPayload
} from '../types';

export const MAX_REQUEST_SIZE_BYTES = 32 * 1024; // 32 KB
export const MIN_PASSENGER_COUNT = 1;
export const MAX_PASSENGER_COUNT = 9;
export const IDEMPOTENCY_KEY_MIN_LEN = 16;
export const IDEMPOTENCY_KEY_MAX_LEN = 128;
export const MAX_IDENTIFIER_LEN = 128;

const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]+$/;
const DANGEROUS_CHAR_REGEX = /[<>{}\0]/;

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Prohibited field names that client requests must NEVER contain.
 * Enforces zero client-controlled authority over ownership, pricing, or lifecycle states.
 */
const FORBIDDEN_CLIENT_FIELDS = [
  'userId',
  'user_id',
  'email',
  'displayName',
  'display_name',
  'amountMinorUnits',
  'total_amount_minor_units',
  'totalAmount',
  'price',
  'currency',
  'status',
  'bookingStatus',
  'paymentStatus',
  'tickets',
  'isPaid',
  'holdExpiresAt',
  'hold_expires_at'
];

/**
 * Validates that the request payload contains no client-supplied pricing, ownership, or status overrides.
 */
export function assertNoForbiddenFields(rawInput: unknown): ValidationResult<void> {
  if (typeof rawInput !== 'object' || rawInput === null) {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const record = rawInput as Record<string, unknown>;

  for (const field of FORBIDDEN_CLIENT_FIELDS) {
    if (field in record && record[field] !== undefined) {
      return {
        isValid: false,
        error: `Security violation: client-controlled field '${field}' is strictly prohibited.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates an incoming reservation request payload according to domain invariants.
 */
export function validateReservationPayload(
  rawInput: unknown
): ValidationResult<ReservationRequestPayload> {
  const forbiddenCheck = assertNoForbiddenFields(rawInput);
  if (!forbiddenCheck.isValid) {
    return { isValid: false, error: forbiddenCheck.error };
  }

  const data = rawInput as Record<string, unknown>;

  // 1. departureId
  if (typeof data.departureId !== 'string' || !data.departureId.trim()) {
    return { isValid: false, error: 'departureId is required and must be a non-empty string.' };
  }
  const departureId = data.departureId.trim();
  if (departureId.length > MAX_IDENTIFIER_LEN || DANGEROUS_CHAR_REGEX.test(departureId)) {
    return { isValid: false, error: 'departureId contains invalid or dangerous characters.' };
  }

  // 2. passengerCount
  const count = data.passengerCount;
  if (typeof count !== 'number' || !Number.isInteger(count)) {
    return { isValid: false, error: 'passengerCount must be an integer.' };
  }
  if (count < MIN_PASSENGER_COUNT || count > MAX_PASSENGER_COUNT) {
    return {
      isValid: false,
      error: `passengerCount must be between ${MIN_PASSENGER_COUNT} and ${MAX_PASSENGER_COUNT}.`
    };
  }

  // 3. fareQuoteId
  if (typeof data.fareQuoteId !== 'string' || !data.fareQuoteId.trim()) {
    return { isValid: false, error: 'fareQuoteId is required and must be a non-empty string.' };
  }
  const fareQuoteId = data.fareQuoteId.trim();
  if (fareQuoteId.length > MAX_IDENTIFIER_LEN || DANGEROUS_CHAR_REGEX.test(fareQuoteId)) {
    return { isValid: false, error: 'fareQuoteId contains invalid or dangerous characters.' };
  }

  // 4. idempotencyKey
  if (typeof data.idempotencyKey !== 'string' || !data.idempotencyKey.trim()) {
    return { isValid: false, error: 'idempotencyKey is required and must be a non-empty string.' };
  }
  const idempotencyKey = data.idempotencyKey.trim();
  if (
    idempotencyKey.length < IDEMPOTENCY_KEY_MIN_LEN ||
    idempotencyKey.length > IDEMPOTENCY_KEY_MAX_LEN ||
    !IDEMPOTENCY_KEY_REGEX.test(idempotencyKey)
  ) {
    return {
      isValid: false,
      error: `idempotencyKey must be ${IDEMPOTENCY_KEY_MIN_LEN}-${IDEMPOTENCY_KEY_MAX_LEN} characters [A-Za-z0-9_-].`
    };
  }

  // 5. Optional passengers list
  if (data.passengers !== undefined) {
    if (!Array.isArray(data.passengers)) {
      return { isValid: false, error: 'passengers must be an array when provided.' };
    }
    if (data.passengers.length !== count) {
      return {
        isValid: false,
        error: `passengers array length (${data.passengers.length}) must match passengerCount (${count}).`
      };
    }
    for (let i = 0; i < data.passengers.length; i++) {
      const p = data.passengers[i];
      if (typeof p !== 'object' || p === null) {
        return { isValid: false, error: `Invalid passenger record at index ${i}.` };
      }
      if (typeof p.fullName === 'string' && DANGEROUS_CHAR_REGEX.test(p.fullName)) {
        return { isValid: false, error: `Passenger fullName at index ${i} contains illegal characters.` };
      }
    }
  }

  return {
    isValid: true,
    data: {
      departureId,
      passengerCount: count,
      fareQuoteId,
      idempotencyKey,
      fareClass: data.fareClass as ReservationRequestPayload['fareClass'],
      passengers: data.passengers as ReservationRequestPayload['passengers']
    }
  };
}

/**
 * Validates a booking lookup payload.
 */
export function validateBookingLookupPayload(
  rawInput: unknown
): ValidationResult<BookingLookupPayload> {
  if (typeof rawInput !== 'object' || rawInput === null) {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }
  const data = rawInput as Record<string, unknown>;

  if (typeof data.bookingId !== 'string' || !data.bookingId.trim()) {
    return { isValid: false, error: 'bookingId is required and must be a non-empty string.' };
  }
  const bookingId = data.bookingId.trim();
  if (bookingId.length > MAX_IDENTIFIER_LEN || DANGEROUS_CHAR_REGEX.test(bookingId)) {
    return { isValid: false, error: 'bookingId contains invalid or dangerous characters.' };
  }

  return { isValid: true, data: { bookingId } };
}

/**
 * Validates a cancellation payload.
 */
export function validateCancelPayload(
  rawInput: unknown
): ValidationResult<CancelReservationPayload> {
  const lookupCheck = validateBookingLookupPayload(rawInput);
  if (!lookupCheck.isValid || !lookupCheck.data) {
    return { isValid: false, error: lookupCheck.error };
  }

  const data = rawInput as Record<string, unknown>;
  let reason: string | undefined;

  if (data.reason !== undefined) {
    if (typeof data.reason !== 'string') {
      return { isValid: false, error: 'Cancellation reason must be a string.' };
    }
    reason = data.reason.trim();
    if (DANGEROUS_CHAR_REGEX.test(reason)) {
      return { isValid: false, error: 'Cancellation reason contains illegal characters.' };
    }
  }

  return { isValid: true, data: { bookingId: lookupCheck.data.bookingId, reason } };
}

/**
 * Computes a deterministic canonical request fingerprint for idempotency tracking.
 */
export function calculateRequestFingerprint(params: {
  departureId: string;
  passengerCount: number;
  fareQuoteId: string;
  currency: string;
  totalAmountMinorUnits: number;
}): string {
  const canonical = `${params.departureId.trim()}:${params.passengerCount}:${params.fareQuoteId.trim()}:${params.currency.trim().toUpperCase()}:${params.totalAmountMinorUnits}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `req_${p1}${p2}`;
}
