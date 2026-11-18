# Waymark 2100 — Discovery Content & Data Architecture

**Feature Owner:** Sathu (`sathurjanv.23@uom.lk`)  
**Reviewer:** Janu (`karunakaranj.23@uom.lk`)  
**Milestone:** Feature 03.2 — Discovery Sections & Content (Task 3.2.1)  
**Target Branch:** `main`  
**Feature Branch:** `feature/sathu-03-02-discovery`

---

## 1. Executive Summary

Feature 03.2 introduces the **Discovery Sections & Content** capability to Waymark Mobile. Commuters on the Waymark 2100 multimodal transit grid need intuitive ways to explore:
1. **Featured Corridors:** High-speed inter-city connections (Maglev lines, aerial feeders, coastal routes).
2. **Major Transit Hubs:** Transfer interchanges and skyport vertiports (Colombo Fort Central, Ratmalana Skyport, Kandy Terminal).
3. **Multimodal Fleet Modes:** High-speed vacuum maglev rail, autonomous electric air shuttles, and automated precision street buses.
4. **Curated Passenger Experiences:** Accessible low-sensory quiet carriages and scenic panoramic observation decks.

Task 3.2.1 establishes the foundational domain models, content provider interface, validation and defensive sanitization logic, and verified sample data.

---

## 2. Core Domain Models

The architecture is implemented under `mobile/src/features/discovery/` with strict TypeScript typing:

### A. Discovery Category (`DiscoveryCategory`)
Categorizes discoverable items into 4 verified transit domains:
- `'corridors'`: High-speed inter-city transit lines (e.g., Colombo–Kandy Maglev Corridor Line M4).
- `'hubs'`: Interchanges, skyports, and multimodal transit nodes (e.g., Colombo Fort Central CMB).
- `'modes'`: Vehicle types and fleet capabilities (e.g., Maglev, Autonomous Air Shuttle, Smart Bus).
- `'experiences'`: Specialized travel profiles (e.g., Low-sensory quiet journey, Central Highlands Skyway).

### B. Discovery Item (`DiscoveryItem`)
A single discoverable transit entity:
```typescript
export interface DiscoveryItem {
  id: string;                         // Stable unique identifier (e.g., 'disc-corridor-cmb-kdy')
  title: string;                      // Display title
  category: DiscoveryCategory;        // Corridors | hubs | modes | experiences
  description?: string;               // Optional descriptive summary
  iconName?: DiscoveryIconToken;      // 'route' | 'map-pin' | 'plane' | 'train' | 'bus' | 'compass' | 'sparkles' | 'shield'
  badgeText?: string;                 // Badge or line indicator (e.g., 'LINE M4', 'CENTRAL HUB')
  metadata?: DiscoveryItemMetadata;   // Operational telemetry (duration, frequency, modes, stepFree, nodeCode, lineCode)
  actionDestination?: string;         // Navigation route target (e.g., '/(tabs)/journey')
  actionLabel?: string;               // CTA button label (e.g., 'View corridor')
  isEnabled?: boolean;                // Whether the interactive action is currently active
  isSample: boolean;                  // Explicitly flags simulated data
  dataSource: ContentDataSource;      // 'sample_data' | 'local_cache' | 'remote_api' | 'user_configured'
}
```

### C. Discovery Section (`DiscoverySectionData`)
Logical grouping of items by category, supporting independent availability states:
```typescript
export interface DiscoverySectionData {
  id: string;
  category: DiscoveryCategory;
  eyebrow: string;
  title: string;
  description?: string;
  items: DiscoveryItem[];
  availability: ContentAvailability; // 'available' | 'loading' | 'empty' | 'error' | 'stale'
  totalAvailable?: number;
}
```

### D. Discovery Payload (`DiscoveryPayload`)
Top-level payload containing all active sections, overall availability, and synchronization telemetry:
```typescript
export interface DiscoveryPayload {
  sections: DiscoverySectionData[];
  availability: ContentAvailability;
  dataSource: ContentDataSource;
  lastUpdatedTimestamp: number;
  attributionNotice?: string;
}
```

---

## 3. Data Provenance & Truthful Telemetry

In strict accordance with project safety guidelines:
1. **Sample Flagging:** All local sample items are explicitly tagged with `isSample: true` and `dataSource: 'sample_data'`.
2. **No Fabricated Telemetry:** Discovery items do not claim real-time GPS tracking or live departure guarantees. Operational statuses (`nominal`, `advisory`) represent scheduled or baseline conditions.
3. **Accessibility Disclosure:** Step-free tags indicate design standards for Waymark 2100 rolling stock and facilities, not dynamic elevator outage guarantees.

---

## 4. Discovery Content Provider Architecture

To decouple UI components from static data files and allow smooth forward migration to remote APIs (Feature 05+), the provider pattern is defined:

```typescript
export interface DiscoveryContentProvider {
  getDiscoverySections(): Promise<DiscoveryPayload>;
  getSectionByCategory(category: DiscoveryCategory): Promise<DiscoverySectionData | null>;
  getItemById(id: string): Promise<DiscoveryItem | null>;
}
```

### `LocalDiscoveryContentProvider`
The local implementation implements `DiscoveryContentProvider`, serving immutable copies of `defaultDiscoveryPayload`. It supports injection of alternative payloads for deterministic unit testing.

---

## 5. Defensive Utilities & Validation

Under `mobile/src/features/discovery/utils/discoveryPresentation.ts`:
- **Type Guards:** `isValidDiscoveryItem`, `isValidDiscoverySection`, `isValidDiscoveryPayload` perform runtime shape validation.
- **Sanitizer (`sanitizeDiscoveryPayload`):** Strips corrupted items, removes duplicate IDs, assigns fallback category values, and ensures non-null payloads even when invalid input is supplied.
- **Identifier Protection (`hasDuplicateIdentifiers`, `deduplicateDiscoveryItems`):** Enforces unique key constraints required by React Native VirtualizedList / FlatList.
- **Summary Formatter (`formatDiscoveryMetadataSummary`):** Generates human-readable subtitle chips (e.g., `34 min · Every 8 min · Line M4`) dynamically from available metadata without throwing on empty or partial fields.
