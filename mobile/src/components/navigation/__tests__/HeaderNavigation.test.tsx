import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../../../../app/(tabs)/index';
import MapScreen from '../../../../app/(tabs)/map';
import JourneyScreen from '../../../../app/(tabs)/journey';
import OracleScreen from '../../../../app/(tabs)/oracle';
import ComfortScreen from '../../../../app/(tabs)/comfort';
import { ScreenWrapper } from '../../ScreenWrapper';

describe('Screen Header Integration & Navigation Flow', () => {
  // TC-02.7-15: Home header renders correctly
  it('TC-02.7-15: Home screen renders header and foundation content', () => {
    render(<HomeScreen />);
    expect(screen.getByText('WAYMARK 2100')).toBeTruthy();
    expect(screen.getByText('PLANETARY TRANSIT NETWORK')).toBeTruthy();
    expect(screen.getByText('Good morning, navigator')).toBeTruthy();
  });

  // TC-02.7-16: Live Map header renders correctly
  it('TC-02.7-16: Live Map screen renders custom header title and subtitle', () => {
    render(<MapScreen />);
    expect(screen.getByText('LIVE MAP')).toBeTruthy();
    expect(screen.getByText('MULTIMODAL RADAR HUD')).toBeTruthy();
    expect(screen.getByText('Live Map Vector Canvas')).toBeTruthy();
  });

  // TC-02.7-17: Journey header renders correctly
  it('TC-02.7-17: Journey screen renders custom header title and subtitle', () => {
    render(<JourneyScreen />);
    expect(screen.getByText('MISSION ROUTE')).toBeTruthy();
    expect(screen.getByText('ACTIVE TRANSIT TIMELINE')).toBeTruthy();
    expect(screen.getByText('Active Journey Timeline')).toBeTruthy();
  });

  // TC-02.7-18: Oracle header renders correctly
  it('TC-02.7-18: Oracle screen renders custom header title and subtitle', () => {
    render(<OracleScreen />);
    expect(screen.getByText('ORACLE CONCIERGE')).toBeTruthy();
    expect(screen.getByText('AVIONICS AI ASSISTANT')).toBeTruthy();
    expect(screen.getByText('Oracle Transit Concierge')).toBeTruthy();
  });

  // TC-02.7-19: Comfort header renders correctly
  it('TC-02.7-19: Comfort screen renders custom header title and subtitle', () => {
    render(<ComfortScreen />);
    expect(screen.getByText('COMFORT & TELEMETRY')).toBeTruthy();
    expect(screen.getByText('SENSORY CALIBRATION')).toBeTruthy();
    expect(screen.getByText('Comfort Preferences')).toBeTruthy();
  });

  // TC-02.7-20: ScreenWrapper does not create duplicate headers
  it('TC-02.7-20: ScreenWrapper renders exactly one header component', () => {
    render(
      <ScreenWrapper title="Single Header Test" subtitle="No duplicates">
        <Text>Screen Body Content</Text>
      </ScreenWrapper>
    );

    const headers = screen.getAllByTestId('screen-header');
    expect(headers).toHaveLength(1);
    expect(screen.getByText('Single Header Test')).toBeTruthy();
  });

  // TC-02.7-21: Existing screen content is preserved
  it('TC-02.7-21: preserves existing screen body children within ScreenWrapper', () => {
    render(
      <ScreenWrapper>
        <Text testID="unique-screen-content">Preserved Telemetry Data</Text>
      </ScreenWrapper>
    );

    expect(screen.getByTestId('unique-screen-content')).toBeTruthy();
    expect(screen.getByText('Preserved Telemetry Data')).toBeTruthy();
  });

  // TC-02.7-32: Unavailable telemetry is not displayed as verified live data
  it('TC-02.7-32: telemetry strip can be cleanly omitted when telemetry is unavailable', () => {
    render(
      <ScreenWrapper
        title="Offline Screen"
        showTelemetryStrip={false}
      >
        <Text>Content</Text>
      </ScreenWrapper>
    );

    expect(screen.queryByTestId('screen-telemetry-strip')).toBeNull();
  });
});
