/**
 * Waymark 2100 — Discovery Content Domain Types & Architecture
 *
 * Defines strongly typed models for discovery sections, exploration items,
 * multimodal transit categories, and data provenance classifications.
 */

import { TransitMode, TransitStatus } from '../../types/transit';
import { ContentAvailability, ContentDataSource } from '../home/types';

/**
 * Verified multimodal discovery categories matching Waymark 2100 transit architecture.
 */
export type DiscoveryCategory =
  | 'corridors'    // Inter-city corridors and multimodal express routes
  | 'hubs'         // Skyports, interchanges, and transit terminals
  | 'modes'        // Multimodal transit vehicles (Maglev, Air Shuttle, Bus, Smart Road)
  | 'experiences'; // Specialized travel profiles (Low-sensory quiet, Panoramic, Express)

/**
 * Supported icon semantic tokens for discovery cards.
 */
export type DiscoveryIconToken =
  | 'route'
  | 'map-pin'
  | 'plane'
  | 'train'
  | 'bus'
  | 'compass'
  | 'sparkles'
  | 'shield';

/**
 * Optional metadata payload describing operational and performance characteristics.
 */
export interface DiscoveryItemMetadata {
  /** Estimated or sample duration string (e.g., '34 min', '1h 06m') */
  duration?: string;
  /** Operating frequency or schedule window (e.g., 'Every 8 min') */
  frequency?: string;
  /** Operational corridor or station status */
  status?: TransitStatus;
  /** Associated transit modes */
  modes?: TransitMode[];
  /** Accessibility score / step-free status */
  stepFree?: boolean;
  /** Distance in km */
  distanceKm?: number;
  /** Node or skyport airport-style code (e.g., 'RAT', 'CMB', 'KDY') */
  nodeCode?: string;
  /** High-speed corridor line identifier (e.g., 'M4', 'A7', 'B12') */
  lineCode?: string;
}

/**
 * Core model for a single discoverable transit entity.
 */
export interface DiscoveryItem {
  /** Stable unique identifier (e.g., 'disc-corridor-kdy-cmb') */
  id: string;
  /** Primary display title */
  title: string;
  /** Category to which this discovery item belongs */
  category: DiscoveryCategory;
  /** Optional descriptive explanation */
  description?: string;
  /** Semantic icon token */
  iconName?: DiscoveryIconToken;
  /** Optional badge text displayed on card (e.g., 'EXPRESS', 'HIGH CAPACITY') */
  badgeText?: string;
  /** Optional operational metadata */
  metadata?: DiscoveryItemMetadata;
  /** Navigation destination route (e.g., '/(tabs)/journey', '/(tabs)/map') */
  actionDestination?: string;
  /** Action button or callout label (e.g., 'View corridor', 'Explore hub') */
  actionLabel?: string;
  /** Whether the interactive action is enabled */
  isEnabled?: boolean;
  /** Explicitly flags whether this item is simulated demo content */
  isSample: boolean;
  /** Provenance classification */
  dataSource: ContentDataSource;
}

/**
 * Model for a grouped section of discovery items.
 */
export interface DiscoverySectionData {
  /** Unique section identifier (e.g., 'section-corridors') */
  id: string;
  /** Section category */
  category: DiscoveryCategory;
  /** Small uppercase category kicker / telemetry label */
  eyebrow: string;
  /** Primary section headline */
  title: string;
  /** Optional section explanatory text */
  description?: string;
  /** Discoverable items contained in this section */
  items: DiscoveryItem[];
  /** Availability state of this section */
  availability: ContentAvailability;
  /** Optional total count available from remote provider */
  totalAvailable?: number;
}

/**
 * Top-level Discovery content payload.
 */
export interface DiscoveryPayload {
  /** Sections included in this discovery dataset */
  sections: DiscoverySectionData[];
  /** Overall availability state */
  availability: ContentAvailability;
  /** Provenance of the dataset */
  dataSource: ContentDataSource;
  /** Timestamp of last telemetry synchronization */
  lastUpdatedTimestamp: number;
  /** Optional attribution or compliance disclaimer */
  attributionNotice?: string;
}

/**
 * Local content provider contract compatible with future remote REST/GraphQL services.
 */
export interface DiscoveryContentProvider {
  /** Fetches all active discovery sections */
  getDiscoverySections(): Promise<DiscoveryPayload>;
  /** Fetches a single section filtered by category */
  getSectionByCategory(category: DiscoveryCategory): Promise<DiscoverySectionData | null>;
  /** Fetches a single item by its stable unique identifier */
  getItemById(id: string): Promise<DiscoveryItem | null>;
}
