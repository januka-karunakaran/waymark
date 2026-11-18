import React from 'react';
import { render } from '@testing-library/react-native';
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner';
import * as networkHook from '../../src/hooks/useNetworkStatus';

describe('NetworkStatusBanner Component', () => {
  it('renders nothing when network is connected', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      connectionType: 'wifi'
    });

    const { queryByRole } = render(<NetworkStatusBanner />);
    expect(queryByRole('alert')).toBeNull();
  });

  it('renders offline warning banner when disconnected', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      connectionType: 'none'
    });

    const { getByRole, getByText } = render(<NetworkStatusBanner />);
    expect(getByRole('alert')).toBeTruthy();
    expect(
      getByText('TRANSIT LINK OFFLINE · OPERATING WITH LOCAL DEFAULTS')
    ).toBeTruthy();
  });
});
