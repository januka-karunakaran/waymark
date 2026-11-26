/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Booking Domain Validation, Boundary Checks & Security Rules
 */

import {
  CurrencyCode,
  FareQuote,
  BookingRequest,
  TransportOperator,
  BookableDeparture,
  PassengerInput
} from '../types';

export const MIN_PASSENGER_COUNT = 1;
export const MAX_PASSENGER_COUNT = 9;

export const IDEMPOTENCY_KEY_MIN_LENGTH = 16;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export const MAX_IDENTIFIER_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'LKR',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'SGD'
] as const;

// Prohibited characters: control characters, HTML tags, script injection tokens
const DANGEROUS_CHAR_PATTERN = /[<>{}\0]/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

// Forbidden payment-card / sensitive financial keywords in generic inputs
const SENSITIVE_FINANCIAL_PATTERN = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b(?:cvv|cvc|pan|card_number|credit_card)\b/i;

export interface ValidationOutcome<T> {
  isValid: boolean;
  error?: string;
  sanitized?: T;
}

/**
 * Validates passenger count strictly between MIN_PASSENGER_COUNT and MAX_PASSENGER_COUNT.
 * Rejects negative, fractional, zero, or non-numeric values.
 */
export function validatePassengerCount(count: unknown): ValidationOutcome<number> {
  if (typeof count !== 'number' || !Number.isInteger(count)) {
    return { isValid: false, error: 'Passenger count must be an integer.' };
  }
  if (count < MIN_PASSENGER_COUNT || count > MAX_PASSENGER_COUNT) {
    return {
      isValid: false,
      error: `Passenger count must be between ${MIN_PASSENGER_COUNT} and ${MAX_PASSENGER_COUNT}.`
    };
  }
  return { isValid: true, sanitized: count };
}

/**
 * Validates minor unit monetary amount.
 * Rejects negative numbers, fractional/floating-point values, NaN, or Infinity.
 */
export function validateMinorUnitAmount(amount: unknown): ValidationOutcome<number> {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return { isValid: false, error: 'Monetary amount must be an integer in minor units.' };
  }
  if (amount < 0) {
    return { isValid: false, error: 'Monetary amount cannot be negative.' };
  }
  if (!Number.isSafeInteger(amount)) {
    return { isValid: false, error: 'Monetary amount exceeds safe integer limit.' };
  }
  return { isValid: true, sanitized: amount };
}

/**
 * Validates ISO 4217 uppercase 3-letter currency code.
 */
export function validateCurrencyCode(code: unknown): ValidationOutcome<CurrencyCode> {
  if (typeof code !== 'string') {
    return { isValid: false, error: 'Currency code must be a string.' };
  }
  const trimmed = code.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(trimmed as CurrencyCode)) {
    return {
      isValid: false,
      error: `Unsupported currency code '${code}'. Supported: ${SUPPORTED_CURRENCIES.join(', ')}.`
    };
  }
  return { isValid: true, sanitized: trimmed as CurrencyCode };
}

/**
 * Validates an idempotency key to prevent double reservation mutations.
 */
