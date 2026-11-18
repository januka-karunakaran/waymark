# Waymark 2100 — Home Screen Content & Architecture Audit

**Feature Owner:** Sathu (`sathurjanv.23@uom.lk`)  
**Reviewer:** Janu (`karunakaranj.23@uom.lk`)  
**Milestone:** Feature 03.1 — Home Screen Foundation (Task 3.1.1)  
**Target Branch:** `main`

---

## 1. Executive Summary

This audit establishes a maintainable, strongly typed content architecture for the **Waymark Mobile Home Screen**. Prior to this task, the mobile Home screen (`mobile/app/(tabs)/index.tsx`) hardcoded developer-facing architecture diagnostics alongside illustrative transit routes without separating data from presentation or distinguishing simulated demo data from verified live feeds.

Task 3.1.1 formalizes the content models in `mobile/src/features/home/` with explicit data provenance, content availability states, safe handling of optional fields, and honest classification of simulated telemetry.

---

## 2. Audit of Existing Home Implementations

### A. Web Prototype (`src/main.jsx`, lines 63–75)
The original web prototype introduced several conceptual sections:
1. **Section Heading:** "Good morning, navigator" / "Where would you like to *go?*" / "One trip. Every way to travel. Bus, train, air and smart roads, planned together."
2. **Setup Banner:** "Make Waymark fit you. It takes 30 seconds." with Customize and Dismiss actions.
3. **Suggested Route Card:** Illustrative "KDU Gate to Kandy City Centre" card ("Avoids monsoon ground surge · Air Shuttle flight sync ready") navigating to active journey.
4. **Autonomous Route Planner:** Form fields with origin node lock (`KDU Gate, Ratmalana`), interactive destination input (`Kandy City Centre`), voice button mockup, and quick place nodes (Home, Work, Kandy, Colombo, Airport, More).
5. **Accessibility Status Row:** "Step-free routes are included by default".

### B. Mobile Foundation Screen (`mobile/app/(tabs)/index.tsx`)
In Feature 01, the mobile screen was created as an initial technical foundation dashboard:
1. **Developer Eyebrow & Headline:** "FOUNDATION READY · SATHU FEATURE 01" / "Waymark Mobile" / "Production-quality native mobile foundation for planetary transit telemetry."
2. **Hardcoded Suggestion Card:** "SUGGESTED ACTIVE ROUTE" / "LEAVE NOW" / "KDU Gate → Kandy City" / "Avoids monsoon ground surge · Air Shuttle flight sync ready".
3. **Telemetry Foundation Architecture Panel:** Displays module status (`THEME & TOKENS`, `API SERVICE`, `STORAGE ENGINE`, `RESILIENCE`) marked as "OPERATIONAL".
4. **Accessibility Row:** "Universal step-free routes guaranteed across all nodes".

---

## 3. Data Classification & Honesty Audit

| Element | Current Representation | Audit Finding | Classification & Remediation |
| :--- | :--- | :--- | :--- |
| **Headline & Eyebrow** | "FOUNDATION READY · SATHU FEATURE 01" | Developer-facing milestone status; not suitable for commuter product experience. | Classified as `isDeveloperContent: true`. To be replaced with user-friendly Hero in Task 3.1.2. |
| **Suggested Route Card** | "KDU Gate → Kandy City" | Static mock data. Real GPS corridor telemetry does not yet exist. | Explicitly tagged as `isSample: true` and `dataSource: 'sample_data'`. UI must never claim this is a live feed. |
| **Architecture Modules Grid** | "THEME & TOKENS", "API SERVICE" | Purely developer diagnostic verification. | Modelled under `HomeArchitectureStatus` with `isDeveloperContent: true`. |
| **Accessibility Statement** | "Universal step-free routes guaranteed across all nodes" | Overbroad claim; no live routing solver exists yet to guarantee 100% corridor step-free status. | Tagged as `verificationLevel: 'informational'`, `isVerifiedStepFree: false`. Avoids misleading guarantees. |
| **Quick Place Nodes** | Web had Home, Work, Kandy, Colombo, Airport, More | Valid user shortcuts that should be represented as typed data models. | Formalized under `HomeQuickPlaceNode[]`. |

---

## 4. Strongly Typed Content Architecture

The new architecture separates business data into `mobile/src/features/home/`:

```text
mobile/src/features/home/
├── types.ts                      # Strongly typed interfaces and union types
├── data/
│   └── homeContent.ts            # Default verified and sample dataset
├── utils/
│   └── homePresentation.ts       # Validation, sanitization, and formatting helpers
├── __tests__/
│   └── homeContent.test.ts       # Automated test suite
└── index.ts                      # Clean feature export barrel
```

### Core Type Contracts:

```typescript
// Explicit data availability
export type ContentAvailability =
  | 'available'
  | 'loading'
  | 'empty'
  | 'error'
  | 'sample';

// Data provenance
export type ContentDataSource =
  | 'live_telemetry'
  | 'cached_schedule'
  | 'sample_data'
  | 'user_preference';

// Complete Home Screen Model
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
```

---

## 5. Future API & Live Telemetry Transition Strategy

1. **Decoupled Presentation:** Visual components in `mobile/app/(tabs)/index.tsx` and future feature components consume `HomeScreenData` interfaces rather than inline constants.
2. **Safe Fallbacks via Sanitizer:** `sanitizeHomeScreenData()` guarantees that partial responses or failed API calls default cleanly without crashing the UI.
3. **Async Ready:** `ContentAvailability` (`'loading' | 'empty' | 'error' | 'available'`) is directly compatible with TanStack Query / `fetch` states for future backend endpoints.
4. **Zero Regressions:** Task 3.1.1 preserves 100% of existing visual presentation while migrating the underlying data structure to typed models.
