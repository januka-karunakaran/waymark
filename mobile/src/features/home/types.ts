/**
 * Waymark 2100 — Home Content Domain Types & Architecture
 * Defines strongly typed models for Home screen content, data availability states,
 * and safe optional representations for multimodal transit telemetry.
 */

import { TransitMode, TransitStatus } from '../../types/transit';

/**
 * Explicit content availability states for asynchronous data readiness.
 */
export type ContentAvailability =
  | 'available'
  | 'loading'
  | 'empty'
  | 'error'
  | 'sample';

/**
 * Data provenance classification to distinguish verified live telemetry from illustrative demo content.
 */
export type ContentDataSource =
  | 'live_telemetry'     // Verified live feed from dispatch/avionics
  | 'cached_schedule'    // Offline local schedule cache
  | 'sample_data'        // Illustrative/mock demo content
  | 'user_preference';   // Client-side saved preferences

/**
 * Home screen Hero header content model.
 */
export interface HomeHeroContent {
  /** Small uppercase telemetry tag / kicker above headline */
  eyebrow: string;
  /** Primary headline greeting or navigational prompt */
  title: string;
  /** Optional styled emphasis text inside headline */
  titleHighlight?: string;
  /** Descriptive explanatory context */
  subtitle: string;
}

/**
 * Suggested route recommendation model.
 */
export interface HomeSuggestionContent {
  /** Identifier for routing actions */
  id: string;
  /** Top-level category label (e.g., 'SUGGESTED ACTIVE ROUTE') */
  kicker: string;
  /** Action urgency badge text (e.g., 'LEAVE NOW') */
  badgeText: string;
  /** Route corridor name (e.g., 'KDU Gate → Kandy City') */
  title: string;
  /** Route advisory or weather/corridor condition detail */
  description: string;
  /** Primary call to action button text */
  actionLabel: string;
  /** Estimated travel duration in minutes if known */
  estimatedDurationMinutes?: number;
  /** Primary transit modes utilized in this route */
  transitModes?: TransitMode[];
  /** Operational status of the suggested corridor */
  corridorStatus?: TransitStatus;
  /** Explicitly flags whether this recommendation is simulated demo content */
  isSample: boolean;
  /** Target navigation route identifier */
  targetScreen?: string;
}

/**
 * Quick-select place node shortcut.
 */
export interface HomeQuickPlaceNode {
  id: string;
  label: string;
  destination: string;
  iconName: 'home' | 'briefcase' | 'map-pin' | 'compass' | 'plane' | 'more-horizontal';
  isPopular?: boolean;
}

/**
 * Developer and telemetry architectural module item.
 * Used for technical diagnostics and foundation verification.
 */
export interface HomeModuleDiagnostic {
  id: string;
  label: string;
  value: string;
  status?: 'operational' | 'standby' | 'calibrating';
}

/**
 * Architecture status panel model.
 */
export interface HomeArchitectureStatus {
  title: string;
  statusLabel: string;
  isOperational: boolean;
  modules: HomeModuleDiagnostic[];
  /** Flags that this content is technical foundation diagnostic information */
  isDeveloperContent: boolean;
}

/**
 * Accessibility baseline guarantee representation.
 */
export interface HomeAccessibilityNotice {
  /** User-visible statement regarding accessibility provisions */
  message: string;
  /** Indicates whether the route/platform has been verified step-free */
  isVerifiedStepFree: boolean;
  /** Explanatory clarification regarding accessibility baseline */
  complianceStatement: string;
  /** Status badge for accessibility rating */
  verificationLevel: 'verified' | 'informational' | 'simulated';
}

/**
 * Complete strongly-typed Home Screen Content State.
 */
export interface HomeScreenData {
  hero: HomeHeroContent;
  suggestion: HomeSuggestionContent | null;
  quickPlaces: HomeQuickPlaceNode[];
  architectureStatus: HomeArchitectureStatus | null;
  accessibilityNotice: HomeAccessibilityNotice;
  availability: ContentAvailability;
  dataSource: ContentDataSource;
  lastUpdatedTimestamp?: number;
}