export function validateIdempotencyKey(key: unknown): ValidationOutcome<string> {
  if (typeof key !== 'string') {
    return { isValid: false, error: 'Idempotency key must be a string.' };
  }
  const trimmed = key.trim();
  if (
    trimmed.length < IDEMPOTENCY_KEY_MIN_LENGTH ||
    trimmed.length > IDEMPOTENCY_KEY_MAX_LENGTH
  ) {
    return {
      isValid: false,
      error: `Idempotency key length must be between ${IDEMPOTENCY_KEY_MIN_LENGTH} and ${IDEMPOTENCY_KEY_MAX_LENGTH} characters.`
    };
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: 'Idempotency key may only contain alphanumeric characters, hyphens, and underscores.'
    };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates an ISO 8601 date string.
 */
export function validateIsoDate(dateString: unknown, fieldName: string = 'Date'): ValidationOutcome<string> {
  if (typeof dateString !== 'string') {
    return { isValid: false, error: `${fieldName} must be an ISO 8601 string.` };
  }
  const trimmed = dateString.trim();
  if (!ISO_DATE_PATTERN.test(trimmed)) {
    return { isValid: false, error: `${fieldName} is not a valid ISO 8601 format.` };
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, error: `${fieldName} contains an invalid date value.` };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates generic text identifier.
 */
export function validateIdentifier(id: unknown, fieldName: string = 'Identifier'): ValidationOutcome<string> {
  if (typeof id !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string.` };
  }
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_IDENTIFIER_LENGTH) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty and must not exceed ${MAX_IDENTIFIER_LENGTH} characters.`
    };
  }
  if (DANGEROUS_CHAR_PATTERN.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters.` };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates passenger input data.
 */
export function validatePassengerInput(passenger: unknown): ValidationOutcome<PassengerInput> {
  if (!passenger || typeof passenger !== 'object') {
    return { isValid: false, error: 'Passenger input must be an object.' };
  }
  const p = passenger as Record<string, unknown>;
  if (typeof p.fullName !== 'string') {
    return { isValid: false, error: 'Passenger full name must be a string.' };
  }
  const trimmedName = p.fullName.trim();
  if (trimmedName.length < 2 || trimmedName.length > MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Passenger full name must be between 2 and ${MAX_NAME_LENGTH} characters.`
    };
  }
  if (DANGEROUS_CHAR_PATTERN.test(trimmedName)) {
    return { isValid: false, error: 'Passenger name contains invalid characters.' };
  }
  if (SENSITIVE_FINANCIAL_PATTERN.test(trimmedName)) {
    return { isValid: false, error: 'Passenger name contains prohibited financial or card data.' };
  }

  const sanitized: PassengerInput = { fullName: trimmedName };
  if (p.passengerType !== undefined) {
    const validTypes = ['adult', 'child', 'senior', 'student'];
    if (!validTypes.includes(String(p.passengerType))) {
      return { isValid: false, error: `Invalid passenger type '${p.passengerType}'.` };
    }
    sanitized.passengerType = p.passengerType as PassengerInput['passengerType'];
  }
  if (p.specialAssistanceRequired !== undefined) {
    sanitized.specialAssistanceRequired = Boolean(p.specialAssistanceRequired);
  }

  return { isValid: true, sanitized };
}

/**
 * Validates a client BookingRequest payload.
 * Security Rules:
 * - Client cannot submit authoritative price (totalPrice, price, amount, fareAmount).
 * - Client cannot submit client-controlled userId to claim arbitrary ownership.
 * - Passenger count must match length of passengers array if provided.
 */
export function validateBookingRequest(request: unknown): ValidationOutcome<BookingRequest> {
  if (!request || typeof request !== 'object') {
    return { isValid: false, error: 'Booking request must be an object.' };
  }

  const req = request as Record<string, unknown>;

  // Security Check: Rejection of client-controlled pricing authority
  if (
    'price' in req ||
    'totalPrice' in req ||
    'amount' in req ||
    'amountMinorUnits' in req ||
    'fareAmount' in req
  ) {
    return {
      isValid: false,
      error: 'Client cannot supply authoritative fare prices. Price is determined server-side from verified quotes.'
    };
  }

  // Security Check: Rejection of client-supplied user identity
  if ('userId' in req || 'user_id' in req) {
    return {
      isValid: false,
      error: 'Client cannot specify user_id. Identity must be derived from authenticated session context.'
    };
  }

  // Departure ID validation
  const depValidation = validateIdentifier(req.departureId, 'Departure ID');
  if (!depValidation.isValid) {
    return { isValid: false, error: depValidation.error };
  }

  // Fare quote ID validation
  const quoteValidation = validateIdentifier(req.fareQuoteId, 'Fare Quote ID');
  if (!quoteValidation.isValid) {
    return { isValid: false, error: quoteValidation.error };
  }

  // Passenger count validation
  const countValidation = validatePassengerCount(req.passengerCount);
  if (!countValidation.isValid) {
    return { isValid: false, error: countValidation.error };
  }

  // Idempotency key validation
  const keyValidation = validateIdempotencyKey(req.idempotencyKey);
  if (!keyValidation.isValid) {
    return { isValid: false, error: keyValidation.error };
  }

  // Optional passengers array validation
  let sanitizedPassengers: PassengerInput[] | undefined;
  if (req.passengers !== undefined) {
    if (!Array.isArray(req.passengers)) {
      return { isValid: false, error: 'Passengers field must be an array.' };
    }
    if (req.passengers.length !== countValidation.sanitized) {
      return {
        isValid: false,
        error: `Passengers array length (${req.passengers.length}) does not match passengerCount (${countValidation.sanitized}).`
      };
    }
    sanitizedPassengers = [];
    for (let i = 0; i < req.passengers.length; i++) {
      const pValidation = validatePassengerInput(req.passengers[i]);
      if (!pValidation.isValid) {
        return { isValid: false, error: `Passenger #${i + 1}: ${pValidation.error}` };
      }
      sanitizedPassengers.push(pValidation.sanitized!);
    }
  }

  return {
    isValid: true,
    sanitized: {
      departureId: depValidation.sanitized!,
      fareQuoteId: quoteValidation.sanitized!,
      passengerCount: countValidation.sanitized!,
      idempotencyKey: keyValidation.sanitized!,
      ...(sanitizedPassengers ? { passengers: sanitizedPassengers } : {})
    }
  };
}

