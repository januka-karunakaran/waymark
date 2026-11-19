# Waymark Mobile — Feature 03.5 Performance Audit & Optimization Report
## Task 3.5.1 — Home Performance Audit & Targeted Optimization

**Repository:** `https://github.com/januka-karunakaran/waymark.git`  
**Feature:** 03.5 — Home Performance, Security & Final Testing  
**Task:** 3.5.1 — Performance Audit & Targeted Optimization  
**Owner:** Sathu (`sathurjanv.23@uom.lk`)  
**Reviewer:** Janu (`karunakaranj.23@uom.lk`)  
**Date:** November 19, 2026  
**Status:** IMPLEMENTED · QA VERIFIED  

---

## 1. Executive Summary & Goals

Feature 03.5 establishes production-grade performance, lifecycle resilience, and interaction stability across the Waymark Mobile Home, Discovery, and Journey modules. Task 3.5.1 focuses strictly on **measured, reproducible bottlenecks** rather than speculative or unverified memoization:

1. **Eliminate Race Conditions & Stuck Loading Flags:** Fix an asynchronous race condition where an overlapping pull-to-refresh during initial provider query leaves `isLoading === true` permanently.
2. **Prevent Redundant In-Flight Provider Fetches:** Deduplicate simultaneous non-refresh load/reload requests through `isLoadingRef`.
3. **Decouple Reconnection Effect Dependencies:** Eliminate unnecessary re-evaluations of the network recovery effect when local error or fallback states change, stabilizing hook execution.
4. **Remove Unnecessary Layout Re-renders:** Convert `discoveryOffsetY` state in `HomeContent` to a mutable ref (`discoveryOffsetYRef`), eliminating a forced re-render on every mount and window layout event.
5. **Protect Against Navigation Multi-Taps:** Extend navigation locking (`isNavigatingRef`) to suggestion routes, discovery items, and discovery category chips, preventing duplicate route pushes during rapid user interactions.
6. **Clean Up Asynchronous Timers on Unmount:** Guarantee that pending navigation unlock timers are cleared if `HomeScreen` unmounts during a transition.
7. **Stabilize UI Render Allocations:** Wrap `HomeHero`, `HomeSection`, and `HomeContent` in `React.memo`, memoize responsive container styles, and provide stable callback references.

---

## 2. Test Environment & Measurement Methods

### Test Environment
- **Runtime:** Node.js v20.x, React 18.3.1, React Native 0.76.7 (Expo SDK 52)
- **Engine:** Metro bundler / Jest 29.x with `@testing-library/react-native`
- **Profiling Tooling:** React profiling, component re-render counters, mock timers (`jest.useFakeTimers()`), and lifecycle spy instrumentation
- **Host System:** Windows 11 Developer Workspace
- **Evidence Boundaries:** All measurements recorded herein are derived from reproducible automated test suites, mock render trees, and lifecycle assertions. In accordance with project instructions, physical device frame rates (FPS) and memory footprints are not claimed without physical hardware profiling.

---

## 3. Initial Observations & Identified Bottlenecks

### Bottleneck A: Race Condition in `useHomeData` Leaving `isLoading` Active Indefinitely
- **Mechanism:** In `useHomeData`, `executeFetch` increments `requestIdRef.current`. If an initial query (`isRefresh: false`) is in flight and the user initiates pull-to-refresh (`isRefresh: true`), the request ID advances. When the first query finishes, it detects that it is superseded (`currentRequestId !== requestIdRef.current`) and aborts before state setting. In its `finally` block, because `currentRequestId !== requestIdRef.current`, `setIsLoading(false)` was skipped! When the subsequent refresh finished, it only cleared `isRefreshing`. Consequently, `isLoading` remained `true` permanently, leaving the UI in an inconsistent loading state.
- **Classification:** Asynchronous state race condition / UI lock bug.

### Bottleneck B: Missing In-Flight Deduplication for Non-Refresh Queries
- **Mechanism:** `isRefreshingRef.current` prevented duplicate pull-to-refresh triggers, but there was no corresponding `isLoadingRef.current` for standard loads. Repeated calls to `reload()` or simultaneous mount/retry triggers caused duplicate concurrent calls to `homeProvider.getHomeContent()` and `discoveryProvider.getDiscoverySections()`.
- **Classification:** Redundant compute / duplicate provider invocation.

### Bottleneck C: Unnecessary Layout Re-render in `HomeContent`
- **Mechanism:** `HomeContent` stored `discoveryOffsetY` in `React.useState`. On mount and every layout recalculation, `onLayout` called `setDiscoveryOffsetY`, forcing an immediate second render cycle of the entire Home component tree. However, `discoveryOffsetY` is only used inside `handlePlacePress` when scrolling to Discovery upon tapping "More".
- **Classification:** Avoidable full-tree re-render.

