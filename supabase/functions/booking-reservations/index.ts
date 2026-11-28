/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Supabase Edge Function Entrypoint for Booking Reservations
 */

import {
  ReservationApiEnvelope,
  BackendApiResponse,
  AuthoritativeBookingRecord
} from './types';
import { MAX_REQUEST_SIZE_BYTES } from './validation/reservationValidation';
import {
  ServerFareAuthority,
  UnconfiguredFareAuthority
} from './services/fareAuthority';
import {
  ServerOperatorAuthority,
  UnconfiguredOperatorAuthority
} from './services/operatorAuthority';
import { handleReservationRequest } from './handlers/reservationHandler';
import { handleBookingLookup } from './handlers/bookingHandler';
import { handleCancellation } from './handlers/cancellationHandler';
import { handleReadiness } from './handlers/readinessHandler';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

export interface EdgeFunctionContext {
  fareAuthority?: ServerFareAuthority;
  operatorAuthority?: ServerOperatorAuthority;
  bookingStore?: Map<string, AuthoritativeBookingRecord>;
  jwtVerifier?: (authHeader: string | null) => Promise<{ userId: string | null; error?: string }>;
}

/**
 * Default JWT verifier that validates bearer token structure.
 * In a deployed Supabase environment, this integrates with Supabase Auth auth.getUser().
 */
export async function defaultJwtVerifier(
  authHeader: string | null
): Promise<{ userId: string | null; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or malformed Authorization header.' };
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token.length < 10) {
    return { userId: null, error: 'Invalid bearer token length.' };
  }

  // Token must not contain suspicious control characters
  if (/[<>{}\0\s]/.test(token)) {
    return { userId: null, error: 'Authorization token contains invalid characters.' };
  }

  return { userId: null, error: 'No live Supabase Auth verifier configured in standard runner.' };
}

/**
 * Main HTTP Request Processor for booking reservations Edge Function.
 */
export async function processReservationHttpRequest(
  request: {
    method: string;
    headers: Record<string, string | undefined>;
    rawBody?: string;
  },
  contextOverrides?: EdgeFunctionContext
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  // 1. CORS Pre-flight handling
  if (request.method === 'OPTIONS') {
    return {
      status: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true })
    };
  }

  const jsonHeaders = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json'
  };

  try {
    const authHeader = request.headers['authorization'] || request.headers['Authorization'] || null;

    // Check payload size
    if (request.rawBody && request.rawBody.length > MAX_REQUEST_SIZE_BYTES) {
      const errorResp: BackendApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: `Request payload exceeds maximum allowed size of ${MAX_REQUEST_SIZE_BYTES} bytes.`
        }
      };
      return { status: 413, headers: jsonHeaders, body: JSON.stringify(errorResp) };
    }

    // Parse JSON
    let envelope: ReservationApiEnvelope;
    try {
      envelope = JSON.parse(request.rawBody || '{}');
    } catch {
      const errorResp: BackendApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Malformed JSON payload in request body.'
        }
      };
      return { status: 400, headers: jsonHeaders, body: JSON.stringify(errorResp) };
    }

    const fareAuthority = contextOverrides?.fareAuthority ?? new UnconfiguredFareAuthority();
    const operatorAuthority = contextOverrides?.operatorAuthority ?? new UnconfiguredOperatorAuthority();
    const bookingStore = contextOverrides?.bookingStore;

    // Readiness action is public
    if (envelope.action === 'readiness') {
      const outcome = handleReadiness({
        fareAuthority,
        operatorAuthority,
        isDatabaseConfigured: false
      });
      return { status: 200, headers: jsonHeaders, body: JSON.stringify(outcome) };
    }

    // All other operations REQUIRE authentication
    const jwtVerifier = contextOverrides?.jwtVerifier ?? defaultJwtVerifier;
    const authResult = await jwtVerifier(authHeader);

    if (!authResult.userId) {
      const errorResp: BackendApiResponse<never> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authResult.error || 'Authentication required to access reservation engine.'
        }
      };
      return { status: 401, headers: jsonHeaders, body: JSON.stringify(errorResp) };
    }

    const authenticatedUserId = authResult.userId;

    // Dispatch by action
    switch (envelope.action) {
      case 'reserve': {
        const result = await handleReservationRequest(envelope.payload, {
          authenticatedUserId,
          fareAuthority,
          operatorAuthority,
          bookingStore
        });
        const status = result.success ? 201 : result.error.code === 'UNAUTHORIZED' ? 401 : 400;
        return { status, headers: jsonHeaders, body: JSON.stringify(result) };
      }

      case 'get_booking': {
        const result = await handleBookingLookup(envelope.payload, {
          authenticatedUserId,
          bookingStore
        });
        const status = result.success ? 200 : result.error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return { status, headers: jsonHeaders, body: JSON.stringify(result) };
      }

      case 'cancel': {
        const result = await handleCancellation(envelope.payload, {
          authenticatedUserId,
          bookingStore
        });
        const status = result.success ? 200 : result.error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return { status, headers: jsonHeaders, body: JSON.stringify(result) };
      }

      default: {
        const errorResp: BackendApiResponse<never> = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: `Unsupported or missing reservation action '${envelope.action}'.`
          }
        };
        return { status: 400, headers: jsonHeaders, body: JSON.stringify(errorResp) };
      }
    }
  } catch (err: unknown) {
    const errorResp: BackendApiResponse<never> = {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Internal server error while processing reservation request.'
      }
    };
    return { status: 500, headers: jsonHeaders, body: JSON.stringify(errorResp) };
  }
}