/**
 * Validates a FareQuote contract.
 */
export function validateFareQuote(quote: unknown): ValidationOutcome<FareQuote> {
  if (!quote || typeof quote !== 'object') {
    return { isValid: false, error: 'Fare quote must be an object.' };
  }
  const q = quote as Record<string, unknown>;

  const idVal = validateIdentifier(q.id, 'Quote ID');
  if (!idVal.isValid) return { isValid: false, error: idVal.error };

  const depVal = validateIdentifier(q.departureId, 'Departure ID');
  if (!depVal.isValid) return { isValid: false, error: depVal.error };

  const amountVal = validateMinorUnitAmount(q.amountMinorUnits);
  if (!amountVal.isValid) return { isValid: false, error: amountVal.error };

  const currVal = validateCurrencyCode(q.currency);
  if (!currVal.isValid) return { isValid: false, error: currVal.error };

  const countVal = validatePassengerCount(q.passengerCount);
  if (!countVal.isValid) return { isValid: false, error: countVal.error };

  const issuedVal = validateIsoDate(q.issuedAt, 'Issued At');
  if (!issuedVal.isValid) return { isValid: false, error: issuedVal.error };

  const expiresVal = validateIsoDate(q.expiresAt, 'Expires At');
  if (!expiresVal.isValid) return { isValid: false, error: expiresVal.error };

  const sourceVal = validateIdentifier(q.issuingSource, 'Issuing Source');
  if (!sourceVal.isValid) return { isValid: false, error: sourceVal.error };

  return {
    isValid: true,
    sanitized: {
      id: idVal.sanitized!,
      departureId: depVal.sanitized!,
      amountMinorUnits: amountVal.sanitized!,
      currency: currVal.sanitized!,
      passengerCount: countVal.sanitized!,
      issuedAt: issuedVal.sanitized!,
      expiresAt: expiresVal.sanitized!,
      issuingSource: sourceVal.sanitized!,
      ...(q.fareClass ? { fareClass: q.fareClass as FareQuote['fareClass'] } : {})
    }
  };
}

/**
 * Validates a TransportOperator contract.
 */
export function validateTransportOperator(operator: unknown): ValidationOutcome<TransportOperator> {
  if (!operator || typeof operator !== 'object') {
    return { isValid: false, error: 'Transport operator must be an object.' };
  }
  const op = operator as Record<string, unknown>;

  const idVal = validateIdentifier(op.id, 'Operator ID');
  if (!idVal.isValid) return { isValid: false, error: idVal.error };

  const nameVal = validateIdentifier(op.name, 'Operator Name');
  if (!nameVal.isValid) return { isValid: false, error: nameVal.error };

  const sourceVal = validateIdentifier(op.sourceIdentifier, 'Source Identifier');
  if (!sourceVal.isValid) return { isValid: false, error: sourceVal.error };

  const validVerificationStates = ['verified', 'unverified', 'simulated'];
  if (!validVerificationStates.includes(String(op.verificationState))) {
    return {
      isValid: false,
      error: `Invalid verificationState '${op.verificationState}'. Must be one of: ${validVerificationStates.join(', ')}.`
    };
  }

  return {
    isValid: true,
    sanitized: {
      id: idVal.sanitized!,
      name: nameVal.sanitized!,
      sourceIdentifier: sourceVal.sanitized!,
      verificationState: op.verificationState as TransportOperator['verificationState'],
      ...(op.websiteUrl ? { websiteUrl: String(op.websiteUrl) } : {}),
      ...(op.contactPhone ? { contactPhone: String(op.contactPhone) } : {})
    }
  };
}

