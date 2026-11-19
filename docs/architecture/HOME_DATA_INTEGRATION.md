# Waymark Mobile — Home Data Provider Architecture
## Feature 03.4 — Technical Specification & Data Integration Design

**Owner:** Sathu (`sathurjanv.23@uom.lk`)  
**Reviewer:** Janu (`januka-karunakaran`)  
**Milestone:** Feature 03.4 — Home Data Integration & State Management  
**Status:** In Progress (Task 3.4.1 Complete)

---

## 1. Architectural Motivation & Context

In earlier milestones (Feature 03.1, 03.2, 03.3), the Home screen (`mobile/app/(tabs)/index.tsx`) and its child presentation modules rendered directly from static fixture constants:

```typescript
// Legacy direct fixture binding
const [content] = useState(defaultHomeContent);
const [discovery] = useState(defaultDiscoveryPayload);
```

While this baseline provided immediate visual validation for layout, typography, navigation shortcuts, and accessible card touch targets, it introduced architectural coupling:
1. **Fixture Immutability Concerns:** Direct references to exported constants expose datasets to accidental in-memory mutation across tabs or lifecycle events.
2. **Missing Asynchronous Boundary:** Transitioning to cached schedules (SQLite/SecureStore) or future dispatch telemetry would require rewrites of presentation components.
3. **Dual Provider Disconnect:** Discovery content established an asynchronous provider pattern (`DiscoveryContentProvider`, `LocalDiscoveryContentProvider`), but Home lacked a matching provider abstraction.

Feature 03.4 establishes an asynchronous, strongly typed provider architecture for the Home domain, creating an isolated, testable boundary that preserves truthful sample provenance.

---

## 2. Core Provider Contracts

### 2.1 `HomeContentProvider` Contract

Defined in `mobile/src/features/home/providers/HomeContentProvider.ts`:

```typescript
export interface HomeContentProvider {
  /**
   * Retrieves the complete strongly typed home screen dataset.
   */
  getHomeContent(): Promise<HomeScreenData>;

  /**
   * Optional convenience method to retrieve only the suggested active route.
   */
  getSuggestedRoute?(): Promise<HomeSuggestionContent | null>;

  /**
   * Optional convenience method to retrieve configured quick places shortcuts.
   */
  getQuickPlaces?(): Promise<HomeQuickPlaceNode[]>;
}
```

Consuming screens and hooks depend exclusively on this interface rather than concrete classes or static constants.

### 2.2 `DiscoveryContentProvider` Contract

The Home screen presents Discovery sections as part of the unified passenger experience. The existing provider in `mobile/src/features/discovery/types.ts` is leveraged without modification:

```typescript
export interface DiscoveryContentProvider {
  getDiscoverySections(): Promise<DiscoveryPayload>;
  getSectionByCategory(category: DiscoveryCategory): Promise<DiscoverySectionData | null>;
  getItemById(id: string): Promise<DiscoveryItem | null>;
}
```

---

## 3. Local In-Memory Provider Implementation

### 3.1 `LocalHomeContentProvider`

Implemented in `mobile/src/features/home/providers/LocalHomeContentProvider.ts`, this class provides an in-memory asynchronous provider satisfying the contract:

- **Defensive Deep Copying:** Returns fresh clones of `hero`, `suggestion`, `quickPlaces`, `architectureStatus`, and `accessibilityNotice`. Mutating an array or nested object from a consumer does not pollute the source dataset or other consumers.
- **Data Validation & Sanitization:** If initialized with partial or malformed data, `isValidHomeScreenData` detects inconsistencies and `sanitizeHomeScreenData` provides safe fallbacks.
- **Truthful Provenance:** Preserves `dataSource: 'sample_data'` and `isSample: true`. The provider never artificially upgrades mock data to live telemetry.
- **Zero Artificial Latency:** Uses direct `Promise.resolve(...)` with no simulated network delays or `setTimeout` constructs. Async mechanics are genuine and immediate.

```typescript
export class LocalHomeContentProvider implements HomeContentProvider {
  private data: HomeScreenData;

  constructor(initialData: HomeScreenData = defaultHomeContent) {
    if (!isValidHomeScreenData(initialData)) {
      this.data = cloneHomeScreenData(sanitizeHomeScreenData(initialData));
    } else {
      this.data = cloneHomeScreenData(initialData);
    }
  }

  async getHomeContent(): Promise<HomeScreenData> {
    return Promise.resolve(cloneHomeScreenData(this.data));
  }
}

export const defaultHomeProvider = new LocalHomeContentProvider();
```

---

## 4. Data Provenance & Telemetry Integrity

Waymark 2100 is an advanced futuristic transit concept application. In accordance with project integrity standards:
- All Home routes, recommendations, and status indicators are explicitly classified with `dataSource: 'sample_data'`.
- Suggested active routes feature `isSample: true`.
- Architecture status modules represent diagnostic test harness state (`isDeveloperContent: true`).
- Accessibility statements are designated `verificationLevel: 'informational'`, pending physical platform inspection.

The provider boundary strictly protects these designations, ensuring downstream state controllers cannot misrepresent demo data as real-time vehicle dispatch telemetry.

---

## 5. Roadmap Across Feature 03.4 Tasks

| Task | Title | Scope & Objectives |
| :--- | :--- | :--- |
| **3.4.1** | Home Data Provider Architecture | Defined `HomeContentProvider`, implemented `LocalHomeContentProvider`, defensive deep cloning, validation, unit tests. |
| **3.4.2** | Async Loading & Refresh | Provider-driven state hook (`useHomeData`), dual provider composition (Home + Discovery), pull-to-refresh. |
| **3.4.3** | Offline & Error Recovery | Offline state resilience, network banner alignment, error recovery retry workflows. |
| **3.4.4** | Integration, Performance & QA | End-to-end integration tests, performance auditing, accessibility validation, comprehensive QA report. |
