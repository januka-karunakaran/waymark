import React from 'react';
import { View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { InfoCard } from '../InfoCard';

describe('InfoCard Component', () => {
  // TC-02.5-13: InfoCard renders title and description
  it('TC-02.5-13: renders title and description clearly', () => {
    render(
      <InfoCard
        title="Ratmalana Skyport"
        description="Autonomous Air Shuttle boarding zone with step-free ramps."
        testID="skyport-card"
      />
    );

    expect(screen.getByText('Ratmalana Skyport')).toBeTruthy();
    expect(
      screen.getByText(
        'Autonomous Air Shuttle boarding zone with step-free ramps.'
      )
    ).toBeTruthy();
  });

  // TC-02.5-14: Optional metadata and status are displayed
  it('TC-02.5-14: displays status badge and footer metadata when provided', () => {
    render(
      <InfoCard
        title="Bus B12"
        status="ON TIME"
        statusVariant="nominal"
        metadata="SYS.LOC // LK-CMB-KDY"
        testID="bus-card"
      />
    );

    expect(screen.getByText('ON TIME')).toBeTruthy();
    expect(screen.getByText('SYS.LOC // LK-CMB-KDY')).toBeTruthy();
  });

  // TC-02.5-15: Long descriptions remain supported
  it('TC-02.5-15: supports extensive descriptions without clipping or errors', () => {
    const longDesc =
      'Transit route connects KDU Gate to Kandy City Centre avoiding heavy monsoon water surge areas. Features synchronized avionics flight paths, low-sensory boarding sections, real-time telemetry updates, and universal baseline accessibility across all hubs.';

    render(
      <InfoCard
        title="Long Route Profile"
        description={longDesc}
        testID="long-card"
      />
    );

    expect(screen.getByText(longDesc)).toBeTruthy();
  });

  // TC-02.5-16: Interactive InfoCard works correctly
  it('TC-02.5-16: triggers onPress callback on pressable InfoCard', () => {
    const handlePress = jest.fn();
    render(
      <InfoCard
        title="Selectable Hub"
        onPress={handlePress}
        testID="press-hub-card"
      />
    );

    const card = screen.getByTestId('press-hub-card');
    fireEvent.press(card);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders leading icon and supporting microcopy', () => {
    render(
      <InfoCard
        title="Audio Guidance Node"
        leadingIcon={<View testID="icon-stub" />}
        supportingText="Includes high-contrast visual display"
        testID="audio-card"
      />
    );

    expect(screen.getByTestId('icon-stub')).toBeTruthy();
    expect(
      screen.getByText('Includes high-contrast visual display')
    ).toBeTruthy();
  });
});