/**
 * Validates a BookableDeparture contract.
 */
export function validateBookableDeparture(departure: unknown): ValidationOutcome<BookableDeparture> {
  if (!departure || typeof departure !== 'object') {
    return { isValid: false, error: 'Bookable departure must be an object.' };
  }
  const dep = departure as Record<string, unknown>;

  const idVal = validateIdentifier(dep.id, 'Departure ID');
  if (!idVal.isValid) return { isValid: false, error: idVal.error };

  const opVal = validateIdentifier(dep.operatorId, 'Operator ID');
  if (!opVal.isValid) return { isValid: false, error: opVal.error };

  const origIdVal = validateIdentifier(dep.originNodeId, 'Origin Node ID');
  if (!origIdVal.isValid) return { isValid: false, error: origIdVal.error };

  const origNameVal = validateIdentifier(dep.originName, 'Origin Name');
  if (!origNameVal.isValid) return { isValid: false, error: origNameVal.error };

  const destIdVal = validateIdentifier(dep.destinationNodeId, 'Destination Node ID');
  if (!destIdVal.isValid) return { isValid: false, error: destIdVal.error };

  const destNameVal = validateIdentifier(dep.destinationName, 'Destination Name');
  if (!destNameVal.isValid) return { isValid: false, error: destNameVal.error };

  const depTimeVal = validateIsoDate(dep.departureTime, 'Departure Time');
  if (!depTimeVal.isValid) return { isValid: false, error: depTimeVal.error };

  const validSources = ['sample_data', 'operator_verified', 'provider_unavailable'];
  if (!validSources.includes(String(dep.inventorySource))) {
    return {
      isValid: false,
      error: `Invalid inventorySource '${dep.inventorySource}'.`
    };
  }

  const validStatuses = ['available', 'sold_out', 'cancelled', 'unavailable'];
  if (!validStatuses.includes(String(dep.bookableStatus))) {
    return {
      isValid: false,
      error: `Invalid bookableStatus '${dep.bookableStatus}'.`
    };
  }

  return {
    isValid: true,
    sanitized: {
      id: idVal.sanitized!,
      operatorId: opVal.sanitized!,
      originNodeId: origIdVal.sanitized!,
      originName: origNameVal.sanitized!,
      destinationNodeId: destIdVal.sanitized!,
      destinationName: destNameVal.sanitized!,
      departureTime: depTimeVal.sanitized!,
      serviceIdentifier: String(dep.serviceIdentifier || ''),
      inventorySource: dep.inventorySource as BookableDeparture['inventorySource'],
      bookableStatus: dep.bookableStatus as BookableDeparture['bookableStatus'],
      ...(dep.arrivalTime ? { arrivalTime: String(dep.arrivalTime) } : {}),
      ...(dep.transitMode ? { transitMode: String(dep.transitMode) } : {})
    }
  };
}

/**
 * Validates a real-time departure availability payload from an inventory provider.
 */
