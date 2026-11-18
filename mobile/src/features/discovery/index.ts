/**
 * Waymark 2100 — Discovery Feature Module Barrel
 *
 * Exports public types, verified sample content, local provider implementation,
 * and presentation/validation utilities and components.
 */

export type {
  DiscoveryCategory,
  DiscoveryIconToken,
  DiscoveryItemMetadata,
  DiscoveryItem,
  DiscoverySectionData,
  DiscoveryPayload,
  DiscoveryContentProvider
} from './types';
export * from './data/discoveryContent';
export * from './utils/discoveryPresentation';
export * from './components';
