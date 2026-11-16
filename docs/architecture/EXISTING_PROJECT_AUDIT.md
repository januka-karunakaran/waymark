# Waymark 2100 — Existing Project Architecture & Codebase Audit

**Document Author:** Sathu (`sathurjanv.23@uom.lk`)  
**Collaborator:** Janu (`karunakaranj.23@uom.lk`)  
**Date:** November 2026  
**Repository:** `https://github.com/januka-karunakaran/waymark.git`  
**Current Branch Context:** `feature/sathu-mobile-foundation` (Branch base: `develop`)

---

## 1. Existing Project Overview

**Waymark 2100** is a speculative, high-concept multimodal transit navigation web application set in the year 2100 ("Night Transit" paradigm). The project simulates a planetary and urban navigation system that harmonizes diverse transit modes—ground bus rapid transit, underground/maglev rail, high-altitude VTOL air shuttles, and autonomous smart-road corridors—into unified, accessible commuter journeys.

The current implementation is an interactive single-page application (SPA) prototype featuring simulated commuter trips across Sri Lanka (specifically navigating from **KDU Gate, Ratmalana** to **Kandy City Centre** via multimodal legs). It emphasizes dark-mode avionics telemetry, sensory and cognitive accessibility calibration (step-free routing, audio guidance, sensory reduction), and real-time transit status indicators.

---

## 2. Verified Features & Source Files

Every verified feature was identified by inspecting actual repository source code rather than making assumptions:

| Feature / Capability | Source File(s) | Implementation Details & Verified Behavior |
| :--- | :--- | :--- |
| **App Shell & Top Navigation** | `src/main.jsx` (L35–57), `src/styles.css` | Sticky header with system telemetry (`SYS.LIVE`, `LATENCY 4ms`, `City network: running normally`), branding lockup, quick comfort settings trigger, and sticky bottom navigation bar. |
| **Hash-based Screen Router** | `src/main.jsx` (L20–29, 104) | Custom lightweight `useScreen` hook listening to `window.location.hash` changes. Coordinates transitions across `home`, `map`, `journey`, `oracle`, and `comfort`. |
| **Autonomous Route Planner (Home)** | `src/main.jsx` (L63–74) | Origin node lock (`KDU Gate, Ratmalana`), interactive destination text input (`Kandy City Centre`), voice search button mockup, quick destination presets (Home, Work, Kandy, Colombo, Airport, More), and accessibility baseline banner. |
| **Live Transit Map & List (Map)** | `src/main.jsx` (L76–87) | Segmented view switcher (`Map LIVE` vs `List view`). Embedded dynamic SVG canvas displaying vector paths for roads, air corridors, and train lines with glowing nodes (`you-ping`, `you-dot`). Telemetry coordinates display (`06°49'02"N / 79°53'18"E`). List view with transit arrival status tags (`ON TIME`, `SYNCED`). |
| **Active Mission Journey (Journey)** | `src/main.jsx` (L89–94) | Mission route header (`Route-A`), calculated target arrival time (`9:16 am`), step-free verification, trip credit cost (`4.8 Cr`), immediate action card ("Walk to Stop 3 in 4 min"), and multi-leg visual timeline (`Walk` ➔ `Bus B12` ➔ `Air Shuttle A7`). |
| **AI Transit Concierge (Oracle)** | `src/main.jsx` (L101–103) | Conversational transit assistant UI with quick prompt pills (*"When do I arrive?"*, *"Is the route accessible?"*, *"Find a quieter option"*), simulated context-aware transit responses, and 24/7 human backup help trigger. |
| **Comfort & Sensory Calibration** | `src/main.jsx` (L95–100) | Sensory and accessibility settings including interactive toggles for **Audio guidance** and **Quiet boarding**, and three-stage **Information density** selector (`Minimal`, `Standard`, `Detailed`). Live preview recalculates transit buffers and HUD profiles. |
| **Design System & Tokens** | `waymark_2100/DESIGN.md`, `src/styles.css` | Comprehensive design documentation defining the "Night Transit" paradigm: color tokens (Abyss Void `#070A0F`, Beacon Gold `#FFC629`, Train Teal `#2DD4BF`, Bus Coral `#FF7A59`, Air Sky `#7CC4FF`), typography rules (Lexend, tabular figures), elevation, radius (16px cards, 14px buttons), and WCAG AAA compliance. |
| **PWA & Offline Service Worker** | `public/manifest.webmanifest`, `public/sw.js`, `src/main.jsx` (L108–110) | Standalone PWA manifest with black-translucent status bar and service worker caching core app shell assets (`/`, `/index.html`, `/manifest.webmanifest`). |

---

## 3. Current Architecture

```text
Browser Client (PWA)
 ├── index.html (Root DOM mounting point, Google Fonts Lexend prefetch)
 └── src/
     ├── main.jsx (Single monolithic component tree containing all views and state)
     │    ├── useScreen (Hash-based client router)
     │    ├── AppShell (TopBar + Main + BottomNav)
     │    ├── Screens: Home, LiveMap, Journey, Comfort, Oracle
     │    └── Components: TransitMap, TransitList, RouteTimeline, SettingRow, etc.
     └── styles.css (Global CSS bundle with CSS custom properties and responsive media queries)
```

