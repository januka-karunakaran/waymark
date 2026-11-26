/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Task 05.1.2: Inventory Provider Contract & Availability Interfaces
 */

import { BookableDeparture, InventorySource } from '../types/bookingTypes';
import { BookingResult } from '../services/BookingService';

/**
 * Provider operational readiness state.
 */
export type ProviderReadiness = 'ready' | 'not_configured' | 'degraded' | 'unavailable';

/**
 * Detailed real-time capacity and availability details for a bookable departure.
 * Rule: Genuine capacity and seat availability must originate from verified operator integrations.
 * Static route descriptions or discovery suggestions must never be used to synthesize available seats.
 */
export interface DepartureAvailability {
  /** Reference to the bookable departure */
  departureId: string;
  /** Whether the departure currently has bookable seats */
  isAvailable: boolean;
  /** Verified available seat count, if genuinely provided by the operator */
  availableSeats?: number;
  /** Total vehicle / cabin capacity, if genuinely provided by the operator */
  totalCapacity?: number;
  /** Data provenance of this availability report */
  source: InventorySource;
  /** ISO 8601 UTC timestamp of when this observation was verified */
  observedAt: string;
  /** Optional operator-provided remarks (e.g., 'Low availability', 'Boarding gate 4') */
  operatorNotice?: string;
}

/**
 * Filter parameters for querying bookable departures along transit corridors.
 */
export interface DepartureQueryFilters {
  /** Origin node or hub identifier */
  originNodeId?: string;
  /** Destination node or hub identifier */
  destinationNodeId?: string;
  /** Earliest ISO 8601 UTC departure timestamp */
  fromDate?: string;
  /** Latest ISO 8601 UTC departure timestamp */
  toDate?: string;
  /** Specific operator filter */
  operatorId?: string;
  /** Specific transit mode filter (maglev, bus, hyperloop, air) */
  transitMode?: string;
}

/**
 * Contract governing read operations for verified bookable transit departures and availability.
 * Adheres to strict separation between illustrative journey context and bookable inventory.
 */
export interface TransitInventoryProvider {
  /**
   * Reports the current readiness of this inventory provider.
   */
  getReadiness(): Promise<ProviderReadiness>;

  /**
   * Queries verified bookable departures matching the specified filters.
   * Rule: Never synthesizes fake operational departures or turns sample journey routes into inventory.
   */
  getDepartures(filters?: DepartureQueryFilters): Promise<BookingResult<BookableDeparture[]>>;

  /**
   * Retrieves a specific verified bookable departure by identifier.
   */
  getDeparture(departureId: string): Promise<BookingResult<BookableDeparture>>;

  /**
   * Checks verified real-time seat availability for a departure.
   * Rule: Availability is not inferred merely from the existence of a departure ID.
   */
  checkAvailability(departureId: string): Promise<BookingResult<DepartureAvailability>>;
}
