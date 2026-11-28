# Waymark Mobile — Feature 05.3: Secure Reservation Engine & Booking Lifecycle
## Architecture Specification & Security Boundary (Task 05.3.1)

**Document:** `docs/architecture/FEATURE_05_3_RESERVATION_ENGINE.md`
**Milestone:** Feature 05 — Ticketing, Booking & Payments
**Subfeature:** 05.3 — Secure Reservation Engine, Inventory Allocation & Booking Lifecycle
**Task:** 05.3.1 — Secure Reservation API & Backend Foundation
**Owner:** Sathu (`Sathurjanv23` / `sathurjanv.23@uom.lk`)
**Reviewer:** Janu (`januka-karunakaran` / `karunakaranj.23@uom.lk`)
**Status:** DRAFTED · TASK 05.3.1 CODE COMPLETE (LIVE OPERATOR PENDING)
**Date:** November 28, 2026

---

## 1. Executive Summary & Objective

Feature 05.1 established the booking domain types and database foundation. Feature 05.2 implemented the mobile user interface and truthful state review.

**Feature 05.3** implements the trusted server-side mechanisms required to support secure transport reservations:
1. Authenticated reservation request ingestion.
2. Server-side departure verification and data provenance enforcement.
3. Server-side authoritative fare quotation validation.
4. Client preflight validation and secure mobile adapter (`RemoteBookingService`).
5. Safe fallback to `UnavailableBookingService` in production environments until live transport operators are integrated.
6. Zero client authority over pricing, ownership, or reservation confirmation.

---

## 2. Security Trust Boundary & High-Level Architecture

The mobile client is an untrusted node. Under no circumstances may client-supplied user IDs, pricing totals, or status fields be persisted or trusted.

```mermaid
flowchart TD
    Client["React Native Mobile UI\n(Untrusted Client Node)"]
    Adapter["RemoteBookingService Adapter\n(Preflight Validation & Auth Check)"]
    EdgeFn["Supabase Edge Function\n(booking-reservations)"]
    Auth["Supabase Auth Service\n(JWT Verification auth.getUser())"]
    OpAuth["ServerOperatorAuthority\n(Verify Catalog & Provenance)"]
    FareAuth["ServerFareAuthority\n(Verify Quote, Expiration & Minor Units)"]
    DB["PostgreSQL Database\n(RLS Protected Tables)"]

    Client -->|1. Submit BookingRequest| Adapter
    Adapter -->|2. Verified JWT Bearer| EdgeFn
    EdgeFn -->|3. Verify Token & Resolve auth.uid()| Auth
    EdgeFn -->|4. Verify Departure & Inventory Source| OpAuth
    EdgeFn -->|5. Validate Authoritative Quote & Pricing| FareAuth
    EdgeFn -.->|6. Atomic Inventory Hold (Task 05.3.2)| DB
    EdgeFn -->|7. Authoritative Hold Response| Adapter
    Adapter -->|8. Typed BookingResult| Client
```

### Key Security Invariants
- **Authentication:** All private operations (`reserve`, `get_booking`, `cancel`) require a valid Supabase Auth JWT. The server resolves `authenticatedUserId` directly from the token; any client-provided `userId` is strictly rejected.
- **Financial Authority:** Client requests cannot specify prices (`amountMinorUnits`, `price`, `totalAmount`). Prices are authoritatively calculated server-side from verified non-expired `FareQuote` references.
- **Lifecycle Integrity:** Clients cannot directly transition bookings to `confirmed` or `ticket_issued`. Holds default to `held` status and expire after a server-bounded validity duration (15 minutes).
- **Zero Direct Writes:** Mobile clients have `SELECT` grants only on `booking_reservations` (governed by `auth.uid() = user_id`). Direct client `INSERT`, `UPDATE`, or `DELETE` statements are strictly denied by PostgreSQL RLS.

---

## 3. Server-Side Modules & Edge Function Endpoints

The backend reservation boundary is encapsulated in `supabase/functions/booking-reservations/`:

```text
supabase/functions/booking-reservations/
├── index.ts                     # Main HTTP router, CORS, Auth verification, JSON size limits, error handling
├── handlers/
│   ├── reservationHandler.ts    # Action: 'reserve' - Validates payload, verifies operator/fare, returns held record
│   ├── bookingHandler.ts        # Action: 'get_booking' - Enforces ownership (auth.uid() = user_id)
│   ├── cancellationHandler.ts   # Action: 'cancel' - Enforces ownership and strict state transition checks
│   └── readinessHandler.ts      # Action: 'readiness' - Public diagnostic endpoint
├── validation/
│   └── reservationValidation.ts # Validates input bounds (1..9 passengers, 16..128 char idempotency keys)
├── services/
│   ├── fareAuthority.ts         # Authoritative quote verification (expiration, departure match, minor units)
│   └── operatorAuthority.ts     # Operator catalog verification (rejects sample_data)
└── types.ts                     # Request/response envelope and error interfaces
```

---

## 4. Error Model & Status Codes

All errors returned by the backend adhere to the unified `BookingErrorCode` model:

| Error Code | HTTP Status | Trigger Condition |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Missing, malformed, or expired Bearer JWT |
| `INVALID_REQUEST` | `400` | Input validation failure, forbidden client fields, oversized payload (>32KB), or malformed JSON |
| `INVENTORY_UNAVAILABLE` | `400` | Departure sold out, departed, or marked `sample_data` |
| `FARE_EXPIRED` | `400` | Authoritative quote timestamp has expired against server clock |
| `BOOKING_NOT_FOUND` | `404` | Booking ID not found or belongs to another user (anti-enumeration) |
| `INVALID_STATE_TRANSITION` | `400` | Attempting to cancel an already cancelled, confirmed, or expired booking |
| `NOT_CONFIGURED` | `400` | Live operator or fare quotation provider is unconfigured in production |
| `SERVICE_UNAVAILABLE` | `500` | Unhandled internal server or network failure |

---

## 5. Mobile Client Integration (`RemoteBookingService`)

The mobile client interacts with the backend via `RemoteBookingService`:
- **Preflight Validation:** Rejects malformed requests on the client before network dispatch to save bandwidth and battery.
- **Session Authentication Check:** Verifies an active session exists before making remote calls.
- **Production Safety Fallback:** `createBookingService()` and `getBookingService()` safely default to `UnavailableBookingService` unless explicitly instantiated with remote configuration in verified environments.
- **Ticket Issuance Guard:** `getTickets()` strictly returns `NOT_CONFIGURED`. Digital tickets require confirmed payment and authorized issuance (Feature 05.4).

---

## 6. Known Blockers & Production Operational Status

> [!IMPORTANT]
> **CODE COMPLETE BUT LIVE OPERATOR INTEGRATION PENDING**
>
> 1. **Live Transport Operators:** The repository lacks contracted integration with live railway, airline, or bus dispatchers.
> 2. **Authoritative Fare Authority:** Real-time dynamic quotation engines are unconfigured in production.
> 3. **Production Booking Status:** The reservation engine is architecturally established and verified with authorized test fixtures, but live production reservations remain **safely disabled** via `UnavailableBookingService`.
> 4. **Feature 05.3.2 Prerequisite:** Atomic inventory hold locks and database transaction procedures will be implemented in Task 05.3.2.
