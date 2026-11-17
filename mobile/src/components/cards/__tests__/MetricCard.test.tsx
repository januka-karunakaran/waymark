import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MetricCard } from '../MetricCard';

describe('MetricCard Component', () => {
  // TC-02.5-17: MetricCard renders supplied values
  it('TC-02.5-17: renders supplied title and value correctly', () => {
    render(
      <MetricCard
        title="Estimated Transit"
        value="18"
        testID="transit-metric"
      />
    );

    expect(screen.getByText('Estimated Transit')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
  });

  // TC-02.5-18: Optional units render correctly
  it('TC-02.5-18: renders optional unit text alongside numeric value', () => {
    render(
      <MetricCard
        title="Telemetry Speed"
        value={42}
        unit="KM/H"
        testID="speed-metric"
      />
    );

    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('KM/H')).toBeTruthy();
  });

  // TC-02.5-19: Trend indicator renders with explicit semantics
  it('TC-02.5-19: renders explicit trend direction and label without implicit assumptions', () => {
    render(
      <MetricCard
        title="Buffer Time"
        value="0"
        unit="min"
        trend="neutral"
        trendLabel="+0m buffer"
        testID="buffer-metric"
      />
    );

    expect(screen.getByText('+0m buffer')).toBeTruthy();
  });

  // TC-02.5-20: Missing optional trend data is handled safely
  it('TC-02.5-20: handles absent trend data safely without rendering broken badges', () => {
    render(
      <MetricCard
        title="Corridor Altitude"
        value="12"
        unit="m MSL"
        testID="altitude-metric"
      />
    );

    expect(screen.queryByTestId('altitude-metric-trend')).toBeNull();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('m MSL')).toBeTruthy();
  });

  it('supports interaction callback when pressable', () => {
    const handlePress = jest.fn();
    render(
      <MetricCard
        title="Tap Target"
        value="100"
        onPress={handlePress}
        testID="press-metric"
      />
    );

    fireEvent.press(screen.getByTestId('press-metric'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
