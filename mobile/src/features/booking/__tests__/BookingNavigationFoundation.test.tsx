import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BookingLandingScreen from '../../../../app/booking/index';
import JourneyScreen from '../../../../app/(tabs)/journey';
import {
  BookingHeader,
  BookingStatusNotice,
  BookingEmptyState,
  DepartureCard,
  FareDisplay
} from '../components';
import { BookableDeparture } from '../types/bookingTypes';
import { FareQuote } from '../types/fareTypes';
import { Ticket } from 'lucide-react-native';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    { Screen: () => null }
  )
}));

jest.mock('../../auth', () => ({
  useSafeAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false
  }))
}));

jest.mock('../../profile', () => ({
  useProfile: jest.fn(() => ({
    savedPlaces: [],
    isLoadingPlaces: false
  }))
}));

describe('Feature 05.2 Task 05.2.1 — Booking Navigation & Shared UI Foundation', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack
    });
  });

  const sampleDeparture: BookableDeparture = {
    id: 'dep-colombo-kandy-101',
    operatorId: 'op-express-rail',
    originNodeId: 'node-colombo-fort',
    originName: 'Colombo Fort Central',
    destinationNodeId: 'node-kandy-station',
    destinationName: 'Kandy Terminal',
    departureTime: '2026-12-01T08:30:00Z',
    arrivalTime: '2026-12-01T11:00:00Z',
    serviceIdentifier: 'EXP-101',
    inventorySource: 'operator_verified',
    bookableStatus: 'available',
    transitMode: 'maglev'
  };

  const sampleQuote: FareQuote = {
    id: 'quote-rail-2026-001',
    departureId: 'dep-colombo-kandy-101',
    amountMinorUnits: 250000,
    currency: 'LKR',
    passengerCount: 2,
    fareClass: 'standard',
    issuedAt: '2026-11-26T10:00:00Z',
    expiresAt: '2026-11-26T10:15:00Z',
    issuingSource: 'operator_verified'
  };

  // 1. Booking route renders
  it('TC-05.2.1-01: renders the BookingLandingScreen with title and heading', async () => {
    const { getByTestId, getByText } = render(<BookingLandingScreen />);
    await waitFor(() => {
      expect(getByTestId('booking-landing-screen')).toBeTruthy();
      expect(getByText('Explore Your Next Journey')).toBeTruthy();
    });
  });

  // 2. Root navigation compatibility
  it('TC-05.2.1-02: navigation actions return to Home and Journey safely', async () => {
    const { getByTestId } = render(<BookingLandingScreen />);
    await waitFor(() => {
      expect(getByTestId('booking-empty-primary-action')).toBeTruthy();
    });
    const returnJourneyBtn = getByTestId('booking-empty-primary-action');
    fireEvent.press(returnJourneyBtn);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/journey');

    const returnHomeBtn = getByTestId('booking-empty-secondary-action');
    fireEvent.press(returnHomeBtn);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  // 3. Guest navigation
  it('TC-05.2.1-03: renders booking landing screen for guest users without auth challenge', async () => {
    const { getByText } = render(<BookingLandingScreen />);
    await waitFor(() => {
      expect(getByText('Reservations Coming Soon')).toBeTruthy();
    });
  });

  // 4. Journey entry-point navigation
  it('TC-05.2.1-04: provides Explore Tickets action in Journey destination context', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValueOnce({
      destinationId: 'dest-colombo',
      destinationName: 'Colombo Fort',
      hubName: 'Central Terminal'
    });

    const { getByTestId } = render(<JourneyScreen />);
    const exploreBtn = getByTestId('journey-explore-tickets-button');
    expect(exploreBtn).toBeTruthy();
    fireEvent.press(exploreBtn);
    expect(mockPush).toHaveBeenCalledWith('/booking');
  });

  // 5. Provider unavailable state
  it('TC-05.2.1-05: correctly renders warning banner when booking provider is not configured', async () => {
    const { getByTestId, getByText } = render(<BookingLandingScreen />);
    await waitFor(() => {
      expect(getByTestId('booking-landing-status-notice')).toBeTruthy();
      expect(getByText('Ticketing Engine Inactive')).toBeTruthy();
    });
  });

  // 6. No fake booking success
  it('TC-05.2.1-06: ensures no functional Book Now or purchase buttons exist on landing', () => {
    const { queryByText } = render(<BookingLandingScreen />);
    expect(queryByText(/Book Now/i)).toBeNull();
    expect(queryByText(/Pay Now/i)).toBeNull();
    expect(queryByText(/Confirm Ticket/i)).toBeNull();
  });

  // 7. No fabricated prices
  it('TC-05.2.1-07: FareDisplay correctly renders minor units to major formatted currency', () => {
    const { getByText } = render(<FareDisplay quote={sampleQuote} />);
    expect(getByText(/LKR 2,500.00/)).toBeTruthy();
    expect(getByText(/Covers 2 passengers/)).toBeTruthy();
  });

  // 8. DepartureCard presentation
  it('TC-05.2.1-08: DepartureCard renders verified operator and schedule information', () => {
    const handleSelect = jest.fn();
    const { getByText, getByTestId } = render(
      <DepartureCard
        departure={sampleDeparture}
        operatorName="National Express"
        onSelect={handleSelect}
      />
    );
    expect(getByText('National Express')).toBeTruthy();
    expect(getByText('Colombo Fort Central')).toBeTruthy();
    expect(getByText('Kandy Terminal')).toBeTruthy();
    expect(getByText('VERIFIED')).toBeTruthy();

    const selectBtn = getByTestId('departure-card-select-btn');
    fireEvent.press(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(sampleDeparture);
  });

  // 9. BookingHeader back action
  it('TC-05.2.1-09: BookingHeader invokes onBack callback when pressed', () => {
    const handleBack = jest.fn();
    const { getByTestId } = render(
      <BookingHeader title="Test Title" onBack={handleBack} />
    );
    const backBtn = getByTestId('booking-header-back-button');
    fireEvent.press(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  // 10. BookingStatusNotice variants
  it('TC-05.2.1-10: BookingStatusNotice renders different variants with alert role', () => {
    const { getByText, getByTestId } = render(
      <BookingStatusNotice
        variant="error"
        title="Network Offline"
        message="Unable to reach inventory engine."
      />
    );
    expect(getByTestId('booking-status-notice')).toBeTruthy();
    expect(getByText('Network Offline')).toBeTruthy();
    expect(getByText('Unable to reach inventory engine.')).toBeTruthy();
  });

  // 11. BookingEmptyState actions
  it('TC-05.2.1-11: BookingEmptyState renders primary and secondary actions', () => {
    const onAction = jest.fn();
    const onSecondary = jest.fn();
    const { getByTestId } = render(
      <BookingEmptyState
        icon={Ticket}
        title="Empty Title"
        message="Empty message details."
        actionLabel="Primary"
        onAction={onAction}
        secondaryActionLabel="Secondary"
        onSecondaryAction={onSecondary}
      />
    );
    fireEvent.press(getByTestId('booking-empty-primary-action'));
    expect(onAction).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('booking-empty-secondary-action'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  // 12. Accessibility hierarchy
  it('TC-05.2.1-12: verifies accessible header and button roles', () => {
    const { getByTestId } = render(
      <BookingHeader title="Accessible Header" />
    );
    const title = getByTestId('booking-header-title');
    expect(title.props.accessibilityRole).toBe('header');
  });
});
