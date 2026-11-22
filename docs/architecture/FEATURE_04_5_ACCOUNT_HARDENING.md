# Waymark Mobile — Feature 04.5: Account Security, Settings & Hardening Architecture

## 1. Overview & Objective

**Feature 04.5** serves as the security, settings, and authorization hardening phase of the Waymark 2100 mobile identity architecture. It solidifies account management by introducing:
1. **Truthful Account Settings & Privacy Controls (Task 04.5.1)**: Dedicated settings surface providing clear identity status, session storage disclosures, zero-tracking commitments, and legitimate navigation links without fabricated toggles or dummy account deletion flows.
2. **Saved Places Integration & Private Navigation (Task 04.5.2)**: Bridging authenticated Home/Work corridors with Home quick actions while strictly eliminating sensitive address leakage from navigation parameters and deep-link query strings.
3. **Database RLS, Session & Authorization Verification (Task 04.5.3)**: Real multi-tenant PostgreSQL Row Level Security policy audits, isolated test suites, hardware token validation, and session lifecycle verification.
4. **Final Feature 04 Comprehensive QA & Handoff (Task 04.5.4)**: Cross-cutting regression testing across Features 04.1 through 04.5, WCAG 2.1 AA accessibility sign-off, and milestone certification.

---

## 2. Task 04.5.1 Architecture: Account Settings & Privacy Controls

### 2.1 Route Architecture
- **Route Path**: `mobile/app/(auth)/settings.tsx`
- **Layout Integration**: Mounted cleanly inside `mobile/app/(auth)/_layout.tsx` Stack without creating duplicate headers or disrupting tab navigation.
- **Entry Points**:
  - Accessible via `AccountScreen` (`mobile/app/(auth)/account.tsx`) through `btn-account-settings` (authenticated) and `btn-account-settings-guest` (guest).
  - Can be navigated to and returned from using standard Expo Router stack gestures and back actions.

### 2.2 Security & Privacy Boundaries
- **Trusted Identity Sourced from AuthProvider**:
  - Registered email, verification status, and user identifier are retrieved strictly from `useAuth()` (backed by Supabase Session).
  - Display name is safely augmented from `useProfile()` and never assumed to be verified identity.
- **Session State Modeling**:
  - `SYS.AUTH_VERIFIED`: Active authenticated session with tokens stored in hardware-backed secure storage.
  - `SYS.GUEST_MODE`: Anonymous browsing mode with zero private records loaded into memory.
  - Prevents race conditions and duplicate actions through `isSigningOut` guards.
- **Data Protection & Storage Transparency**:
  - **Remote Tier**: Supabase PostgreSQL with strict Row Level Security (RLS) policies. Profiles and places are queryable only by the authenticated JWT subject (`auth.uid() = id`).
  - **Local Device Tier**: JWT access/refresh tokens are stored in hardware-backed secure storage (`expo-secure-store`, backed by iOS Keychain and Android Keystore).
  - **Memory-Only Cache**: User profile, saved corridors, and travel preferences exist in React state during active session only.
  - **Sign-Out Boundary**: Immediate purge of all in-memory profile and location state. Deletion of session tokens from device storage. Remote records remain safely protected on the server.
  - **Zero Telemetry**: No continuous GPS tracking, health, or disability telemetry is stored or collected.

### 2.3 Truthful Action Controls & Unimplemented Capabilities
- **No Decorative Toggles**: No fake switches for location tracking, biometrics, or notifications that lack backing database tables or system permissions.
- **Milestone 05 Data Rights**: Automated account deletion and bulk data export are transparently disclosed as scheduled engineering capabilities for Milestone 05. A contact route (`privacy@waymark.app`) is provided for manual requests, avoiding simulated or broken instant-deletion buttons.

---

## 3. Supported Navigation Matrix

| Origin | Target | Action Trigger | Authentication Requirement | Purpose |
|---|---|---|---|---|
| `/(auth)/account` | `/(auth)/settings` | `btn-account-settings` | Any (Auth or Guest) | Open settings & privacy policy |
| `/(auth)/settings` | `/(auth)/account` | `btn-settings-return-account` | Authenticated | Return to account overview |
| `/(auth)/settings` | `/(auth)/account` | `btn-settings-saved-places` | Authenticated | Manage Home, Work, and Favorites |
| `/(auth)/settings` | `/(auth)/account` | `btn-settings-preferences` | Authenticated | Adjust transit modes & units |
| `/(auth)/settings` | `/(tabs)` | `btn-settings-return-home` | Any (Auth or Guest) | Return to planetary transit dashboard |
| `/(auth)/settings` | `/(auth)/sign-in` | `btn-settings-sign-in` | Guest Only | Authenticate with existing Waymark ID |
| `/(auth)/settings` | `/(auth)/sign-up` | `btn-settings-sign-up` | Guest Only | Create new Waymark ID |

---

## 4. Quality & Accessibility Guarantees
- **WCAG 2.1 AA Compliance**:
  - Touch targets exceed 48x48dp.
  - Accessible labels and descriptive hints on all buttons (`accessibilityLabel`, `accessibilityHint`).
  - Clear contrast ratios matching Waymark 2100 high-contrast design tokens.
  - Screen reader semantic announcements for headers, status badges, and action outcomes.
- **Automated Test Coverage**:
  - `mobile/src/features/auth/__tests__/AccountSettings.test.tsx` (16 test cases covering TC-04.5.1-01 to TC-04.5.1-16).

---

## 5. Upcoming Tasks in Feature 04.5
- **Task 04.5.2**: Saved Places Integration & Private Navigation (eliminate PII from router query parameters; resolve trusted in-memory/user-scoped handoff).
- **Task 04.5.3**: Supabase RLS, Session & Account Security Verification (audit PostgreSQL policies, test cross-tenant boundaries, and verify session lifecycle).
- **Task 04.5.4**: Final Feature 04 End-to-End QA & Handoff (complete 22+ section QA audit and release documentation).
