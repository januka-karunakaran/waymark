# Waymark 2100 — Native Mobile Architecture

**Document Owner:** Sathu (`sathurjanv.23@uom.lk`)  
**Collaborator:** Janu (`karunakaranj.23@uom.lk`)  
**Milestone:** Feature 01 — Native Mobile Foundation  
**Target Branch:** `develop`

---

## 1. Architectural Philosophy

The Waymark Mobile application transforms the speculative 2100 "Night Transit" web paradigm into a high-performance, native Android and iOS client. Rather than relying on a WebView wrapper, it is architected as a pure React Native application with Expo and TypeScript, engineered for mission-critical telemetry, sensory accessibility, and resilient offline commuting.

### Key Architectural Pillars:
1. **Side-by-Side Coexistence:** The mobile application lives within `mobile/`, completely isolated from the web codebase, preserving existing web build tooling and assets.
2. **Strict Type Safety:** Fully typed interfaces for transit models, telemetry schemas, navigation routes, and API responses with TypeScript `strict: true`.
3. **Resilience & Offline First:** Graceful handling of network loss during subterranean transit (Maglev tunnels, deep station conduits) with state tracking, error boundaries, and local fallback telemetry.
4. **Hardware-Backed Security:** Sensitive tokens and traveler session data are stored in hardware keystores (`expo-secure-store`) rather than unencrypted storage.
5. **Universal Sensory Accessibility:** First-class support for screen readers, accessible contrast ratios (WCAG AAA 7:1), haptic feedback, and user-calibrated sensory densities.

---

## 2. Directory Structure & Layer Separation

```text
waymark/
├── mobile/
│   ├── app/                               # Expo Router file-based navigation tree
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx                # Bottom tab bar (Home, Map, Journey, Oracle, Comfort)
│   │   │   ├── index.tsx                  # Home screen (Active mission summary & telemetry)
│   │   │   ├── map.tsx                    # Live multimodal radar map
│   │   │   ├── journey.tsx                # Turn-by-turn mission timeline
│   │   │   ├── oracle.tsx                 # AI concierge & avionics assistant
│   │   │   └── comfort.tsx                # Sensory calibration & preferences
│   │   ├── _layout.tsx                    # Root layout (SafeAreaProvider, ErrorBoundary, NetInfo banner)
│   │   └── +not-found.tsx                 # 404 Corridor Not Found screen
│   │
│   ├── src/                               # Application source code
│   │   ├── components/                    # Reusable native UI components
│   │   │   ├── ScreenWrapper.tsx          # Safe-area and telemetry header wrapper
│   │   │   ├── LoadingIndicator.tsx       # Accessible telemetry loading state
│   │   │   ├── ErrorState.tsx             # Fault presentation with retry callback
│   │   │   ├── EmptyState.tsx             # Missing data / zero-vector state
│   │   │   ├── ErrorBoundary.tsx          # Global crash handler with reboot action
│   │   │   └── NetworkStatusBanner.tsx    # Offline link alert banner
│   │   │
│   │   ├── theme/                         # Night Transit Design Tokens
│   │   │   ├── colors.ts                  # Abyss Void, Beacon Gold, Train Teal, etc.
│   │   │   ├── typography.ts              # Lexend typography scale with tabular figures
│   │   │   ├── spacing.ts                 # Ergonomic spacing, border radii, touch bounds
│   │   │   └── index.ts                   # Unified theme export
│   │   │
│   │   ├── services/                      # Infrastructure and API client layer
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts           # Resilient HTTP client with timeouts & interceptors
│   │   │   │   ├── apiError.ts            # Standardized, user-safe error model
│   │   │   │   └── types.ts               # Request, response, and interceptor contracts
│   │   │   └── storage/
│   │   │       └── secureStorage.ts       # Hardware Keystore/Keychain wrapper
│   │   │
│   │   ├── hooks/                         # Custom React hooks
│   │   │   └── useNetworkStatus.ts        # NetInfo connection & internet reachability hook
│   │   │
│   │   ├── utils/                         # Validation, sanitization, logging, config
│   │   │   ├── config.ts                  # Typed environment configuration loader
│   │   │   ├── logger.ts                  # Safe telemetry logger with PII masking
│   │   │   └── validation.ts              # Input sanitization and coordinate validators
│   │   │
│   │   ├── types/                         # Global domain type definitions
│   │   │   ├── transit.ts                 # Transit modes, nodes, legs, and routes
│   │   │   └── navigation.ts              # Navigation route params
│   │   │
│   │   └── constants/                     # Static operational constants
│   │       ├── api.ts                     # Timeouts, headers, default endpoints
│   │       └── config.ts                  # App metadata, storage keys, default settings
│   │
│   ├── assets/                            # Native app icons, splash screens, favicons
│   ├── __tests__/                         # Automated test suite (Jest + RNTL)
│   ├── .env.example                       # Environment template without secrets
│   ├── .eslintrc.js                       # Strict code linting rules
│   ├── .prettierrc                        # Standardized code formatting
│   ├── app.json                           # Expo application manifest
│   ├── babel.config.js                    # Babel compilation configuration
│   ├── jest.config.js                     # Test runner configuration
│   ├── jest.setup.js                      # Native module mocks (NetInfo, SecureStore, etc.)
│   ├── package.json                       # Mobile dependencies and execution scripts
│   └── tsconfig.json                      # Strict TypeScript compiler options
│
├── docs/                                  # Project documentation
│   ├── architecture/
│   │   ├── EXISTING_PROJECT_AUDIT.md      # Web codebase audit and migration matrix
│   │   ├── MOBILE_ARCHITECTURE.md         # This architectural specification
│   │   └── MIGRATION_PLAN.md              # Staged migration roadmap across features
│   └── CONTRIBUTING.md                    # Engineering guidelines, git workflow, and PR policy
│
└── .github/
    └── workflows/
        └── mobile-ci.yml                  # PR validation workflow for develop branch
```

