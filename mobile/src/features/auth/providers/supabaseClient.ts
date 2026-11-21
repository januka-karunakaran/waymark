import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, SupabaseConfig } from './supabaseConfig';
import { createSupabaseStorage, SupabaseAuthStorage } from './supabaseStorage';

let clientInstance: SupabaseClient | null = null;
let lastConfigUrl: string | null = null;
let lastConfigKey: string | null = null;

/**
 * Retrieves or creates the singleton Supabase client instance.
 *
 * Guarantees:
 * - If Supabase is unconfigured, returns null immediately without instantiating a client.
 * - Zero network calls or background listeners when unconfigured.
 * - Singleton reuse across component renders to prevent memory leaks and duplicate socket listeners.
 *
 * @param configOverride Optional custom configuration for testing or manual overrides
 * @param storageOverride Optional custom storage adapter for testing
 */
export function getSupabaseClient(
  configOverride?: SupabaseConfig,
  storageOverride?: SupabaseAuthStorage
): SupabaseClient | null {
  const config = configOverride ?? getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  // Reuse existing instance if configuration and storage have not changed
  if (
    clientInstance &&
    lastConfigUrl === config.url &&
    lastConfigKey === config.publishableKey &&
    !storageOverride
  ) {
    return clientInstance;
  }

  const storage = storageOverride ?? createSupabaseStorage();

  // In Node < 22 runtimes (e.g. CI Node 20), global WebSocket is not natively present.
  // Polyfill a minimal WebSocket stub so RealtimeClient initialization succeeds.
  if (typeof globalThis.WebSocket === 'undefined') {
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = class FallbackWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;
      readyState = 3;
      send() {}
      close() {}
      addEventListener() {}
      removeEventListener() {}
    };
  }

  const client = createClient(config.url, config.publishableKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });

  if (!storageOverride) {
    clientInstance = client;
    lastConfigUrl = config.url;
    lastConfigKey = config.publishableKey;
  }

  return client;
}

/**
 * Resets the cached singleton client (useful for unit tests and configuration reloading).
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
  lastConfigUrl = null;
  lastConfigKey = null;
}