### Architectural Characteristics:
* **Single-Bundle Monolith:** All UI screens, layout shells, SVG graphics, interactive states, and mock responses are packed into a single `src/main.jsx` file (~110 lines of dense JSX).
* **Pure Client-Side State:** All data (current route, preferences, messages, timetable) resides in local React `useState` hooks. There is no external state management store (Zustand, Redux) or persistence layer (LocalStorage, IndexedDB).
* **Zero Backend Coupling:** No HTTP clients (`fetch`, `axios`), REST endpoints, GraphQL clients, or WebSocket connections exist. Network latency is simulated via static telemetry text.

---

## 4. Current Technology Stack

| Layer | Technology | Version | Notes / Observations |
| :--- | :--- | :--- | :--- |
| **Build Tooling** | Vite | `latest` (v6.x) | Fast ESM dev server and bundler. |
| **UI Library** | React & React DOM | `latest` (v19.x) | Uses `createRoot` and functional components. |
| **Compiler Plugin** | `@vitejs/plugin-react` | `latest` | Standard Vite React plugin. |
| **Iconography** | `lucide-react` | `latest` | High-quality SVG icon library. |
| **Styles** | Vanilla CSS3 | N/A | Heavy use of CSS variables (`:root`), flexbox, CSS grid, and media queries. |
| **PWA Shell** | Service Worker Cache API | N/A | Basic precaching in `sw.js`. |
| **Package Manager** | npm | v11.16.0 / Lockfile v3 | Root `package.json` with unpinned `"latest"` versions. |

---

## 5. Reusable Components & Logic

While web DOM elements (`<div>`, `<button>`, `<input>`, `<svg>`) cannot be pasted directly into React Native, significant intellectual property and specifications can be repurposed:

1. **Design System Tokens (`waymark_2100/DESIGN.md`):**
   * Color tokens (hex values, semantic color mappings, state colors).
   * Spacing scales (`space-xs` to `space-xl`).
   * Border radii (`sm`: 4px, `md`: 12px, `lg`: 16px).
   * Typography styles (font family, line heights, letter spacing, tabular numerals).
2. **Navigation Information Architecture:**
   * 5 core tabs: `Home`, `Live map`, `Journey`, `Oracle`, and `Comfort`.
   * Screen transition hierarchies (Home ➔ Journey ➔ Map).
3. **Domain Models & State Signatures:**
   * Transit vector definitions (`Bus`, `Maglev`, `Air Shuttle`, `Smart Road`, `Walk`).
   * Journey Leg data structures (Mode, origin node, destination node, transit duration, accessibility rating).
   * Comfort & sensory settings state structure (`quietBoarding: boolean`, `audioGuidance: boolean`, `informationDensity: 'Minimal' | 'Standard' | 'Detailed'`).
4. **Transit Telemetry Concepts:**
   * Coordinate readouts, altitude, speed calculations, and real-time status chips.

---

## 6. Technical Risks in Existing Codebase

1. **Unpinned Dependencies (`"latest"`):**
   * `package.json` declares `"react": "latest"`, `"vite": "latest"`, etc. This creates non-deterministic builds and introduces breaking upstream changes without warning.
2. **Monolithic Code Placement:**
   * Placing all UI screens, SVG graphics, mock datasets, and navigation into `src/main.jsx` makes isolated testing, modular development, and collaborative code reviews difficult.
3. **No Testing Infrastructure:**
   * Zero unit tests, integration tests, or linting configurations exist in the root repository.
4. **Hardcoded Web DOM SVG Map:**
   * `TransitMap` uses inline SVG elements (`<svg>`, `<path>`, `<circle>`, `<text>`) with hardcoded pixel coordinates designed for a 400x480 web viewport. This will not scale cleanly across varying mobile device aspect ratios and lacks native gesture interactions (pinch-to-zoom, pan).
5. **No Persistent Storage:**
   * User comfort settings and route inputs reset on page refresh because no persistent storage mechanism (such as `AsyncStorage` or SQLite) is hooked up.
6. **No Real API Layer or Error Boundaries:**
   * Absence of an API abstraction, request timeouts, network resilience checks, and error boundary components means network errors or runtime exceptions crash the entire application without recovery options.

---

## 7. Missing Mobile Requirements

To become a production-grade native Android and iOS application, the codebase lacks:
* **Native Runtime:** Expo SDK and React Native runtime integration.
* **Mobile-Safe Layouts:** Safe Area handling (notch, dynamic island, home indicator, status bars) via `react-native-safe-area-context`.
* **Mobile Navigation Stack:** Expo Router or React Navigation with native platform transitions, hardware back-button handling on Android, and deep-link routing.
* **Native Map Capabilities:** React Native Maps (`react-native-maps`) or Mapbox integration with native GPS hardware location services (`expo-location`).
* **Secure Storage:** Hardware-backed secure storage (`expo-secure-store` / Keychain / Keystore) for sensitive tokens and commuter session data.
* **Offline & Connectivity Awareness:** Hardware network monitoring (`@react-native-community/netinfo`) to handle tunnels, offline subway stations, and flight modes.
* **Mobile Accessibility:** Screen reader compatibility (`accessibilityLabel`, `accessibilityRole`, `accessible={true}`) for accessibility compliance.
* **Device Haptics & Audio:** Native haptic feedback (`expo-haptics`) and speech synthesis / voice recognition integration.

