# Waymark Mobile — Feature 05.2: Trip Selection, Ticket Catalog & Booking UI
## Architecture & UI Specification
### Document: `docs/architecture/FEATURE_05_2_BOOKING_UI.md`
**Owner:** Sathu (`Sathurjanv23`) | **Reviewer:** Janu (`januka-karunakaran`)
**Status:** In Progress (Task 05.2.1 Active)

---

## 1. Feature Overview & Design Philosophy

Feature 05.2 introduces the presentation layer for Waymark Mobile's transportation ticketing experience, adhering to the futuristic cyberpunk/sci-fi transit aesthetic (**Waymark 2100**).

The core design philosophy is:
> **Truthful Presentation & Zero Simulation:** The booking UI offers a polished, responsive, and accessible experience for exploring transit options and reviewing fares. However, when verified operator integrations or reservation engines are inactive, the interface renders explicit, informative unavailable states rather than fabricating mock departures, synthetic seats, or simulated checkout flows.

---

## 2. Route Hierarchy & Expo Router Structure

The booking feature uses a dedicated top-level route group to avoid collision with tabs or authentication stacks:

```text
mobile/app/booking/
├── _layout.tsx                          # Stack layout (dark surface, no default header)
├── index.tsx                            # Booking Landing Screen (/booking)
├── catalog.tsx                          # Verified Trip Catalog Screen (/booking/catalog - Task 05.2.2)
├── departure/
│   └── [departureId].tsx                # Departure Detail & Passenger Selector (Task 05.2.3)
└── review.tsx                           # Pre-booking Summary & Readiness Check (Task 05.2.3)
```

### Route Descriptions:
- **`/booking` (Landing)**: Entry hub providing context on interplanetary transit ticketing, real-time readiness status, quick link to verified catalog, and return navigation to Journey or Home.
- **`/booking/catalog`**: Filterable search screen querying `TransitInventoryProvider` with transit mode filtering, search keyword querying, and departure sorting.
- **`/booking/departure/[departureId]`**: Detailed view of verified departures with passenger selection (1–9) and authoritative fare quotation.
- **`/booking/review`**: Pre-booking summary reviewing departure, passengers, and fare quote expiry.

---

## 3. Shared Ticketing UI Components

Located in `mobile/src/features/booking/components/`:

| Component | Responsibility | Props / Key Features |
| :--- | :--- | :--- |
| **`BookingScreenShell`** | Safe-area container with scrollable and fixed modes | `children`, `scrollable`, `style`, `contentContainerStyle` |
| **`BookingHeader`** | Waymark branded header with back action & kicker | `title`, `subtitle`, `showBack`, `onBack`, `kicker` |
| **`BookingStatusNotice`** | Contextual alert banner for provider & network states | `variant` (`info`, `warning`, `error`, `success`), `title`, `message` |
| **`BookingEmptyState`** | Polished empty/degraded state with primary/secondary actions | `icon`, `title`, `message`, `actionLabel`, `onAction` |
| **`DepartureCard`** | Presentation card for `BookableDeparture` | Origin/Destination, timestamps, operator badge, status dot |
| **`FareDisplay`** | Authoritative quotation component formatted from minor units | Minor-to-major currency conversion, expiration time, passenger count |

---

## 4. Trip Catalog & Query Architecture (Task 05.2.2)

The Trip Catalog screen (`/booking/catalog`) queries the configured `TransitInventoryProvider`:

1. **`useTripCatalog` Hook**:
   - Manages asynchronous queries with an unmount-safe and stale-response guard (`activeRequestIdRef`).
   - Strictly enforces that only `inventorySource === 'operator_verified'` departures are exposed to the client catalog.
   - Provides client-side multi-mode filtering (`All Modes`, `Maglev`, `Hyperloop`, `Bus`, `Air`), date filtering, and case-insensitive keyword searching across origin, destination, service identifier, and operator ID.
   - Offers sorting by `earliest` departure time, `latest` departure time, or travel `duration`.
   - Defaults safely to `UnavailableInventoryProvider`, returning typed degraded states and zero synthesized departures when live integrations are absent.

2. **Catalog Presentation & UX**:
   - Renders departures through an accessible `FlatList` with `DepartureCard` items.
   - Distinct, truthful empty states for:
     - Loading: active indicator with accessible progress label.
     - Unavailable Provider: informative banner indicating unconfigured live inventory.
     - Empty Corridor: explicit "No Scheduled Departures" message with refresh capability.
     - Filter Mismatch: clear message offering a single-tap "Clear Filters" action.

---

## 5. Departure Details, Passenger Selection & Fare Review (Task 05.2.3)

### Route Implementations:
- **`/booking/departure/[departureId]`**:
  - Validates departure identifier and queries `TransitInventoryProvider.getDeparture(departureId)` and `checkAvailability(departureId)`.
  - Rejects unverified sample data (`inventorySource !== 'operator_verified'`).
  - Provides interactive `PassengerSelector` bounded between 1 and 9 passengers.
  - Integrates `useFareQuote` hook to obtain authoritative server quotes in integer minor units.
  - Automatically invalidates existing quotes on passenger count or fare class changes.
  - Provides "Continue to Review" CTA once valid departure, capacity, and active quote are verified.

- **`/booking/review`**:
  - In-memory pre-booking summary populated via `BookingReviewContext`.
  - Zero URL parameter pollution: no fare amounts, currencies, user emails, or tokens in route parameters.
  - Active expiration scheduling: automatically schedules a re-render/invalidation when `fareQuote.expiresAt` is reached, preventing stale UI state from being considered valid.
  - Guarded against direct-link access (renders empty state with return to catalog).
  - Explicitly demarcates future functionality with disabled "Reservations Coming Soon" button (no simulated booking records, fake IDs, or payment checkout).

---

## 6. Entry Points & Journey Navigation

- **Contextual Discovery in Journey**: An understated secondary action (`Explore Tickets`) is provided within the Journey destination context card.
- **Privacy Preservation**: The route transition `/booking` carries zero private parameters (no saved place strings, coordinates, or user tokens).
- **Guest Access**: Guest users may explore the booking landing screen, public catalog, departure details, and pre-booking review without authentication challenges. Authentication will only be enforced when initiating a reservation in Feature 05.3.

---

## 7. Security & Product Demarcation

1. **No Client-Controlled Pricing**: The UI components strictly format authoritative quotes (`FareQuote`) issued by trusted providers.
2. **Readiness Truthfulness**: When `TransitInventoryProvider` reports `not_configured`, the UI explicitly displays "Ticketing Engine Inactive" and "Reservations Coming Soon".
3. **No Fabricated Confirmations**: The UI never produces fake QR codes, confirmation numbers, or simulated payment receipts.

---

## 8. Final QA & Feature 05.3 Handoff (Task 05.2.4)

Feature 05.2 is **CODE COMPLETE** with 100% passing automated quality gates:
- See full test execution and security analysis in `docs/qa/FEATURE_05_2_BOOKING_UI_QA.md`.
- Handoff ready for **Feature 05.3 — Reservation Engine, Inventory Allocation & Booking Lifecycle**.
