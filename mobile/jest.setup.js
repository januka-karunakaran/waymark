import '@testing-library/react-native';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => {
  const listeners = [];
  const mockNetInfo = {
    addEventListener: jest.fn((callback) => {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      };
    }),
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi'
      })
    ),
    __simulateStateChange: (state) => {
      listeners.forEach((callback) => callback(state));
    }
  };
  return {
    __esModule: true,
    default: mockNetInfo,
    ...mockNetInfo
  };
});

// Mock SecureStore
jest.mock('expo-secure-store', () => {
  const store = new Map();
  const mockStore = {
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => {
      return Promise.resolve(store.get(key) || null);
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    })
  };
  return {
    __esModule: true,
    default: mockStore,
    ...mockStore
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 44, right: 0, bottom: 34, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true)
  }),
  usePathname: () => '/',
  useSegments: () => [],
  Tabs: Object.assign(({ children }) => children, {
    Screen: () => null
  }),
  Stack: Object.assign(({ children }) => children, {
    Screen: () => null
  }),
  Link: ({ children }) => children
}));