---

## 8. Website-to-Mobile Migration Strategy

To guarantee zero regression of the existing web application while systematically delivering the mobile platform, we adopt a **Side-by-Side Coexistence Pattern**:

1. **Preserve Web App Intact:**
   * All files in `src/`, `public/`, `index.html`, and root `package.json` remain untouched and functional for browser builds (`npm run dev`, `npm run build`).
2. **Dedicated Mobile Workspace (`mobile/`):**
   * The native React Native Expo application is created in a dedicated subdirectory (`waymark/mobile/`) with its own isolated `package.json`, TypeScript configuration, Jest test harness, and build scripts.
3. **Layered Mobile Architecture:**
   * Establish clean separation of concerns:
     * `src/theme/`: Shared design tokens extracted directly from `DESIGN.md`.
     * `src/components/`: Reusable native primitives (Safe Screen wrappers, Loading, Error, Empty states).
     * `src/services/`: Resilient API client with timeout, retry, and interceptor architecture.
     * `src/utils/`: Security sanitizers, loggers, network monitors, and validation helpers.
     * `app/`: Expo Router file-based route tree for native navigation.

---

## 9. Recommended Backend & Database Strategy

Since Waymark 2100 currently lacks a backend, we recommend the following production architecture for future milestones:

```text
Mobile Client (React Native / Expo)
   │  HTTPS / WSS (Mutual TLS / Secure Session Bearer Tokens)
   ▼
API Gateway / Backend Service (Node.js / Express / NestJS or Go)
   ├── Auth Service (OAuth2 / PKCE / Passkeys)
   ├── Transit Routing Engine (Multimodal graph solver, GTFS-RT / Realtime telemetry)
   ├── Telemetry & Fleet Dispatcher (Live speed, altitude, latency stream via WebSockets)
   └── Commuter Profile Service (Accessibility preferences, encrypted fare credits)
   │
   ├── Primary Database: PostgreSQL (PostGIS for geospatial corridor indexing)
   ├── Cache & Pub/Sub: Redis (real-time vehicle GPS ping tracking, ephemeral sessions)
   └── Secure Vault: KMS / Secret Manager
```

### Mobile Data & Offline Strategy:
* **Client-Side Cache:** WatermelonDB or SQLite (`expo-sqlite`) for offline schedule caching, allowing commuters in subterranean hyperloop tunnels to view active routes.
* **Secure Client Storage:** `expo-secure-store` for commuter ID credentials and API tokens.
* **State Synchronization:** TanStack Query (React Query) for server-state caching, automatic refetching on network reconnect, and optimistic mutations.

---

## 10. Feature Migration Matrix

| Feature from Website | Mobile Target Component | Action Needed | Notes / Adaptation Details |
| :--- | :--- | :--- | :--- |
| **Theme & Color Tokens** | `mobile/src/theme/` | **Reuse Directly (Adapt format)** | Convert YAML/CSS tokens from `DESIGN.md` into typed TypeScript theme objects (`colors`, `typography`, `spacing`, `radii`). |
| **App Shell & Topbar** | `mobile/src/components/ScreenWrapper.tsx` & `Header` | **Adaptation** | Replace HTML header and `env(safe-area-inset)` with React Native `SafeAreaView` and native status bar management. |
| **Bottom Navigation** | `mobile/app/(tabs)/_layout.tsx` | **Native Rewrite** | Replace custom `bottom-nav` DOM bar with native Expo Router bottom tabs (`lucide-react-native`). |
| **Route Planner (Home)** | `mobile/src/features/home/` | **Adaptation** | Replace HTML inputs with `TextInput`, `Pressable`, and native keyboard-avoiding views. |
| **Live SVG Map** | `mobile/src/features/map/` | **Native Rewrite** | Replace static HTML SVG with `react-native-svg` for vector overlays or `react-native-maps` for real geospatial positioning. |
| **Transit Arrivals List** | `mobile/src/features/map/` | **Adaptation** | Convert into a high-performance native `FlatList` with pull-to-refresh capabilities. |
| **Active Journey Timeline**| `mobile/src/features/journey/`| **Adaptation** | Adapt vertical timeline into native layout with dynamic time-to-departure countdowns. |
| **Oracle Transit Concierge**| `mobile/src/features/oracle/` | **Adaptation** | Replace basic query text handler with a native chat interface, keyboard dismissing, and voice input integration. |
| **Comfort Settings** | `mobile/src/features/comfort/`| **Adaptation** | Replace CSS toggles with native `Switch` components, persisting selections into local storage. |
| **PWA Service Worker** | `mobile/src/services/offline/`| **Native Rewrite** | Replace browser service worker with native `@react-native-community/netinfo` and local offline database cache. |
