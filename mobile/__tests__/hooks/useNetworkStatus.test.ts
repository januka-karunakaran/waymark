import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import NetInfo from '@react-native-community/netinfo';

describe('useNetworkStatus Hook', () => {
  it('returns initial network status', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
    });
  });

  it('updates state when network status changes', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Wait for initial fetch to settle
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Now simulate offline network transition
    await act(async () => {
      (NetInfo as unknown as { __simulateStateChange: (state: unknown) => void }).__simulateStateChange({
        isConnected: false,
        isInternetReachable: false,
        type: 'none'
      });
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });
  });
});
