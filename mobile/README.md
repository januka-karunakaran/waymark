# Waymark 2100 Mobile (Native Application)

The official native mobile application for **Waymark 2100** — Planetary Transit Network, built with **React Native**, **Expo**, and **TypeScript**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.development`:
```bash
cp .env.example .env.development
```

Key environment options:
* `EXPO_PUBLIC_API_URL`: Base URL for the transit telemetry API.
* `EXPO_PUBLIC_API_TIMEOUT_MS`: Request timeout in milliseconds (default: `15000`).
* `EXPO_PUBLIC_APP_ENV`: `development` | `staging` | `production`.
* `EXPO_PUBLIC_ENABLE_AIR_SHUTTLES`: Feature flag for high-altitude VTOL corridors.
* `EXPO_PUBLIC_ENABLE_OFFLINE_CACHE`: Feature flag for subterranean offline caching.

### 3. Run Application
```bash
# Start Metro bundler
npm run start

# Launch on Android
npm run android

# Launch on iOS (macOS required)
npm run ios

# Launch in Web browser
npm run web
```

---

## 🧪 Testing & Validation

All tests and validation scripts must pass before submitting a Pull Request:

```bash
# TypeScript Typecheck
npm run typecheck

# ESLint Code Quality
npm run lint

# Jest Unit Tests
npm run test

# Jest Unit Tests with Coverage Report
npm run test:coverage
```

---

## 🏛️ Mobile Architecture Overview

```text
mobile/
├── app/               # Expo Router navigation (tabs, layout, 404)
├── src/
│   ├── components/    # Reusable native components (ScreenWrapper, Loading, Error, Empty)
│   ├── theme/         # Night Transit design system (colors, typography, spacing)
│   ├── services/      # Resilient ApiClient with timeouts & SecureStorageService
│   ├── hooks/         # Custom hooks (useNetworkStatus)
│   ├── utils/         # Config, logger, input sanitization
│   └── constants/     # API constants, storage keys
├── assets/            # App icons and splash screens
└── __tests__/         # Comprehensive Jest unit tests
```

---

## 🔗 Relationship to Web Application

* The mobile app coexists inside the root Waymark repository in `mobile/`.
* It preserves the original web application in `src/`, `public/`, and `index.html`.
* It translates the design system in `waymark_2100/DESIGN.md` into typed React Native theme tokens.

---

## 📋 Feature Roadmap & Handoff

* **Feature 01 (Sathu):** Mobile Foundation, Architecture & CI ✅
* **Feature 02 (Janu):** Design System & Navigation Experience ⏳ (Next)
* **Feature 03 (Sathu):** Autonomous Route Planner & Place Nodes
* **Feature 04 (Janu):** Authentication & Commuter Profiles
* **Feature 05 (Sathu):** Live Radar & Vector Map
* **Feature 06 (Janu):** Active Mission Journey & Timeline
* **Feature 07 (Sathu):** Oracle AI Transit Concierge
* **Feature 08 (Janu):** Comfort & Sensory Calibration
* **Feature 09 (Sathu):** Release Hardening & Deployment Pipeline

See `docs/architecture/MIGRATION_PLAN.md` for full implementation details.
