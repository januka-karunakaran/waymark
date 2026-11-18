/**
 * Waymark 2100 — Home Quick Action Contracts & Intent Models
 * Provides strongly typed contracts for home shortcut actions, decoupling user intent
 * from concrete navigation execution and enforcing strict routing safety boundaries.
 */

import { TransitMode } from '../../../types/transit';
import { ContentDataSource } from '../types';

/**
 * Standard quick action identifiers supported on the Home screen.
 */
export type HomeQuickActionId =
  | 'place-home'
  | 'place-work'
  | 'place-kandy'
  | 'place-colombo'
  | 'place-airport'
  | 'place-more'
  | (string & Record<never, never>);

/**
 * High-level intent classification for quick actions.
 */
export type QuickActionType =
  | 'navigate'          // Route to an allowlisted internal screen with payload
  | 'in_page_focus'     // Scroll/focus an in-page section (e.g. Discovery)
  | 'unconfigured'      // User has not yet configured private destination (e.g. Home/Work)
  | 'informational'     // Displays informational status or dialog
  | 'unsupported';      // Unknown or rejected action for safety

/**
 * Strongly typed intent representation decoupling UI triggers from navigation routing.
 */
export interface QuickActionIntent {
  /** Identifier of the quick action */
  actionId: HomeQuickActionId;
  /** Human-readable display label */
  label: string;
  /** Raw destination string from data model */
  rawDestination?: string;
  /** Telemetry provenance */
  sourceType: ContentDataSource;
}

/**
 * Contextual payload handed off when navigating to journey planner.
 */
export interface QuickActionDestinationContext {
  /** Internal canonical destination ID */
  destinationId: string;
  /** Display destination name */
  destinationName: string;
  /** Target transit arrival hub identifier if applicable */
  arrivalHubId?: string;
  /** Suggested transit modes for this destination */
  suggestedModes?: TransitMode[];
  /** Explicitly flags whether destination represents simulated telemetry */
  isSampleTarget: boolean;
}

/**
 * Fully resolved quick action with verified execution target and safety metadata.
 */
export interface ResolvedQuickAction {
  /** The originating action ID */
  actionId: HomeQuickActionId;
  /** Action execution classification */
  type: QuickActionType;
  /** Verified internal target route for 'navigate' */
  targetRoute?: string;
  /** Target DOM/element section ID for 'in_page_focus' */
  targetSectionId?: string;
  /** Structured payload for journey handoff */
  destinationContext?: QuickActionDestinationContext;
  /** User-friendly explanatory message for unconfigured or informational states */
  userMessage?: string;
  /** Telemetry provenance */
  sourceType: ContentDataSource;
  /** Strictly indicates whether target was validated against allowlisted routes */
  isVerifiedTarget: boolean;
}

/**
 * Configuration options for resolving quick actions.
 */
export interface QuickActionResolverOptions {
  /** Optional dictionary of saved user addresses (e.g. home/work) */
  savedAddresses?: Record<string, string>;
}
