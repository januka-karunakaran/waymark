import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';

describe('ScreenWrapper Component', () => {
  it('renders title, subtitle, and children content', () => {
    const { getByText } = render(
      <ScreenWrapper>
        <Text>Corridor Telemetry Content</Text>
      </ScreenWrapper>
    );

    expect(getByText('WAYMARK 2100')).toBeTruthy();
    expect(getByText('PLANETARY TRANSIT NETWORK')).toBeTruthy();
    expect(getByText('SYS.LIVE')).toBeTruthy();
    expect(getByText('Corridor Telemetry Content')).toBeTruthy();
  });

  it('renders custom title and controls telemetry strip', () => {
    const { getByText, queryByText } = render(
      <ScreenWrapper
        title="CUSTOM TITLE"
        subtitle="CUSTOM SUB"
        showTelemetryStrip={false}
      >
        <Text>Body</Text>
      </ScreenWrapper>
    );

    expect(getByText('CUSTOM TITLE')).toBeTruthy();
    expect(getByText('CUSTOM SUB')).toBeTruthy();
    expect(queryByText('City network: running normally')).toBeNull();
  });
});