export function validateDepartureAvailability(
  availability: unknown
): ValidationOutcome<{
  departureId: string;
  isAvailable: boolean;
  availableSeats?: number;
  totalCapacity?: number;
  source: string;
  observedAt: string;
  operatorNotice?: string;
}> {
  if (!availability || typeof availability !== 'object') {
    return { isValid: false, error: 'Availability payload must be an object.' };
  }

  const rec = availability as Record<string, unknown>;
  const depIdVal = validateIdentifier(rec.departureId, 'Departure ID');
  if (!depIdVal.isValid) return { isValid: false, error: depIdVal.error };

  if (typeof rec.isAvailable !== 'boolean') {
    return { isValid: false, error: 'isAvailable must be a boolean.' };
  }

  if (rec.availableSeats !== undefined) {
    if (
      typeof rec.availableSeats !== 'number' ||
      !Number.isInteger(rec.availableSeats) ||
      rec.availableSeats < 0
    ) {
      return { isValid: false, error: 'availableSeats must be a non-negative integer.' };
    }
  }

  if (rec.totalCapacity !== undefined) {
    if (
      typeof rec.totalCapacity !== 'number' ||
      !Number.isInteger(rec.totalCapacity) ||
      rec.totalCapacity < 0
    ) {
      return { isValid: false, error: 'totalCapacity must be a non-negative integer.' };
    }

    if (
      rec.availableSeats !== undefined &&
      (rec.availableSeats as number) > (rec.totalCapacity as number)
    ) {
      return {
        isValid: false,
        error: 'availableSeats cannot exceed totalCapacity.'
      };
    }
  }

  const validSources = ['sample_data', 'operator_verified', 'provider_unavailable'];
  if (!validSources.includes(String(rec.source))) {
    return { isValid: false, error: `Invalid inventory source '${rec.source}'.` };
  }

  const observedVal = validateIsoDate(rec.observedAt, 'Observed At');
  if (!observedVal.isValid) return { isValid: false, error: observedVal.error };

  return {
    isValid: true,
    sanitized: {
      departureId: depIdVal.sanitized!,
      isAvailable: rec.isAvailable,
      ...(rec.availableSeats !== undefined ? { availableSeats: rec.availableSeats as number } : {}),
      ...(rec.totalCapacity !== undefined ? { totalCapacity: rec.totalCapacity as number } : {}),
      source: rec.source as string,
      observedAt: observedVal.sanitized!,
      ...(rec.operatorNotice ? { operatorNotice: String(rec.operatorNotice).slice(0, 200) } : {})
    }
  };
}

/**
 * Validates a FareQuoteRequest before submission to a fare provider.
 */
export function validateFareQuoteRequest(
  request: unknown
): ValidationOutcome<{
  departureId: string;
  passengerCount: number;
  fareClass?: 'standard' | 'priority' | 'comfort';
  preferredCurrency?: string;
}> {
  if (!request || typeof request !== 'object') {
    return { isValid: false, error: 'Fare quote request must be an object.' };
  }

  const rec = request as Record<string, unknown>;

  // Strict anti-tampering: client cannot supply arbitrary prices or amounts
  if ('price' in rec || 'totalPrice' in rec || 'amount' in rec || 'amountMinorUnits' in rec) {
    return {
      isValid: false,
      error: 'Client cannot supply price or amount in a fare quote request.'
    };
  }

  const depIdVal = validateIdentifier(rec.departureId, 'Departure ID');
  if (!depIdVal.isValid) return { isValid: false, error: depIdVal.error };

  const passVal = validatePassengerCount(rec.passengerCount);
  if (!passVal.isValid) return { isValid: false, error: passVal.error };

  if (rec.fareClass !== undefined) {
    const validClasses = ['standard', 'priority', 'comfort'];
    if (!validClasses.includes(String(rec.fareClass))) {
      return { isValid: false, error: `Invalid fareClass '${rec.fareClass}'.` };
    }
  }

  let sanitizedCurrency: string | undefined;
  if (rec.preferredCurrency !== undefined) {
    const curVal = validateCurrencyCode(rec.preferredCurrency);
    if (!curVal.isValid) return { isValid: false, error: curVal.error };
    sanitizedCurrency = curVal.sanitized;
  }

  return {
    isValid: true,
    sanitized: {
      departureId: depIdVal.sanitized!,
      passengerCount: passVal.sanitized!,
      ...(rec.fareClass ? { fareClass: rec.fareClass as 'standard' | 'priority' | 'comfort' } : {}),
      ...(sanitizedCurrency ? { preferredCurrency: sanitizedCurrency } : {})
    }
  };
}