---

## 3. Core Subsystems

### A. Navigation & Routing (Expo Router)
* **File-based routing:** Powered by `expo-router` v4, routing matches folder hierarchy under `mobile/app/`.
* **Deep linking:** Configured with scheme `waymark://` in `app.json`.
* **Tab Hierarchy:** 5 primary tabs mirrored from the verified web architecture:
  * `Home` (`index.tsx`): Active route suggestions, origin/destination inputs.
  * `Live map` (`map.tsx`): Multimodal vector radar canvas.
  * `Journey` (`journey.tsx`): Turn-by-turn mission legs.
  * `Oracle` (`oracle.tsx`): AI transit concierge.
  * `Comfort` (`comfort.tsx`): Sensory and accessibility calibration.

### B. Theme & Design System (`src/theme/`)
* **Night Transit Paradigm:** Faithfully implements the specifications from `waymark_2100/DESIGN.md`.
* **Colors:** Deep Abyss Void ground (`#070A0F`), Beacon Gold (`#FFC629`), Maglev Train Teal (`#2DD4BF`), Bus Coral (`#FF7A59`), and Air Shuttle Sky (`#7CC4FF`).
* **Typography:** `tabular-nums` enforced on numeric telemetry readouts to eliminate temporal jitter during continuous updates.
* **Touch Targets:** Ergonomic minimum 48px × 48px interactive envelopes.

### C. Resilient API Client (`src/services/api/`)
* **Timeouts:** Configurable request timeouts (default 15,000ms) executed via `AbortController`.
* **Interceptors:** Extensible request and response pipelines for automatic token injection and telemetry header stamping (`X-Client-Platform: waymark-mobile-native`).
* **Safe Error Handling:** Translates internal network/server anomalies into safe, commuter-facing error descriptions via `ApiError.toUserSafeMessage()`.
* **Token Provider:** Decoupled token retrieval interface ready for integration with Janu's Authentication module (Feature 04).

### D. Secure Storage (`src/services/storage/`)
* Uses `expo-secure-store` to encrypt credentials and session tokens inside iOS Keychain and Android Keystore.
* Fallback error handling ensures the app does not crash if hardware storage is temporarily unavailable.

### E. Network Resilience & Offline Detection (`src/hooks/useNetworkStatus.ts`)
* Real-time network listener tracking connectivity (`isConnected`) and internet reachability (`isInternetReachable`).
* Active `NetworkStatusBanner` informs the user when entering subterranean tunnels or disconnected nodes, shifting to cached telemetry mode.

### F. Global Error Boundary (`src/components/ErrorBoundary.tsx`)
* Top-level component catching uncaught rendering exceptions.
* Presents an avionics fault recovery UI with a single-tap **Reboot Avionics** reset action.

---

## 4. Platform Specifications

| Platform | Target OS | Package / Bundle ID | Architecture | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Android 10+ (API 29+) | `com.waymark.app` | React Native New Architecture (`newArchEnabled: true`) | Minimal permissions (Least privilege) |
| **iOS** | iOS 15.1+ | `com.waymark.app` | React Native New Architecture (`newArchEnabled: true`) | Minimal permissions |
