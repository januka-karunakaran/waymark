/**
 * Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
 * Task 05.3.1: Readiness Handler
 */

import { BackendApiResponse, BackendReadiness } from '../types';
import { ServerFareAuthority } from '../services/fareAuthority';
import { ServerOperatorAuthority } from '../services/operatorAuthority';

export interface ReadinessHandlerContext {
  fareAuthority: ServerFareAuthority;
  operatorAuthority: ServerOperatorAuthority;
  isDatabaseConfigured?: boolean;
}

export function handleReadiness(
  context: ReadinessHandlerContext
): BackendApiResponse<BackendReadiness> {
  const isFareReady = context.fareAuthority.isConfigured();
  const isOperatorReady = context.operatorAuthority.isConfigured();
  const isDbReady = Boolean(context.isDatabaseConfigured);

  return {
    success: true,
    data: {
      isConfigured: isFareReady && isOperatorReady && isDbReady,
      operatorAuthority: isOperatorReady ? 'ready' : 'pending',
      fareAuthority: isFareReady ? 'ready' : 'pending',
      databaseTransactions: isDbReady ? 'ready' : 'pending',
      version: '05.3.1'
    }
  };
}
