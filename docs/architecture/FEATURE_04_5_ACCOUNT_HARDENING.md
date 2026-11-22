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

## 5. Task 04.5.2 Architecture: Saved Places Integration & Private Navigation

### 5.1 Investigation & Findings (A, B, C)
1. **Finding A (Home/Work Integration Defect)**:
   - *Root Cause*: The Home screen invoked `resolveHomeQuickAction(place)` with no options parameter. As a result, `options.savedAddresses` was always undefined, causing Home and Work shortcuts to permanently yield an `unconfigured` status even when the signed-in user had saved them.
   - *Fix*: `HomeScreen` now accesses `useAuth()` and `useProfile()`, supplying `{ savedAddresses: isAuthenticated ? savedAddresses : undefined }` to `resolveHomeQuickAction`.
2. **Finding B (PII Exposure via Router Query Parameters)**:
   - *Vulnerability*: Previously, quick actions serialized personal addresses directly into Expo Router navigation parameters (`params: { destinationName: "123 Private St" }`). On web clients and deep links, this exposed sensitive home/work coordinates in browser history, logs, analytics, and URL bars.
   - *Fix*: Navigation parameters now pass strictly opaque, non-sensitive identifiers (`params: { destinationId: 'dest-saved-home' }`). Private addresses are never serialized into route query strings.
3. **Finding C (Untrusted Query Parameter Authorization)**:
   - *Vulnerability*: `validateJourneyParams` previously accepted any `dest-saved-*` query string as long as it passed basic regex sanitization, allowing arbitrary destination names to be rendered without proving user ownership.
   - *Fix*: `validateJourneyParams` and `JourneyScreen` now require authenticated user context and verified database records from `useProfile()`. Untrusted parameter destination names are strictly ignored for private saved corridors.

### 5.2 Private Navigation Handoff Architecture
```
[HomeScreen]
  │
  ├─ User taps "Home" or "Work" shortcut
  ├─ Evaluates resolveHomeQuickAction(place, { savedAddresses })
  ├─ Navigates with OPAQUE identifier ONLY:
  │    router.push({ pathname: '/(tabs)/journey', params: { destinationId: 'dest-saved-home' } })
  │    (NO address or PII in URL!)
  ▼
[JourneyScreen]
  │
  ├─ Reads params.destinationId ('dest-saved-home')
  ├─ Checks useAuth(): Is user authenticated?
  │    ├─ NO ➔ Displays "Authentication Required" empty state. Zero address rendered.
  │    └─ YES ➔ Queries useProfile().savedPlaces for kind === 'home'
  │               ├─ FOUND ➔ Renders destination with user's verified address.
  │               └─ NOT FOUND ➔ Displays "Unconfigured Saved Location" empty state.
```

### 5.3 Security Invariants & Guarantees
- **No Private Data in Router Params**: `createJourneyRouteParams` explicitly omits `destinationName` when `destinationId.startsWith('dest-saved-')`.
- **Zero Leakage on Logout / User Switch**: When a user signs out while viewing `JourneyScreen`, auth state immediately becomes null, causing private destination context to collapse into an empty state. When User B signs in, User B's verified corridor is retrieved; User A's data is never exposed.
- **Deep-Link Immunity**: Crafting a deep link like `waymark://journey?destinationId=dest-saved-home&destinationName=MaliciousPayload` fails because `JourneyScreen` strictly resolves private destinations from the authenticated user's profile store, ignoring the untrusted parameter.
- **Truthful Prototype Demarcation**: No fake GPS routes, turn-by-turn maneuvers, or simulated ETAs are fabricated for private destinations.

---

## 6. Task 04.5.3 Architecture: Supabase RLS, Session & Account Security Verification

### 6.1 Database Security Audit & Invariants
An architectural audit of the PostgreSQL database migration (`supabase/migrations/20261121000000_waymark_user_profile_foundation.sql`) confirmed the following security guarantees:
- **Row Level Security (RLS)**: Strictly enabled on all three application tables (`profiles`, `saved_places`, `traveler_preferences`).
- **Privilege Revocation**: Default privileges were explicitly revoked (`revoke all on ... from public, anon`). The unauthenticated `anon` role is granted zero SELECT, INSERT, UPDATE, or DELETE access.
- **Minimal Privilege Grant**: Only the `authenticated` role receives CRUD permissions, strictly mediated by RLS policies.
- **Ownership Invariance**:
  - `profiles`: SELECT, INSERT, UPDATE, DELETE all enforce `auth.uid() = id`. `with check (auth.uid() = id)` prohibits spoofing another user's ID during creation or modification.
  - `saved_places`: All operations enforce `auth.uid() = user_id`. `with check (auth.uid() = user_id)` guarantees rows can only be created or modified for the authenticated user's ID.
  - `traveler_preferences`: All operations enforce `auth.uid() = user_id`. `with check (auth.uid() = user_id)` guarantees traveler preferences cannot be forged or altered across user boundaries.
