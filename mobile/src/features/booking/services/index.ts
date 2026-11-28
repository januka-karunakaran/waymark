/**
 * Waymark Mobile — Feature 05.1 / 05.3: Booking & Ticketing Architecture Foundation
 * Barrel Exports & Factory for Booking Services
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BookingService } from './BookingService';
import { UnavailableBookingService } from './UnavailableBookingService';
import { RemoteBookingService, RemoteBookingServiceConfig } from './RemoteBookingService';
import { getSupabaseClient } from '../../auth/providers/supabaseClient';

export * from './BookingService';
export * from './UnavailableBookingService';
export * from './RemoteBookingService';

export interface BookingServiceFactoryOptions {
  useRemote?: boolean;
  supabaseClient?: SupabaseClient | null;
  remoteConfig?: RemoteBookingServiceConfig;
}

/**
 * Creates an appropriate BookingService implementation.
 * Guarantees:
 * - If useRemote is true and a valid Supabase client is configured, returns RemoteBookingService.
 * - In all other cases (including default production startup), safely returns UnavailableBookingService.
 * - Prevents inadvertent live booking mutations when backend infrastructure is pending.
 */
export function createBookingService(options: BookingServiceFactoryOptions = {}): BookingService {
  if (options.useRemote) {
    const client = options.supabaseClient ?? getSupabaseClient();
    if (client) {
      return new RemoteBookingService({
        supabaseClient: client,
        ...options.remoteConfig
      });
    }
  }

  return new UnavailableBookingService();
}

/**
 * Singleton / default booking service instance provider.
 * Defaults safely to UnavailableBookingService.
 */
let defaultBookingServiceInstance: BookingService | null = null;

export function getBookingService(options?: BookingServiceFactoryOptions): BookingService {
  if (options) {
    return createBookingService(options);
  }
  if (!defaultBookingServiceInstance) {
    defaultBookingServiceInstance = new UnavailableBookingService();
  }
  return defaultBookingServiceInstance;
}
