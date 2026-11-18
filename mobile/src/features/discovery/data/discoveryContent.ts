/**
 * Waymark 2100 — Default Discovery Content & Local Provider
 *
 * Defines verified multimodal transit corridors, hubs, vehicle modes,
 * and curated passenger experiences. All items carry explicit `isSample: true`
 * and `dataSource: 'sample_data'` to ensure truthful telemetry.
 */

import {
  DiscoveryCategory,
  DiscoveryContentProvider,
  DiscoveryItem,
  DiscoveryPayload,
  DiscoverySectionData
} from '../types';

/**
 * Verified sample corridors connecting Sri Lanka's Waymark 2100 transit grid.
 */
export const SAMPLE_CORRIDOR_ITEMS: DiscoveryItem[] = [
  {
    id: 'disc-corridor-cmb-kdy',
    title: 'Colombo–Kandy Maglev Corridor',
    category: 'corridors',
    description: 'High-speed magnetic levitation link through the Kadugannawa mountain pass.',
    iconName: 'train',
    badgeText: 'LINE M4',
    metadata: {
      duration: '34 min',
      frequency: 'Every 8 min',
      status: 'nominal',
      modes: ['maglev'],
      stepFree: true,
      distanceKm: 115,
      nodeCode: 'CMB',
      lineCode: 'M4'
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View corridor',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-corridor-rat-skyport',
    title: 'Ratmalana Skyport Feeder',
    category: 'corridors',
    description: 'Autonomous air shuttle corridor with direct ground connections to Fort Central.',
    iconName: 'plane',
    badgeText: 'LINE A7',
    metadata: {
      duration: '18 min',
      frequency: 'Every 12 min',
      status: 'nominal',
      modes: ['air', 'bus'],
      stepFree: true,
      distanceKm: 24,
      nodeCode: 'RAT',
      lineCode: 'A7'
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View corridor',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-corridor-south-coastal',
    title: 'Southern Coastal Maglev',
    category: 'corridors',
    description: 'Protected coastal express linking Colombo Central with Galle Marine Terminal.',
    iconName: 'route',
    badgeText: 'LINE M1',
    metadata: {
      duration: '42 min',
      frequency: 'Every 15 min',
      status: 'advisory',
      modes: ['maglev'],
      stepFree: true,
      distanceKm: 118,
      nodeCode: 'CMB',
      lineCode: 'M1'
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View corridor',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  }
];

/**
 * Key multimodal interchanges and terminals across the network.
 */
export const SAMPLE_HUB_ITEMS: DiscoveryItem[] = [
  {
    id: 'disc-hub-cmb-fort',
    title: 'Colombo Fort Central Interchange',
    category: 'hubs',
    description: 'Primary urban interchange bridging subterranean maglev with automated bus loops.',
    iconName: 'compass',
    badgeText: 'CENTRAL HUB',
    metadata: {
      status: 'nominal',
      modes: ['maglev', 'bus', 'walk'],
      stepFree: true,
      nodeCode: 'CMB'
    },
    actionDestination: '/(tabs)/map',
    actionLabel: 'Explore hub',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-hub-rat-skyport',
    title: 'Ratmalana Skyport Terminal',
    category: 'hubs',
    description: 'Elevated quad-vertiport terminal serving passenger shuttles and regional air links.',
    iconName: 'plane',
    badgeText: 'SKYPORT',
    metadata: {
      status: 'nominal',
      modes: ['air', 'bus'],
      stepFree: true,
      nodeCode: 'RAT'
    },
    actionDestination: '/(tabs)/map',
    actionLabel: 'Explore hub',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-hub-kdy-terminal',
    title: 'Kandy City Terminal',
    category: 'hubs',
    description: 'Hill country gateway station with direct mountain funicular and maglev concourses.',
    iconName: 'map-pin',
    badgeText: 'TERMINAL',
    metadata: {
      status: 'nominal',
      modes: ['maglev', 'bus'],
      stepFree: true,
      nodeCode: 'KDY'
    },
    actionDestination: '/(tabs)/map',
    actionLabel: 'Explore hub',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  }
];

/**
 * Active transit modes operating on the Waymark 2100 grid.
 */
export const SAMPLE_MODE_ITEMS: DiscoveryItem[] = [
  {
    id: 'disc-mode-maglev',
    title: 'Maglev High-Speed Rail',
    category: 'modes',
    description: 'Vacuum-shielded magnetic levitation cruising at 450 km/h with zero emissions.',
    iconName: 'train',
    badgeText: '450 KM/H',
    metadata: {
      status: 'nominal',
      modes: ['maglev'],
      stepFree: true
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View routes',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-mode-air-shuttle',
    title: 'Autonomous Air Shuttle',
    category: 'modes',
    description: 'Clean electric vertical takeoff and landing craft flying designated weather-safe corridors.',
    iconName: 'plane',
    badgeText: 'SKY CORRIDOR',
    metadata: {
      status: 'nominal',
      modes: ['air'],
      stepFree: true
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View flights',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-mode-smart-bus',
    title: 'Automated Smart Bus',
    category: 'modes',
    description: 'Platoon-capable autonomous streetcars with prioritized green wave transit signaling.',
    iconName: 'bus',
    badgeText: 'RAPID TRANSIT',
    metadata: {
      status: 'nominal',
      modes: ['bus'],
      stepFree: true
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'View lines',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  }
];

/**
 * Curated passenger experiences and accessibility travel profiles.
 */
export const SAMPLE_EXPERIENCE_ITEMS: DiscoveryItem[] = [
  {
    id: 'disc-exp-low-sensory',
    title: 'Low-Sensory Quiet Journey',
    category: 'experiences',
    description: 'Carriages with subdued warm lighting, noise-cancellation zones, and silent boarding.',
    iconName: 'shield',
    badgeText: 'ACCESSIBLE',
    metadata: {
      stepFree: true,
      status: 'nominal'
    },
    actionDestination: '/(tabs)/comfort',
    actionLabel: 'Configure profile',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  },
  {
    id: 'disc-exp-panoramic',
    title: 'Central Highlands Skyway',
    category: 'experiences',
    description: 'Observation deck cabins on elevated viaducts passing through misty hill tea plantations.',
    iconName: 'sparkles',
    badgeText: 'SCENIC',
    metadata: {
      stepFree: true,
      status: 'nominal'
    },
    actionDestination: '/(tabs)/journey',
    actionLabel: 'Explore trip',
    isEnabled: true,
    isSample: true,
    dataSource: 'sample_data'
  }
];

/**
 * Standard Discovery Sections grouped by category.
 */
export const DEFAULT_DISCOVERY_SECTIONS: DiscoverySectionData[] = [
  {
    id: 'section-corridors',
    category: 'corridors',
    eyebrow: 'TRANSIT NETWORK',
    title: 'Featured Corridors',
    description: 'High-frequency inter-city connections across the island grid.',
    items: SAMPLE_CORRIDOR_ITEMS,
    availability: 'available',
    totalAvailable: SAMPLE_CORRIDOR_ITEMS.length
  },
  {
    id: 'section-hubs',
    category: 'hubs',
    eyebrow: 'INTERCHANGES',
    title: 'Major Transit Hubs',
    description: 'Multimodal transfer stations connecting regional and aerial networks.',
    items: SAMPLE_HUB_ITEMS,
    availability: 'available',
    totalAvailable: SAMPLE_HUB_ITEMS.length
  },
  {
    id: 'section-modes',
    category: 'modes',
    eyebrow: 'FLEET CAPABILITIES',
    title: 'Multimodal Transit Network',
    description: 'Seamless transitions between rail, air, and automated road vehicles.',
    items: SAMPLE_MODE_ITEMS,
    availability: 'available',
    totalAvailable: SAMPLE_MODE_ITEMS.length
  },
  {
    id: 'section-experiences',
    category: 'experiences',
    eyebrow: 'COMFORT & DISCOVERY',
    title: 'Curated Travel Experiences',
    description: 'Personalized transit profiles for quiet, scenic, and express travel.',
    items: SAMPLE_EXPERIENCE_ITEMS,
    availability: 'available',
    totalAvailable: SAMPLE_EXPERIENCE_ITEMS.length
  }
];

/**
 * Baseline Discovery Payload incorporating all verified sections.
 */
export const defaultDiscoveryPayload: DiscoveryPayload = {
  sections: DEFAULT_DISCOVERY_SECTIONS,
  availability: 'available',
  dataSource: 'sample_data',
  lastUpdatedTimestamp: 1731916800000,
  attributionNotice: 'Waymark 2100 Multimodal Transit Authority · Illustrative Network Telemetry'
};

/**
 * Local asynchronous Discovery content provider.
 * Implements the DiscoveryContentProvider contract, allowing future remote REST/GraphQL
 * backends to be plugged in without changing consuming components.
 */
export class LocalDiscoveryContentProvider implements DiscoveryContentProvider {
  private payload: DiscoveryPayload;

  constructor(initialPayload: DiscoveryPayload = defaultDiscoveryPayload) {
    this.payload = initialPayload;
  }

  /**
   * Returns all active discovery sections wrapped in the payload.
   */
  async getDiscoverySections(): Promise<DiscoveryPayload> {
    return Promise.resolve({
      ...this.payload,
      sections: this.payload.sections.map((section) => ({
        ...section,
        items: [...section.items]
      }))
    });
  }

  /**
   * Fetches a single discovery section matching the given category.
   */
  async getSectionByCategory(category: DiscoveryCategory): Promise<DiscoverySectionData | null> {
    const section = this.payload.sections.find((s) => s.category === category);
    if (!section) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...section,
      items: [...section.items]
    });
  }

  /**
   * Fetches an individual discovery item by its stable ID across all sections.
   */
  async getItemById(id: string): Promise<DiscoveryItem | null> {
    for (const section of this.payload.sections) {
      const match = section.items.find((item) => item.id === id);
      if (match) {
        return Promise.resolve({ ...match });
      }
    }
    return Promise.resolve(null);
  }
}

/**
 * Default singleton instance of the local provider.
 */
export const defaultDiscoveryProvider = new LocalDiscoveryContentProvider();