- **Relational Integrity**: Foreign keys cascade on user deletion (`references auth.users(id) on delete cascade`), ensuring orphan records are automatically expunged if a user account is removed.
- **Partial Unique Constraints**: Partial unique indexes `idx_saved_places_unique_home` and `idx_saved_places_unique_work` enforce at the database engine level that an account can possess at most one Home and one Work record.

### 6.2 Real RLS Test Infrastructure (`supabase/tests/feature_04_5_account_rls.test.sql`)
A dedicated pgTAP test suite was implemented in `supabase/tests/feature_04_5_account_rls.test.sql` comprising 26 distinct test cases executed within an isolated database transaction (`begin; ... rollback;`):
1. **Anonymous Caller Isolation (RLS-01 to RLS-10)**:
   - Proves `anon` role cannot SELECT rows from `profiles`, `saved_places`, or `traveler_preferences` (returns empty result set).
   - Proves `anon` role writes (INSERT, UPDATE, DELETE) are rejected with PostgreSQL error code `42501` (permission denied).
2. **Authenticated Multi-Tenant Isolation (RLS-11 to RLS-26)**:
   - Sets session JWT claims to User A (`sub: 00000000-0000-0000-0000-000000000001`).
   - Verifies User A can read and write own profile, saved places, and preferences.
   - Verifies User A querying User B (`sub: 00000000-0000-0000-0000-000000000002`) receives zero rows (empty set).
   - Verifies User A UPDATE/DELETE against User B targets affects zero rows.
   - Verifies User A INSERT attempting to spoof User B ownership is rejected by PostgreSQL `42501` WITH CHECK violation.
   - Verifies User A inserting a second Home location is rejected with PostgreSQL error code `23505` (unique constraint violation).

### 6.3 Real Migration Status
- **Current Status**: `APPLIED & VERIFIED LOCALLY / TEST ENVIRONMENT; CLOUD DEPLOYMENT PENDING LIVE AUTHORIZATION`
- **Audit Details**:
  - The SQL migration file `20261121000000_waymark_user_profile_foundation.sql` exists and has been verified against AST and pgTAP rules.
  - The client application relies strictly on publishable public keys (`EXPO_PUBLIC_SUPABASE_ANON_KEY`); zero service-role keys are exposed in the bundle or repository.
  - Live production deployment requires administrative Supabase dashboard execution or GitHub Actions deployment workflow with appropriate database backup procedures.

### 6.4 Session Lifecycle & Race-Condition Hardening
- **Sequence Tracking & In-Flight Cancellation**:
  - `ProfileContext` now maintains `profileOpSeqRef` and `activeUserIdRef`.
  - When a user logs out or switches accounts, the sequence counter is incremented and active user reference is updated immediately.
  - Late-arriving network responses from a previous session or in-flight query are discarded before they can mutate state or resurrect private information in guest mode.
- **Account Switching Isolation**:
  - Changing authenticated identity instantly resets in-memory `profile`, `savedPlaces`, and `preferences`, then initiates clean fetches scoped strictly to the new user ID.
- **Sensitive Data Redaction**:
  - Logger utility `maskSensitiveData` verifies that passwords, access tokens, refresh tokens, and JWT claims are redacted (`***MASKED***`) prior to any log output.

### 6.5 Automated Test Coverage
- `supabase/tests/feature_04_5_account_rls.test.sql`: 26 pgTAP test cases verifying database authorization.
- `mobile/src/features/profile/__tests__/AccountRLSSecurityVerification.test.ts`: 17 automated tests verifying migration structure, SQL test matrix, zero service-role key leakage, PostgREST error mapping, and sensitive data masking.
- `mobile/src/features/profile/__tests__/ProfileSessionIsolation.test.tsx`: 4 automated tests verifying race-condition resilience, late response rejection, and account switching isolation.

---

## 7. Upcoming Tasks in Feature 04.5
- **Task 04.5.4**: Final Feature 04 End-to-End QA & Handoff (comprehensive QA review of Features 04.1 through 04.5, release documentation, and milestone handoff).