### Bottleneck D: Navigation Multi-Tap Vulnerability
- **Mechanism:** `handleSelectPlace` checked `isNavigatingRef.current` to prevent duplicate navigation. However, `handleSelectSuggestion`, `handleSelectDiscoveryItem`, and `handleSelectDiscoveryCategory` had no guard. Rapid taps on "Start this route" or discovery cards caused multiple `router.push` calls before the transition completed.
- **Classification:** Redundant router dispatches / navigation race.

### Bottleneck E: Unhandled Timer Cleanup on Unmount
- **Mechanism:** In `HomeScreen`, `handleSelectPlace` called `setTimeout(() => setIsNavigating(false), 500)`. If the screen unmounted prior to 500ms, the callback executed on an unmounted component, generating React warnings and potential memory leaks.
- **Classification:** Unmounted component state update / timer leak.

---

## 4. Implemented Optimizations & Architecture Changes

### 1. Unified Lifecycle & Request Synchronization in `useHomeData.ts`
- Added `isLoadingRef = useRef<boolean>(false)`.
- Enforced in-flight query deduplication: non-refresh queries return early if `isLoadingRef.current` is already true.
- Guaranteed in `finally` that if any request completes as the latest request, both `isLoadingRef.current` and `isLoading` are reset to `false`.
- Stabilized network recovery `useEffect` by using refs for error and fallback status, depending solely on `[networkStatus?.isConnected, autoRecoverOnReconnect, executeFetch]`.

### 2. Layout Optimization in `HomeContent.tsx`
- Replaced `useState` for `discoveryOffsetY` with `useRef<number | null>(null)`.
- Updated `onLayout` to assign directly to `discoveryOffsetYRef.current`, eliminating redundant render cycles.
- Memoized responsive container styles using `React.useMemo` based on `[isTablet, isCompact, activeTheme, contentContainerStyle]`.
- Stabilized `renderItem` callback for Discovery sections via `React.useCallback`.
- Wrapped `HomeContent`, `HomeHero`, and `HomeSection` with `React.memo`.

### 3. Navigation Hardening in `HomeScreen` (`app/(tabs)/index.tsx`)
- Guarded all navigation handlers (`handleSelectSuggestion`, `handleSelectPlace`, `handleSelectDiscoveryItem`, `handleSelectDiscoveryCategory`) against multi-taps using `isNavigatingRef.current`.
- Stored navigation reset timers in `navTimerRef = useRef<NodeJS.Timeout | null>(null)` and cleared pending timers upon unmount.
- Wrapped all screen-level callbacks in `React.useCallback`.

---

## 5. Before vs. After Measurement Verification

| Metric / Scenario | Baseline (Pre-Optimization) | Optimized (Task 3.5.1) | Result |
| :--- | :--- | :--- | :--- |
| **Overlapping Initial Load & Refresh** | `isLoading` remained `true` permanently after refresh | `isLoading` properly resets to `false` | **RACE ELIMINATED** |
| **Concurrent `reload()` Invocations** | 2 concurrent provider calls | 1 provider call (deduplicated) | **50% REDUNDANCY CUT** |
| **HomeContent Mount Render Count** | 2 full renders (mount + onLayout state) | 1 full render (mount only, ref layout) | **50% FEWER INITIAL RENDERS** |
| **Rapid Multi-Tap on Suggestion** | 3 duplicate `router.push` calls | 1 single `router.push` call | **MULTIPLE PUSH PREVENTED** |
| **Rapid Multi-Tap on Discovery Card** | 3 duplicate `router.push` calls | 1 single `router.push` call | **MULTIPLE PUSH PREVENTED** |
| **Screen Unmount During Navigation** | `setTimeout` timer executed unmounted update | Timer cleanly cancelled in unmount effect | **CLEAN TEARDOWN** |
| **Sample Provenance Integrity** | Preserved (`sample_data`) | Preserved (`sample_data`) | **VERIFIED** |

---

## 6. Limitations of Evidence

1. **Simulation Bounds:** Benchmarks reflect Jest/Node mock environments with simulated React lifecycle events and synthetic layout notifications.
2. **Device Hardware:** Real-world mobile GPU draw time and frame rates vary across low-end Android and high-refresh iOS devices; hardware profiling will be required during staging builds.
3. **Network Telemetry:** Providers currently use `LocalHomeContentProvider` and `LocalDiscoveryContentProvider` with defensive zero-latency clones; future HTTP/WebSocket adapters in Feature 05 will introduce network latency dynamics.
