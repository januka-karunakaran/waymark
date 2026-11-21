# Waymark Mobile — Feature 04.3: Supabase Authentication Architecture & Specifications

**Document Version:** 1.0.0  
**Status:** Approved Architecture Specification  
**Author:** Janu (`januka-karunakaran` | `karunakaranj.23@uom.lk`)  
**Reviewer:** Sathu (`Sathurjanv23` | `sathurjanv.23@uom.lk`)  
**Application:** Waymark Mobile (`waymark-mobile` / Expo SDK 52 / React Native / TypeScript)  
**Date:** November 21, 2026  

---

## 1. Provider Decision

Waymark Mobile selects **Supabase Auth** (`@supabase/supabase-js`) as its primary identity provider:
1. **Developer & Production Parity:** Modern TypeScript SDK, PostgreSQL-native Row Level Security (RLS), and standards-compliant JWT issuance.
2. **Platform & Expo SDK 52 Alignment:** First-class compatibility with React Native 0.76.6, Expo Router 4, and `expo-secure-store`.
3. **Decoupled Architecture:** Supabase Auth is integrated behind Waymark's existing `AuthService` abstraction layer. Core application logic and UI components remain completely agnostic of the concrete identity vendor.
4. **Safety & Zero-Deception:** When Supabase credentials are not configured, the client falls back cleanly to `UnavailableAuthService` with zero synthetic user records or mock tokens.

---

## 2. Repository & Existing Architecture Audit

Prior to Feature 04.3, the authentication system was structured into:
- **Feature 04.1 (Foundation):** Defined domain types (`AuthUser`, `AuthSession`, `AuthError`, `AuthResult`), `AuthService` contract, `UnavailableAuthService`, platform session storage (`NativeAuthSessionStorage`, `WebAuthSessionStorage`), and `AuthProvider`.
- **Feature 04.2 (UI):** Built the `(auth)` route group (`account.tsx`, `sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`) with truthful standby degradation, password masking, client validation, and 100% public 5-tab guest navigation.

### Identified Risks & Resolutions
- **Risk A (Single Context Authority):** Confirmed `mobile/app/_layout.tsx` mounts `<AuthProvider>` as the single global auth boundary.
- **Risk B (Storage Conflict Prevention):** Instead of dual competing session managers, Supabase's client storage is configured to write directly into our platform-compliant storage adapter (`NativeSupabaseStorage` / `WebMemorySupabaseStorage`).
- **Risk C (Credential Exposure):** Strict regex audits prevent service-role keys from ever being accepted in client configuration. Passwords and tokens are excluded from logs.

---

## 3. Required Configuration

Supabase integration requires two public client environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
```

- **Validation Rules:**
  - `url`: Must be a valid URL starting with `https://` for remote environments, or `http://localhost` / `http://127.0.0.1` for local development.
  - `publishableKey`: Must be a non-empty string $\ge 20$ characters. Keys containing `service_role` are rejected with a critical error.
  - Legacy alias support: `EXPO_PUBLIC_SUPABASE_ANON_KEY` is recognized as an alternative to `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## 4. Client Initialization & Lifecycle

Implemented in `mobile/src/features/auth/providers/supabaseClient.ts`:
- **Singleton Guarantee:** `getSupabaseClient()` maintains a memoized instance, preventing duplicate WebSocket/GoTrue listener allocations across re-renders.
- **Zero-Network Standby:** If credentials are missing or invalid, `getSupabaseClient()` returns `null` immediately. Zero background sockets, timers, or network requests are dispatched when unconfigured.
- **Configuration Reset:** `resetSupabaseClient()` allows unit tests and credential reloaders to purge cached singletons deterministically.

---

## 5. Token Storage Policy

Supabase Auth uses a custom storage adapter conforming to:
```ts
export interface SupabaseAuthStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}
```

- **Native (iOS & Android):** Stored encrypted in iOS Keychain and Android KeyStore via `expo-secure-store`.
- **Web:** Kept strictly in transient in-memory storage (`WebMemorySupabaseStorage`). Persisting tokens in browser `localStorage` or `sessionStorage` is strictly prohibited by Waymark security policy to eliminate XSS token theft vectors.
- **No Password Persistence:** Passwords exist solely in ephemeral memory during submission and are never saved to any storage.

---

## 6. Native vs. Web Differences

| Dimension | Native (iOS / Android) | Web |
|---|---|---|
| **Storage Engine** | `expo-secure-store` (Hardware Keystore) | In-Memory `Map<string, string>` |
| **Persistence Across Reloads** | Yes (Keystore retention) | No (Purged upon page reload) |
| **XSS Vulnerability** | N/A (Sandboxed native app) | Zero token exposure (no web storage) |
| **Deep Linking** | Native scheme (`waymark://`) | Window callback path |

---

## 7. Provider Factory & Fallback Architecture

Implemented in `mobile/src/features/auth/providers/authServiceFactory.ts`:

```mermaid
flowchart TD
    AppStart["App Startup / AuthProvider"] --> Factory["createAuthService()"]
    Factory --> CheckConfig{"getSupabaseConfig().isConfigured"}
    CheckConfig -->|False (Missing/Invalid Keys)| Fallback["UnavailableAuthService (serviceReadiness: 'not_configured')"]
    CheckConfig -->|True (Valid URL & Key)| Real["SupabaseAuthService (serviceReadiness: 'ready')"]
    Fallback --> ZeroDeception["Truthful Standby UI / Guest Browsing"]
    Real --> LiveAuth["Genuine Provider Authentication (Task 04.3.2+)"]
```

- When unconfigured, `createAuthService()` returns `unavailableAuthService`.
- Guarantees zero synthetic authenticated sessions, fake tokens, or mock accounts in production.

---

## 8. Security Boundaries

1. **No Service-Role Keys:** Client rejects any key containing `"service_role"`.
2. **Sanitized Telemetry:** Loggers mask sensitive credentials (`email`, `password`, `accessToken`, `refreshToken`).
3. **Re-entrancy Protection:** Form submissions and network dispatches are locked while operations are in-flight.
4. **Least Privilege:** Public client interacts with Supabase using standard unprivileged anon roles; database-level security relies on Row Level Security (RLS).

---

## 9. Email & Redirect Configuration

When configuring the Supabase Project Dashboard:
- **Email Auth:** Enable Email provider with email confirmation requirements.
- **Redirect URLs:**
  - Development: `waymark://auth/callback` and `exp://*` (for Expo Go).
  - Production: `waymark://auth/callback` (custom scheme matching `app.json`).
- **Deep Linking:** Uses Expo Router with deep-link resolution handling.

---

## 10. Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp mobile/.env.example mobile/.env
   ```
2. Populate `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Confirm `.env` is listed in `.gitignore`.

---

## 11. Known Limitations

- **Physical Device Validation:** Native hardware Keystore validation is tested in automated Jest environments; physical device testing will occur during release qualification.
- **Live Provider Testing:** Requires an active Supabase project; automated test suites use mock doubles to avoid calling live third-party backends during CI.

---

## 12. Feature 04.3 Implementation Roadmap

| Task | Scope | Commit Message | PR Target | Status |
|---|---|---|---|---|
| **04.3.1** | Supabase Architecture & Secure Configuration | `feat(mobile): configure real auth provider architecture` | `main` | Merged (PR #49) |
| **04.3.2** | Real Sign-In & Registration Adapter | `feat(mobile): integrate real sign-in and registration` | `main` | **Current Task** |
| **04.3.3** | Session Lifecycle, Verification & Recovery | `feat(mobile): implement auth session and recovery lifecycle` | `main` | Planned |
| **04.3.4** | Real Auth UI Integration & Final QA | `test(mobile): complete real authentication integration QA` | `main` | Planned |

---

## 13. Real Sign-In & Registration Architecture (Task 04.3.2)

### 13.1 Provider Adapter Implementation
The `SupabaseAuthService` implements the `AuthService` interface:
- **Sign-In:** Calls `supabase.auth.signInWithPassword({ email, password })`. Validates provider responses, extracts genuine access and refresh tokens, and converts Unix second expiration timestamps to UTC milliseconds.
- **Sign-Up:** Calls `supabase.auth.signUp({ email, password, options: { data } })`. Accurately distinguishes between registrations that return an immediate session and those requiring out-of-band email verification (`session: null`).
- **Sign-Out:** Calls `supabase.auth.signOut()` idempotently.
- **Service Readiness:** Accurately reflects `'ready'` when backed by an initialized client and `'not_configured'` when unconfigured.

### 13.2 Identity & Session Mapping Guarantees
- **`AuthUser` Mapping:** Provider user IDs (UUID) are preserved directly. Display names are safely extracted from `user_metadata` or derived from the email prefix with sanitization. Verification state is bound to `email_confirmed_at`.
- **`AuthSession` Mapping:** Validates presence of `access_token` and maps `expires_at` into UTC milliseconds (`expires_at * 1000`).
- **Enumeration Protection:** If Supabase returns an empty `identities` list on registration (user already exists), the adapter sets `requiresVerification: true` and withholds session creation to prevent account enumeration.

### 13.3 Security & Zero-Deception Controls
1. **Zero Credential Persistence:** Neither `SupabaseAuthService` nor storage layers retain passwords in memory, properties, or logs.
2. **Token Sanitization in Errors:** Error mappers ensure upstream responses with tokens, project identifiers, or auth headers are sanitized into generic domain `AuthError` instances.
3. **In-Flight Request Deduplication:** Concurrent identical sign-in or sign-up dispatches for the same email are deduplicated to avoid duplicate network dispatches.
4. **Zero Simulated Success:** Authentication and registration strictly depend on genuine provider outcomes.

